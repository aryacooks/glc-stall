import { NextResponse } from 'next/server';
import { estimateCostForModel } from '@/lib/aiModelsConfig';

export const maxDuration = 60; // Allow sufficient time for image generation on edge/serverless

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const apiKey = (
      req.headers.get('x-openrouter-key') ||
      body.apiKey ||
      process.env.OPENROUTER_API_KEY ||
      ''
    ).trim();

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'OpenRouter API Key is required. Please enter it in the Operator Settings tab.' },
        { status: 400 }
      );
    }

    // Action 1: Test API Key connection & fetch account usage/limits
    if (body.action === 'test' || body.action === 'key_info') {
      try {
        const testRes = await fetch('https://openrouter.ai/api/v1/auth/key', {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        const testData = await testRes.json();
        if (!testRes.ok) {
          return NextResponse.json(
            { success: false, error: testData.error?.message || 'Invalid OpenRouter API Key.' },
            { status: testRes.status }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'OpenRouter API Key is valid and connected!',
          keyInfo: testData.data,
        });
      } catch (err: any) {
        return NextResponse.json(
          { success: false, error: err.message || 'Failed to connect to OpenRouter key verification endpoint.' },
          { status: 502 }
        );
      }
    }

    // Action 2: Image Transformation
    const { photoUrl, prompt, model = 'openai/gpt-image-2.5-flare' } = body;

    if (!photoUrl) {
      return NextResponse.json({ success: false, error: 'Photo URL or image data is required.' }, { status: 400 });
    }

    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Transformation prompt is required.' }, { status: 400 });
    }

    const fallbackCost = estimateCostForModel(model);
    const origin = req.headers.get('origin') || req.headers.get('host') || 'http://localhost:3000';
    const siteUrl = origin.startsWith('http') ? origin : `https://${origin}`;

    // Step A: Attempt Dedicated Image API (POST /api/v1/images)
    try {
      const imagesRes = await fetch('https://openrouter.ai/api/v1/images', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': siteUrl,
          'X-Title': 'NEXORA Time Machine Stall',
        },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          input_references: [
            {
              type: 'image_url',
              image_url: {
                url: photoUrl,
              },
            },
          ],
        }),
      });

      if (imagesRes.ok) {
        const json = await imagesRes.json();
        const item = json.data?.[0];
        const cost = json.usage?.cost ?? json.cost ?? fallbackCost;
        if (item) {
          if (item.url) {
            return NextResponse.json({
              success: true,
              imageUrl: item.url,
              model,
              cost: Number(cost),
              usage: json.usage,
              method: 'images',
            });
          }
          if (item.b64_json) {
            const mediaType = item.media_type || 'image/png';
            return NextResponse.json({
              success: true,
              imageUrl: `data:${mediaType};base64,${item.b64_json}`,
              model,
              cost: Number(cost),
              usage: json.usage,
              method: 'images',
            });
          }
        }
      } else {
        const errText = await imagesRes.text();
        console.warn('OpenRouter /api/v1/images returned error, attempting /chat/completions fallback:', errText);
      }
    } catch (imagesErr) {
      console.warn('OpenRouter /api/v1/images request threw, trying /chat/completions fallback:', imagesErr);
    }

    // Step B: Fallback to Chat Completions
    const tryChatCompletions = async (requestedModalities?: string[]) => {
      const payload: any = {
        model: model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: photoUrl } },
            ],
          },
        ],
      };
      if (requestedModalities && requestedModalities.length > 0) {
        payload.modalities = requestedModalities;
      }

      return await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': siteUrl,
          'X-Title': 'NEXORA Time Machine Stall',
        },
        body: JSON.stringify(payload),
      });
    };

    // Try with modalities: ['image'] first (required for models like openai/gpt-image-2.5-flare)
    let chatRes = await tryChatCompletions(['image']);

    if (!chatRes.ok) {
      const errClone = await chatRes.clone().json().catch(() => ({}));
      const errMsg = errClone?.error?.message || '';
      console.warn('Chat completion with modalities: ["image"] failed:', errMsg);

      // If modalities was rejected or not supported, retry without modalities
      if (errMsg.toLowerCase().includes('modalit') || chatRes.status === 400 || chatRes.status === 404) {
        const retryWithoutModalities = await tryChatCompletions(undefined);
        if (retryWithoutModalities.ok) {
          chatRes = retryWithoutModalities;
        } else {
          // Also try with ['image', 'text']
          const retryBothModalities = await tryChatCompletions(['image', 'text']);
          if (retryBothModalities.ok) {
            chatRes = retryBothModalities;
          }
        }
      }
    }

    if (!chatRes.ok) {
      const errJson = await chatRes.json().catch(() => ({}));
      const msg = errJson.error?.message || `OpenRouter API returned error ${chatRes.status}`;
      return NextResponse.json({ success: false, error: msg }, { status: chatRes.status });
    }

    const chatData = await chatRes.json();
    const choice = chatData.choices?.[0];
    const message = choice?.message;

    // Calculate actual cost or fallback
    const reportedCost = chatData.usage?.cost ?? chatData.usage?.total_cost ?? chatData.cost;
    const finalCost = typeof reportedCost === 'number' && reportedCost > 0
      ? reportedCost
      : fallbackCost;

    // Check for images in message.images array or choice.images
    const imagesList = message?.images || choice?.images || (choice?.image ? [choice.image] : null);
    if (imagesList && Array.isArray(imagesList) && imagesList.length > 0) {
      const imgItem = imagesList[0];
      const rawUrl = typeof imgItem === 'string'
        ? imgItem
        : (imgItem.image_url?.url || imgItem.url || (imgItem.b64_json ? `data:image/png;base64,${imgItem.b64_json}` : null));
      if (rawUrl) {
        return NextResponse.json({
          success: true,
          imageUrl: rawUrl.startsWith('data:') || rawUrl.startsWith('http') ? rawUrl : `data:image/png;base64,${rawUrl}`,
          model,
          cost: Number(finalCost),
          usage: chatData.usage,
          method: 'chat.images',
        });
      }
    }

    // Check content string or array
    const content = message?.content;
    if (typeof content === 'string') {
      // 1. Data URL
      const dataUriMatch = content.match(/data:image\/[a-zA-Z0-9+]+;base64,[A-Za-z0-9+/=]+/);
      if (dataUriMatch) {
        return NextResponse.json({
          success: true,
          imageUrl: dataUriMatch[0],
          model,
          cost: Number(finalCost),
          usage: chatData.usage,
          method: 'chat.content_data_uri',
        });
      }

      // 2. Markdown image ![alt](url)
      const mdMatch = content.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
      if (mdMatch) {
        return NextResponse.json({
          success: true,
          imageUrl: mdMatch[1],
          model,
          cost: Number(finalCost),
          usage: chatData.usage,
          method: 'chat.content_markdown',
        });
      }

      // 3. Raw URL
      const urlMatch = content.match(/https?:\/\/[^\s"'\\]+\.(?:png|jpe?g|webp|gif)/i);
      if (urlMatch) {
        return NextResponse.json({
          success: true,
          imageUrl: urlMatch[0],
          model,
          cost: Number(finalCost),
          usage: chatData.usage,
          method: 'chat.content_url',
        });
      }
    } else if (Array.isArray(content)) {
      for (const part of content) {
        if (part.type === 'image_url' && part.image_url?.url) {
          return NextResponse.json({
            success: true,
            imageUrl: part.image_url.url,
            model,
            cost: Number(finalCost),
            usage: chatData.usage,
            method: 'chat.content_part',
          });
        }
        if (part.type === 'image' && (part.image || part.url)) {
          return NextResponse.json({
            success: true,
            imageUrl: part.image || part.url,
            model,
            cost: Number(finalCost),
            usage: chatData.usage,
            method: 'chat.content_part',
          });
        }
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'OpenRouter returned a response, but no generated image could be extracted. Please check model compatibility or prompt phrasing.',
        rawResponse: chatData,
      },
      { status: 502 }
    );
  } catch (error: any) {
    console.error('Error in /api/transform/openrouter:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error while processing image transformation' },
      { status: 500 }
    );
  }
}

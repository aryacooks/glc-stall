import { NextResponse } from 'next/server';

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

    // Action 1: Test API Key connection
    if (body.action === 'test') {
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
    }

    // Action 2: Image Transformation
    const { photoUrl, prompt, model = 'openai/gpt-image-2.5-flare' } = body;

    if (!photoUrl) {
      return NextResponse.json({ success: false, error: 'Photo URL or image data is required.' }, { status: 400 });
    }

    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Transformation prompt is required.' }, { status: 400 });
    }

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
          input_references: [photoUrl],
        }),
      });

      if (imagesRes.ok) {
        const json = await imagesRes.json();
        const item = json.data?.[0];
        if (item) {
          if (item.url) {
            return NextResponse.json({ success: true, imageUrl: item.url, model, method: 'images' });
          }
          if (item.b64_json) {
            const mediaType = item.media_type || 'image/png';
            return NextResponse.json({
              success: true,
              imageUrl: `data:${mediaType};base64,${item.b64_json}`,
              model,
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

    // Step B: Fallback to Chat Completions with modalities: ['image', 'text']
    const chatRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': siteUrl,
        'X-Title': 'NEXORA Time Machine Stall',
      },
      body: JSON.stringify({
        model: model,
        modalities: ['image', 'text'],
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: photoUrl } },
            ],
          },
        ],
      }),
    });

    if (!chatRes.ok) {
      const errJson = await chatRes.json().catch(() => ({}));
      const msg = errJson.error?.message || `OpenRouter API returned error ${chatRes.status}`;
      return NextResponse.json({ success: false, error: msg }, { status: chatRes.status });
    }

    const chatData = await chatRes.json();
    const choice = chatData.choices?.[0];
    const message = choice?.message;

    // Check for images in message.images array
    if (message?.images && Array.isArray(message.images) && message.images.length > 0) {
      const imgItem = message.images[0];
      const imgUrl = typeof imgItem === 'string' ? imgItem : imgItem.url || imgItem.b64_json;
      if (imgUrl) {
        return NextResponse.json({
          success: true,
          imageUrl: imgUrl.startsWith('data:') || imgUrl.startsWith('http') ? imgUrl : `data:image/png;base64,${imgUrl}`,
          model,
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
        return NextResponse.json({ success: true, imageUrl: dataUriMatch[0], model, method: 'chat.content_data_uri' });
      }

      // 2. Markdown image ![alt](url)
      const mdMatch = content.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
      if (mdMatch) {
        return NextResponse.json({ success: true, imageUrl: mdMatch[1], model, method: 'chat.content_markdown' });
      }

      // 3. Raw URL
      const urlMatch = content.match(/https?:\/\/[^\s"'\\]+\.(?:png|jpe?g|webp|gif)/i);
      if (urlMatch) {
        return NextResponse.json({ success: true, imageUrl: urlMatch[0], model, method: 'chat.content_url' });
      }
    } else if (Array.isArray(content)) {
      for (const part of content) {
        if (part.type === 'image_url' && part.image_url?.url) {
          return NextResponse.json({ success: true, imageUrl: part.image_url.url, model, method: 'chat.content_part' });
        }
        if (part.type === 'image' && (part.image || part.url)) {
          return NextResponse.json({ success: true, imageUrl: part.image || part.url, model, method: 'chat.content_part' });
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

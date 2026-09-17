import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = (SUPABASE_URL && SERVICE_KEY)
  ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
  : null;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { webhookUrl, photoId, ticketNumber, guestName, styleId, styleName, rawPhotoUrl, prompt } = body;

    if (!webhookUrl) {
      return NextResponse.json({ success: false, error: 'n8n webhook URL is required' }, { status: 400 });
    }

    // Determine public callback URL for n8n to send the result back
    const origin = req.headers.get('origin') || req.headers.get('host') || 'http://localhost:3000';
    const callbackUrl = origin.startsWith('http') ? `${origin}/api/webhook/n8n` : `https://${origin}/api/webhook/n8n`;

    const payload = {
      photoId,
      ticketNumber,
      guestName,
      styleId,
      styleName,
      rawPhotoUrl,
      prompt,
      callbackUrl,
      timestamp: Date.now()
    };

    // Update status in Supabase
    if (supabaseAdmin && photoId) {
      await supabaseAdmin
        .from('nexora_photos')
        .update({
          status: 'processing',
          progress: 35,
          statusMessage: `n8n automation triggered (${styleName})...`
        })
        .eq('id', photoId);
    }

    // Dispatch to n8n webhook
    let n8nResponseStatus = 200;
    let n8nResponseBody = '';

    try {
      const n8nRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Nexora-GLC-Stall-Engine/1.0'
        },
        body: JSON.stringify(payload)
      });

      n8nResponseStatus = n8nRes.status;
      n8nResponseBody = await n8nRes.text();
    } catch (fetchErr: any) {
      console.warn('Direct fetch to n8n failed (check URL/network):', fetchErr.message);
      // We still return ok so operator can see it was dispatched, but log the warning
      return NextResponse.json({
        success: false,
        error: `Failed to connect to n8n webhook: ${fetchErr.message}. Make sure n8n is running and webhook is active.`
      }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      message: 'Dispatched to n8n successfully',
      n8nStatus: n8nResponseStatus,
      callbackUrl
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

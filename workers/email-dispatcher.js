// Cloudflare Worker that fetches the latest digest from Supabase and sends email via Resend

async function renderHtml(template, unsubscribeUrl) {
  return template.replace(/\{\{unsubscribe_url\}\}/g, unsubscribeUrl);
}

async function renderText(template, unsubscribeUrl) {
  return template.replace(/\{\{unsubscribe_url\}\}/g, unsubscribeUrl);
}

async function signUnsubscribe(email, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(email));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function fetchJson(url, env) {
  const response = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`,
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Supabase request feilet: ${response.status}`);
  }

  return response.json();
}

async function sendResend(env, recipient, subject, html, text) {
  console.log('📧 Attempting to send email to:', recipient.email);
  console.log('📧 From address:', env.MAIL_FROM_ADDRESS);
  console.log('📧 Subject:', subject);

  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY mangler. Sett secret i Cloudflare.');
  }

  const body = {
    from: `${env.MAIL_FROM_NAME} <${env.MAIL_FROM_ADDRESS}>`,
    to: [recipient.email],
    subject,
    html,
    text
  };

  if (env.MAIL_REPLY_TO) {
    body.reply_to = [env.MAIL_REPLY_TO];
  }

  console.log('📨 Sending to Resend API...');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.RESEND_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  console.log('📨 Resend response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('📨 Resend error response:', errorText);
    throw new Error(`Resend feilet (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  console.log('📨 Resend API call successful, ID:', result.id);
}

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${env.DISPATCH_TOKEN}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const digestUrl = `${env.SUPABASE_SERVICE_URL}/rest/v1/digest_runs?status=eq.success&order=created_at.desc&limit=1`;
    const digests = await fetchJson(digestUrl, env);
    const digest = digests[0];

    if (!digest || !digest.summary_plain) {
      return new Response(JSON.stringify({ error: 'Ingen ferdig digest' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const subscribersUrl = `${env.SUPABASE_SERVICE_URL}/rest/v1/subscribers?status=eq.confirmed&select=id,email,language`;
    const subscribers = await fetchJson(subscribersUrl, env);

    if (!subscribers.length) {
      return new Response(JSON.stringify({
        success: true,
        sent: 0,
        failed: 0,
        message: 'Ingen mottakere'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const osloDate = new Date(digest.created_at).toLocaleDateString('no-NO', { timeZone: 'Europe/Oslo' });
    const subject = `Dagens KI-brief`;
    let failures = 0;

    for (const subscriber of subscribers) {
      // Generate signature for unsubscribe
      const signature = await signUnsubscribe(subscriber.email, env.UNSUBSCRIBE_SECRET);
      // Pass parameters to external site so it can call the Budbringer API
      const unsubscribeUrl = `${env.PUBLIC_SITE_URL}?email=${encodeURIComponent(
        subscriber.email
      )}&signature=${signature}`;

      const htmlTemplate = digest.summary_html || '';
      const textTemplate = digest.summary_plain || '';
      const html = await renderHtml(htmlTemplate, unsubscribeUrl);
      const text = await renderText(textTemplate, unsubscribeUrl);

      try {
        await sendResend(env, subscriber, subject, html, text);
        console.log('✅ Email sent successfully to:', subscriber.email);
      } catch (error) {
        console.error('❌ Email send failed for', subscriber.email);
        console.error('Error details:', error.message);
        console.error('Full error:', error);
        failures += 1;
      }
    }

    const totalSent = subscribers.length - failures;

    if (failures > 0) {
      return new Response(JSON.stringify({
        success: true,
        sent: totalSent,
        failed: failures,
        message: `Ferdig med ${failures} feil`
      }), {
        status: 207,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      sent: totalSent,
      failed: 0,
      message: 'OK'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

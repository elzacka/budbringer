// Cloudflare Worker that fetches the latest digest from Supabase and sends email via MailChannels

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

async function sendMailChannels(env, recipient, subject, html, text) {
  const body = {
    personalizations: [
      {
        to: [{ email: recipient.email }]
      }
    ],
    from: {
      email: env.MAIL_FROM_ADDRESS,
      name: env.MAIL_FROM_NAME
    },
    reply_to: env.MAIL_REPLY_TO ? { email: env.MAIL_REPLY_TO } : undefined,
    subject,
    content: [
      { type: 'text/plain', value: text },
      { type: 'text/html', value: html }
    ]
  };

  const headers = { 'Content-Type': 'application/json' };
  const token = env.MAILCHANNELS_AUTH_TOKEN;

  if (!token) {
    throw new Error('MAILCHANNELS_AUTH_TOKEN mangler. Sett secret i Cloudflare.');
  }

  if (token.startsWith('mct_')) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    headers['X-Api-Key'] = token;
  }

  const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MailChannels feilet (${response.status}): ${errorText}`);
  }
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

    const subject = `Dagens KI-brief ${new Date(digest.created_at).toLocaleDateString('no-NO')}`;
    let failures = 0;

    for (const subscriber of subscribers) {
      const signature = await signUnsubscribe(subscriber.email, env.UNSUBSCRIBE_SECRET);
      const unsubscribeUrl = `${env.PUBLIC_SITE_URL}/unsubscribe?email=${encodeURIComponent(
        subscriber.email
      )}&signature=${signature}`;

      const htmlTemplate = digest.summary_html || '';
      const textTemplate = digest.summary_plain || '';
      const html = await renderHtml(htmlTemplate, unsubscribeUrl);
      const text = await renderText(textTemplate, unsubscribeUrl);

      try {
        await sendMailChannels(env, subscriber, subject, html, text);
      } catch (error) {
        console.error('Sendefeil for', subscriber.email, error);
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

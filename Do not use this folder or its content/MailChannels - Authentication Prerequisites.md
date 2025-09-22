# MailChannels authentication prerequisites

MailChannels moved Email API accounts to a token-based workflow in 2024. To send mail you now need two things:

1. An **Email API authentication token** with permission to send mail.
2. A **Domain Lockdown TXT record** for every domain (and subdomain) you plan to use in the `From:` address.

Setting up SPF, DKIM, and DMARC remains strongly recommended for deliverability, but those records are managed separately from authentication.

## 1. Generate an Email API authentication token

1. Sign in to the [MailChannels Console](https://console.mailchannels.net/).
2. Open **Settings → Access & Authentication → API Tokens** (older accounts may show **Settings → API Tokens**).
3. Click **Create token**.
4. Give the token a name (for example `budbringer-worker`).
5. Under **Scopes**, select **Email API → Send mail** (`transactional.send`). Leave other scopes unchecked unless you need them.
6. Click **Create** and copy the token value (it starts with `mct_`). You will not be able to view it again.
7. Store the token securely. In this project the token is referenced as `MAILCHANNELS_AUTH_TOKEN` and sent as a Bearer token by the Cloudflare Worker.

> ℹ️  Legacy SMTP passwords are no longer required for the Email API. If your account still shows the SMTP password tab you can leave it empty.

## 2. Publish Domain Lockdown records

Domain Lockdown is MailChannels' DNS-based allow list. It proves that you control the domain and tells MailChannels which accounts may send on its behalf.

1. Locate your **Account ID** in the upper-right corner of the console (for example `examplecorp`).
2. For each domain you send from, create a `TXT` record for the `_mailchannels` subdomain. Example for `example.com`:

   ```
   _mailchannels.example.com  TXT  v=mc1 auth=examplecorp
   ```

3. Wait for DNS to propagate (usually a few minutes, but up to 24 hours). You can verify the record with `dig _mailchannels.example.com TXT`.
4. Repeat for any additional sending domains or subdomains.

See [Secure your domain name against spoofing with Domain Lockdown](https://support.mailchannels.com/hc/en-us/articles/16918954360845-Secure-your-domain-name-against-spoofing-with-Domain-Lockdown) for advanced options such as multiple account IDs.

## 3. Call the API with the token

Include the token in the `Authorization` header when calling the Email API:

```bash
curl https://api.mailchannels.net/tx/v1/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_MAILCHANNELS_AUTH_TOKEN" \
  -d '{ "from": { "email": "hello@example.com" }, ... }'
```

Our Cloudflare Worker (`workers/email-dispatcher.ts`) already uses this header. Set `MAILCHANNELS_AUTH_TOKEN` as a secret in Cloudflare and redeploy the Worker after updating it.

## Legacy API keys (optional)

Older MailChannels accounts may still expose the **API Keys** tab with the legacy `X-Api-Key` workflow. Those keys continue to work, but MailChannels recommends migrating to auth tokens. If you are still using an API key:

- Generate the key with the `api` scope under **Settings → API Keys**.
- Pass the key in the `X-Api-Key` header instead of `Authorization`.
- You can run both methods in parallel while migrating.

When you move to auth tokens you can delete legacy API keys to reduce blast radius.

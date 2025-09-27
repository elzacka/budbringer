# CLAUDE.md - Developer Assistant Guide for Budbringer

Welcome, Claude! This file contains essential information about the Budbringer codebase to help you assist the user effectively.

## Project Overview

**Budbringer** is a Norwegian AI-powered newsletter system that generates daily digests of technology news. The system fetches RSS feeds, processes content with AI, and sends newsletters via email.

**Key Features:**
- AI-powered content generation using Claude Sonnet 4
- RSS feed aggregation from multiple sources with robots.txt compliance
- Email dispatch via Cloudflare Workers + Resend with modern design
- Admin interface for managing prompts, sources, and digest runs
- Norwegian localization (no-NO) and Oslo timezone (Europe/Oslo)
- Environment variable encryption with dotenvx
- Simplified one-click unsubscribe with automatic GDPR compliance
- External website integration for unsubscribe confirmation
- Comprehensive testing infrastructure

## Architecture

### Core Components
1. **Next.js 15.5.4** - App Router with React 19.1.1
2. **Supabase PostgreSQL** - Database with Row Level Security
3. **Cloudflare Workers** - Serverless email dispatch
4. **Resend API** - Email delivery service
5. **Anthropic Claude Sonnet 4** - Primary AI model (claude-sonnet-4-20250514)
6. **OpenAI GPT-4o** - Fallback AI model

### Database Schema (Key Tables)
- `digest_runs` - Tracks digest generation attempts with metrics
- `subscribers` - Email newsletter subscribers with status management
- `content_items` - Stores article content with full text (includes recent 'content' column)
- `content_sources` - RSS feed sources with robots.txt compliance
- `pipelines` - Content processing pipelines
- `prompts` - AI generation prompts with versioning
- `error_logs` - System errors with GDPR anonymization support

## Critical Environment Variables

### Local Development (.env.local)
**IMPORTANT**: `.env.local` is encrypted using dotenvx. You need the private key from `.env.keys` to decrypt.

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_URL=
SUPABASE_SECRET_KEY=

# AI Models
ANTHROPIC_API_KEY=

# Email Dispatch
RESEND_API_KEY=
DISPATCH_URL=https://budbringer-dispatch.lene-zachariassen.workers.dev
DISPATCH_TOKEN=
MAIL_FROM_ADDRESS=ikkesvar@tazk.no
MAIL_FROM_NAME=Budbringer
MAIL_REPLY_TO=ikkesvar@tazk.no

# Security
UNSUBSCRIBE_SECRET=

# Site
PUBLIC_SITE_URL=https://budbringer.no

# Cloudflare (for deployment)
CLOUDFLARE_API_TOKEN=
```

### Cloudflare Worker Variables
- `SUPABASE_SERVICE_URL` (same as SUPABASE_URL)
- `SUPABASE_SECRET_KEY` (same as local)
- `RESEND_API_KEY`
- `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`, `MAIL_REPLY_TO`
- `DISPATCH_TOKEN`, `UNSUBSCRIBE_SECRET`, `PUBLIC_SITE_URL`

**IMPORTANT**: Worker uses `SUPABASE_SECRET_KEY`, not `SUPABASE_SERVICE_ROLE_KEY`

## Key Commands

### Development
```bash
npm run dev              # Start development server
npm run build           # Build for production
npm run lint            # Run ESLint
```

### Digest Operations
```bash
npm run digest:generate                    # Generate new digest
npm run sources:test                      # Test RSS sources
npx tsx scripts/dailyDigest.ts           # Full digest + email dispatch
npx tsx scripts/digestGenerator.ts       # Generate only (no email)
```

### Testing
```bash
npx tsx scripts/test-worker-direct.ts    # Test Cloudflare Worker
npx tsx scripts/test-domain-config.ts    # Test domain configuration
npx tsx scripts/test-email-design.ts     # Test improved email design
npx tsx scripts/test-unsubscribe.ts      # Test unsubscribe functionality
npx tsx scripts/test-gdpr-deletion.ts    # Test GDPR data deletion
```

## File Structure

### Core Application
```
app/
├── admin/                    # Admin interface
│   ├── page.tsx             # Admin dashboard
│   └── recipients/page.tsx  # Subscriber management
├── api/                     # API routes
│   ├── admin/digest-runs/   # Delete digest runs
│   ├── gdpr/                # Legacy GDPR endpoints (manual deletion)
│   │   ├── delete/          # Manual data deletion API
│   │   └── request-deletion/ # Deletion request handler
│   ├── subscribe/           # Newsletter subscription
│   └── unsubscribe/         # Main unsubscribe with automatic GDPR deletion
├── gdpr/delete/page.tsx     # Legacy manual GDPR deletion UI (rarely used)
└── unsubscribe/page.tsx     # Primary unsubscribe page with auto data deletion

components/
├── admin/
│   ├── RunsManager.tsx      # Digest runs management with delete
│   ├── PromptsManager.tsx   # AI prompt management
│   ├── SourcesManager.tsx   # RSS source management
│   └── RecipientManager.tsx # Subscriber management
├── GDPRDeleteForm.tsx       # Legacy manual GDPR deletion form
└── SubscribeForm.tsx        # Newsletter subscription form

lib/
├── queries.ts               # Database query functions
├── news-fetcher.ts          # RSS feed fetching with robots.txt compliance
├── ai-processor.ts          # AI content generation
├── content-processor.ts     # News processing and digest generation
├── supabase-admin.ts        # Supabase service client
├── email.ts                 # Modern email template rendering
├── markdown-utils.ts        # Markdown processing for emails
└── unsubscribe.ts           # HMAC signature utilities

docs/
└── external-unsubscribe-integration.md  # Integration guide for external websites
```

### Scripts & Workers
```
scripts/
├── dailyDigest.ts           # Main orchestration script
├── digestGenerator.ts       # Content generation only
├── test-worker-direct.ts    # Worker testing
├── test-domain-config.ts    # Domain configuration testing
├── test-email-design.ts     # Email template and design testing
├── test-unsubscribe.ts      # Unsubscribe flow testing
└── test-gdpr-deletion.ts    # GDPR data deletion testing

workers/
└── email-dispatcher.js     # Cloudflare Worker for email dispatch
```

## Important Patterns

### 1. Graceful Degradation
The codebase handles missing database columns gracefully:
```typescript
// Try full update first, fall back to basic update
let { error: updateError } = await supabase
  .from('digest_runs')
  .update(fullUpdateData)
  .eq('id', run.id);

if (updateError && updateError.message?.includes('not find')) {
  console.log('Metrics columns not found, updating with basic data only');
  const { error: basicUpdateError } = await supabase
    .from('digest_runs')
    .update(basicUpdateData)
    .eq('id', run.id);
}
```

### 2. Oslo Timezone Consistency
All timestamps use Oslo timezone:
```typescript
const osloTime = new Date().toLocaleString('sv-SE', {
  timeZone: 'Europe/Oslo'
});
```

### 3. Simplified Unsubscribe with Automatic GDPR Deletion
Primary user flow - one-click complete data deletion via `/unsubscribe`:
```typescript
// app/unsubscribe/page.tsx - Handles both unsubscribe and GDPR deletion
// 1. Verify HMAC signature
if (!verifySignature(normalizedEmail, signature, secret)) {
  redirect('error page');
}

// 2. Get subscriber before deletion
const { data: subscriber } = await service.from('subscribers')
  .select('id, email').eq('email', normalizedEmail).single();

// 3. Anonymize error logs containing the email
const anonymizedMessage = log.error_message.replace(
  new RegExp(normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
  '[REDACTED]'
);

// 4. Delete subscriber record completely (GDPR compliance)
await service.from('subscribers').delete().eq('id', subscriber.id);

// 5. Create audit log without personal data
await service.from('error_logs').insert({
  error_type: 'unsubscribe_gdpr_deletion',
  error_message: `Automatic GDPR deletion completed for subscriber ID: ${subscriber.id}`,
  context: { note: 'Personal data permanently deleted per automatic unsubscribe flow' }
});

// 6. Redirect to external confirmation page
redirect(`external-site.com/confirmation?success=true&deleted=true`);
```

### 4. Markdown Processing
Modern email templates with markdown support:
```typescript
// Process markdown in email content
const processedContent = processDigestContentMarkdown(payload);

// Convert **bold** → <strong>, *italic* → <em>, [links](url) → <a>
return text
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/_([^_]+)_/g, '<em>$1</em>')
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
```

### 5. Rate Limiting
Built-in delays between RSS source fetches:
```typescript
if (i > 0) {
  await new Promise(resolve => setTimeout(resolve, 500)); // 500ms between sources
}
```

## Common Issues & Solutions

### 1. Database Schema Issues
**Issue**: Missing 'content' column in content_items table
**Cause**: Database schema out of sync
**Solution**:
- Migration added: `supabase/migrations/202509270002_add_content_column.sql`
- Run: `supabase db push` to apply migration
- Graceful degradation pattern handles missing columns

### 2. Cloudflare Worker Error 1101
**Issue**: Worker throws exception
**Cause**: Environment variable name mismatch
**Solution**: Ensure Worker uses `SUPABASE_SECRET_KEY`, not `SUPABASE_SERVICE_ROLE_KEY`

### 3. Email Delivery Failures
**Issue**: Worker succeeds but emails fail to send
**Common Causes**:
- Resend domain not verified for `tazk.no`
- Invalid Resend API key
- Rate limiting or quota issues (free tier: 3,000 emails/month)
- Large email content size

**Debugging Steps**:
1. Check Cloudflare Worker logs for detailed Resend API response
2. Verify domain in Resend dashboard: https://resend.com/domains
3. Check DNS records (SPF, DKIM) in Domeneshop
4. Test with minimal email content

### 4. TypeScript Errors
**Issue**: Build failures due to type mismatches
**Solution**: The codebase uses strict TypeScript - always check imports and types

## Testing Approach

### Email Testing Flow
1. **Generate digest**: `npm run digest:generate`
2. **Check admin panel**: Verify run shows "success" status
3. **Test worker directly**: `npx tsx scripts/test-worker-direct.ts`
4. **Test email design**: `npx tsx scripts/test-email-design.ts`
5. **Check Cloudflare logs**: Look for detailed Resend API errors

### Unsubscribe Testing
```bash
npx tsx scripts/test-unsubscribe.ts      # Test complete unsubscribe flow
# Creates test subscriber, generates signature, calls API, verifies status change
```

### GDPR Compliance Testing
```bash
npx tsx scripts/test-gdpr-deletion.ts    # Test data deletion system
# Creates test data, performs deletion, verifies anonymization and audit logs
```

### RSS Source Testing
```bash
npm run sources:test    # Test all RSS sources
npx tsx scripts/test-domain-config.ts    # Test domain configuration
```

## Code Conventions

### 1. Database Queries
- Use type-safe queries with proper TypeScript types
- Always handle errors gracefully
- Implement graceful degradation for missing columns

### 2. Component Structure
- Use server components by default
- Client components marked with `'use client'`
- Props interfaces defined inline or as separate types

### 3. Error Handling
- Log errors with context
- Return structured error responses from API routes
- Use try-catch blocks with meaningful error messages

### 4. Styling
- Tailwind CSS for all styling
- Responsive design patterns
- Norwegian text throughout UI

## Security Notes

### 1. Environment Variables
- `.env.local` is encrypted using dotenvx public-key encryption
- Private key stored in `.env.keys` (gitignored, never commit)
- Encrypted `.env.local` is safe to commit to git
- All npm scripts use `dotenvx run -f .env.local` for automatic decryption
- Private key required: Store in `.env.keys` locally or as `DOTENV_PRIVATE_KEY_LOCAL` environment variable in CI/CD
- Use different tokens for development/production
- Cloudflare Worker variables must match local .env.local

### 2. Database Access
- Use Row Level Security (RLS) in Supabase
- Service role key for admin operations
- Public anon key for client-side operations

### 3. Email Security
- HMAC signatures for unsubscribe links
- Validate email addresses before sending
- Rate limiting on subscription endpoints

## Deployment

### 1. Main Application
- Deployed via GitHub Actions
- Uses Next.js App Router
- Environment variables set in hosting platform

### 2. Cloudflare Worker
- Deploy `workers/email-dispatcher.js` to Cloudflare
- Set all required environment variables in Worker settings
- Worker URL becomes `DISPATCH_URL` in main app

### 3. Database
- Supabase PostgreSQL with migrations
- Row Level Security enabled
- Service role key for admin operations

## Known Limitations

1. **Web Scraping**: Only RSS feeds supported, scraping sources show "not implemented" messages
2. **Email Volume**: Large digests (600+ articles) may hit Resend limits (3,000 emails/month on free tier)
3. **Language**: Currently Norwegian-only interface and content
4. **AI Models**: Requires both Anthropic and OpenAI API keys for redundancy

## Current Status (September 2025)

### ✅ All Features Working
- **Content Generation**: Digest generation with Claude Sonnet 4
- **RSS Aggregation**: Multi-source RSS feed fetching with robots.txt compliance
- **Email Delivery**: Modern email templates via Resend with markdown processing
- **Admin Interface**: Complete admin panel with delete functionality
- **GDPR Compliance**: Simplified one-click unsubscribe with automatic data deletion
- **External Integration**: Unsubscribe handling for external websites
- **Testing Infrastructure**: Comprehensive test scripts for all major features
- **Database Operations**: Graceful degradation and schema migrations
- **Timezone Consistency**: Europe/Oslo throughout the application
- **Security**: Environment encryption with dotenvx and HMAC signatures

### 🎉 Recent Improvements (September 2025)
- **Fixed**: Database schema issues with content column migration
- **Enhanced**: Email design with modern styling and markdown support
- **Implemented**: Simplified one-click GDPR-compliant unsubscribe system
- **Simplified**: Unsubscribe flow with automatic GDPR deletion (no complex forms)
- **Fixed**: TypeScript build errors and ESLint violations
- **Updated**: Email templates to reflect automatic data deletion
- **Created**: External unsubscribe integration documentation
- **Added**: Comprehensive testing scripts for all functionality
- **Improved**: Error handling and audit logging

## Development Tips

1. **Always test locally first**: Use `npm run digest:generate` before deploying
2. **Test comprehensively**: Use the provided test scripts for email, unsubscribe, and GDPR functionality
3. **Monitor Cloudflare logs**: Essential for debugging email delivery issues
4. **Use TypeScript strictly**: The codebase has strict typing enabled
5. **Respect rate limits**: Built-in delays prevent overwhelming RSS sources
6. **Dotenvx encryption**: All scripts automatically decrypt .env.local using private key from .env.keys
7. **GDPR compliance**: Test data deletion thoroughly with test-gdpr-deletion.ts
8. **Email design**: Preview email templates with test-email-design.ts before deployment

## Emergency Contacts & Resources

- **Resend Dashboard**: https://resend.com/domains - manage domain verification
- **Supabase Dashboard**: Monitor database performance and logs
- **Cloudflare Dashboard**: Check Worker logs and environment variables
- **Anthropic Console**: Monitor Claude API usage and rate limits

---

**Last Updated**: September 27, 2025
**Primary Maintainer**: Lene Zachariassen
**Claude Model Used**: claude-sonnet-4-20250514
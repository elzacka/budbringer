# 🛠️ Budbringer Admin Guide

Complete guide for customizing and managing your Budbringer newsletter system.

## 📋 Table of Contents

1. [Admin Interface Overview](#-admin-interface-overview)
2. [Source Management](#-source-management)
3. [Content Generation & Prompts](#-content-generation--prompts)
4. [Newsletter Design](#-newsletter-design)
5. [Pipeline Configuration](#-pipeline-configuration)
6. [Advanced Database Management](#-advanced-database-management)
7. [Testing & Troubleshooting](#-testing--troubleshooting)
8. [File Locations Reference](#-file-locations-reference)

---

## 🖥️ Admin Interface Overview

### Accessing Admin Panel
**URL:** `https://yourdomain.com/admin`
**Authentication:** Supabase Auth (configured in environment)

### Dashboard Features
- **Active Recipients**: Confirmed subscribers count
- **Pending Approvals**: New subscriber requests awaiting approval
- **Active Prompt**: Currently selected content generation prompt
- **Latest Runs**: Recent digest generation attempts with status

### Main Sections
- **📊 Dashboard** (`/admin`) - Overview and metrics
- **📝 Prompts** (`/admin/prompts`) - AI content generation prompts
- **👥 Recipients** (`/admin/recipients`) - Subscriber management
- **⏳ Pending** (`/admin/pending`) - Approve/reject new subscribers
- **🔄 Runs** (`/admin/runs`) - Digest generation history and debugging

---

## 📰 Source Management

### Current Source Configuration

#### **Database Tables**
- **`content_sources`**: RSS feed definitions and settings
- **`pipeline_sources`**: Source assignments to content pipelines

#### **Configured Sources** (as of current setup)

**Norwegian Sources (High Priority):**
- **NRK Viten** (Priority 10): `https://www.nrk.no/viten/toppsaker.rss`
- **NRK Nyheter** (Priority 9): `https://www.nrk.no/nyheter/siste.rss`
- **ITavisen** (Priority 7): `https://itavisen.no/feed`
- **Teknisk Ukeblad** (Priority 7): `https://www.tu.no/rss`
- **Norwegian SciTech News** (Priority 8): `https://norwegianscitechnews.com/feed`

**International Sources:**
- **TechCrunch AI** (Priority 6): AI-focused articles
- **MIT Technology Review** (Priority 6): Research and analysis
- **The Verge AI** (Priority 5): Consumer tech perspective
- **OpenAI News** (Priority 8): Company updates

### Adding New Sources

#### **Method 1: Direct Database (Recommended)**
```sql
-- Add a new RSS source
INSERT INTO content_sources (
  name,
  type,
  base_url,
  category,
  priority,
  active,
  config
) VALUES (
  'Digi.no Tech',
  'rss',
  'https://www.digi.no/rss',
  'norsk-tech',
  8,
  true,
  '{
    "language": "no",
    "filter_keywords": [
      "kunstig intelligens", "KI", "AI", "maskinlæring",
      "ChatGPT", "OpenAI", "roboter", "automatisering"
    ]
  }'
);

-- Assign to pipeline (Pipeline 2 = "KI-nyheter Norge")
INSERT INTO pipeline_sources (
  pipeline_id,
  source_id,
  priority,
  active
) VALUES (
  2,
  (SELECT id FROM content_sources WHERE name = 'Digi.no Tech'),
  8,
  true
);
```

#### **Method 2: Admin Scripts**
```bash
# Check current sources
npx tsx scripts/check-sources.ts

# Test a new source before adding
npx tsx scripts/test-norwegian-sources.ts
```

### Source Configuration Options

#### **Config JSON Structure**
```json
{
  "language": "no",                    // Content language
  "quality": "high",                   // Content quality expectation
  "filter_keywords": [                 // Keywords for relevance filtering
    "kunstig intelligens", "KI", "AI", "maskinlæring"
  ],
  "max_age_days": 7,                   // Only include articles from last N days
  "norwegian_relevance": true          // Prioritize Norwegian context
}
```

#### **Priority System**
- **10**: Highest priority Norwegian sources (NRK Viten)
- **8-9**: Important Norwegian sources (NRK Nyheter, ITavisen)
- **6-7**: Quality international sources (TechCrunch, MIT)
- **5**: General international sources (The Verge)

### Source Filtering Logic

Sources are filtered using keywords defined in the `config.filter_keywords` array:

**File:** `lib/news-fetcher.ts:filterRelevantNews()`
```typescript
// Articles must contain at least one keyword in title or description
const searchText = `${item.title} ${item.description || ''}`.toLowerCase();
const hasRelevantKeyword = keywords.some((keyword: string) =>
  searchText.includes(keyword.toLowerCase())
);
```

---

## 📝 Content Generation & Prompts

### Managing Prompts via Admin Interface

#### **Creating New Prompts**
1. Go to `/admin/prompts`
2. Fill in the form:
   - **Name**: Descriptive prompt name
   - **Body**: Complete AI instruction text
   - **Notes**: Internal documentation
3. Click "Opprett prompt"

#### **Activating Prompts**
- Only one prompt can be active at a time
- Click "Aktiver" next to desired prompt
- Active prompt is used for all new digest generations

### Current Prompt Structure

The active prompt includes several key sections:

#### **1. Role Definition**
```
Du er en erfaren redaktør for et norsk nyhetsbrev om kunstig intelligens (KI).
Din jobb er å gjøre komplekse KI-nyheter forståelige og nyttige for vanlige folk.
```

#### **2. Norwegian Terminology**
```
- Bruk ALLTID "kunstig intelligens" eller "KI" i stedet for "AI"
- Bruk "maskinlæring" i stedet for "machine learning"
- Bruk "språkmodell" i stedet for "language model"
- UNNTAK: Behold engelske navn på produkter (ChatGPT, OpenAI)
```

#### **3. Content Quality Rules**
```
**"HVA BETYR DETTE?" REGEL:**
For hver nyhet MÅ du svare på:
- Hvorfor er dette viktig for leseren?
- Hva betyr dette i praksis?
- Hvordan påvirker dette hverdagen til folk?
```

#### **4. Content Structure**
```
**TEKSTSTRUKTUR:**
Hver bullet MÅ følge denne malen:
"[HVA SKJER] - [HVA DETTE BETYR FOR LESEREN]"
```

### Prompt File Location
**File:** `lib/content-processor.ts:buildPrompt()`

To modify the core prompt logic, edit this function.

### Testing Prompts

#### **Generate Test Digest**
```bash
# Test current prompt
npm run digest:generate

# Test specific model
npx tsx scripts/digestGenerator.ts
```

#### **Verify Output Quality**
Check that generated content:
- Uses Norwegian terminology (KI, kunstig intelligens)
- Follows "[WHAT] - [WHAT IT MEANS]" structure
- Explains technical concepts in simple terms
- Includes source attribution links

---

## 🎨 Newsletter Design

### Email Template Structure

#### **Main Template File**
**File:** `lib/email.ts`

Contains two main functions:
- `renderDigestHtml()` - HTML email template
- `renderDigestText()` - Plain text fallback

#### **Template Sections**
1. **Header Card**: Branding and date
2. **Lead Section**: Introduction paragraph
3. **Content Sections**: Categorized news items
4. **Action Items**: Specific tasks for readers
5. **Footer**: Unsubscribe links and legal text

### Visual Customization

#### **1. Colors & Branding**
```typescript
// Primary brand color
color: #0ea5e9 (sky-500)

// Gradients
background: linear-gradient(135deg, #0ea5e9, #0284c7)

// Card backgrounds
background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)
```

#### **2. Typography**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif
```

#### **3. Layout Spacing**
```css
max-width: 720px        /* Email container */
padding: 48px 32px      /* Outer spacing */
border-radius: 28px     /* Card corners */
```

### Customizing Email Design

#### **Method 1: Edit Template Directly**
**File:** `lib/email.ts:renderDigestHtml()`

Example - Change brand color:
```typescript
// Find all instances of #0ea5e9 and replace with your color
background: linear-gradient(135deg, #YOUR_COLOR, #YOUR_DARKER_COLOR)
color: #YOUR_COLOR
```

#### **Method 2: Test Design Changes**
```bash
# Generate test email
npx tsx scripts/test-email-design.ts

# Check output
open test-output/newsletter-test.html
```

#### **Method 3: Update Markdown Processing**
**File:** `lib/markdown-utils.ts`

Customize how markdown is converted to HTML:
```typescript
// Bold text styling
.replace(/\*\*([^*]+)\*\*/g, '<strong style="color: #YOUR_COLOR;">$1</strong>')

// Link styling
.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #YOUR_COLOR;">$1</a>')
```

### Email Preview Testing

#### **Preview Current Template**
```bash
npx tsx scripts/test-email-design.ts
```
This generates `test-output/newsletter-test.html` with sample content.

#### **Test with Real Content**
```bash
npm run digest:generate
# Check admin panel for latest run
# Email HTML is stored in digest_runs table
```

---

## ⚙️ Pipeline Configuration

### Understanding Pipelines

Pipelines control how content flows from sources to final newsletter.

#### **Current Pipeline**
- **Pipeline ID**: 2
- **Name**: "KI-nyheter Norge"
- **Purpose**: Norwegian AI news aggregation

#### **Pipeline Configuration**
```json
{
  "max_articles": 15,
  "filter_strength": "high",
  "ai_editor_prompt": "Du er redaktør for et norsk KI-nyhetsbrev...",
  "require_approval": false
}
```

### Modifying Pipeline Settings

#### **Database Query**
```sql
-- View current pipeline
SELECT * FROM pipelines WHERE name = 'KI-nyheter Norge';

-- Update max articles
UPDATE pipelines
SET config = jsonb_set(config, '{max_articles}', '20')
WHERE name = 'KI-nyheter Norge';

-- Update filter strength
UPDATE pipelines
SET config = jsonb_set(config, '{filter_strength}', '"medium"')
WHERE name = 'KI-nyheter Norge';
```

#### **Available Filter Strengths**
- **"high"**: Strict keyword matching, fewer false positives
- **"medium"**: Balanced filtering
- **"low"**: Permissive filtering, more content included

### Creating New Pipelines

```sql
-- Create specialized pipeline
INSERT INTO pipelines (name, config, template_config) VALUES (
  'KI-forskning Norge',
  '{
    "max_articles": 10,
    "filter_strength": "high",
    "require_approval": true,
    "focus": "research"
  }',
  '{
    "language": "no",
    "tone": "akademisk_tilgjengelig",
    "target_audience": "forskere og studenter"
  }'
);
```

---

## 🗄️ Advanced Database Management

### Key Database Tables

#### **Content Sources** (`content_sources`)
```sql
-- View all sources with priorities
SELECT name, type, base_url, priority, active, category
FROM content_sources
ORDER BY priority DESC;

-- Update source priority
UPDATE content_sources
SET priority = 9
WHERE name = 'ITavisen';

-- Deactivate source
UPDATE content_sources
SET active = false
WHERE name = 'Source Name';
```

#### **Pipeline Sources** (`pipeline_sources`)
```sql
-- View source assignments
SELECT ps.pipeline_id, cs.name, ps.priority, ps.active
FROM pipeline_sources ps
JOIN content_sources cs ON ps.source_id = cs.id
ORDER BY ps.pipeline_id, ps.priority DESC;

-- Assign source to pipeline
INSERT INTO pipeline_sources (pipeline_id, source_id, priority, active)
VALUES (2, (SELECT id FROM content_sources WHERE name = 'New Source'), 7, true);
```

#### **Digest Runs** (`digest_runs`)
```sql
-- View recent runs
SELECT id, status, created_at, model_used, error
FROM digest_runs
ORDER BY created_at DESC
LIMIT 10;

-- Delete failed runs
DELETE FROM digest_runs
WHERE status = 'error' AND created_at < NOW() - INTERVAL '7 days';
```

#### **Subscribers** (`subscribers`)
```sql
-- View subscriber statistics
SELECT status, COUNT(*)
FROM subscribers
GROUP BY status;

-- Export subscriber list
SELECT email, status, created_at
FROM subscribers
WHERE status = 'confirmed'
ORDER BY created_at DESC;
```

### Database Migrations

#### **Recent Migrations**
- `202509280002_add_source_reliability.sql` - Source reliability scoring
- `202509280003_add_pgvector.sql` - Semantic search capabilities

#### **Running Migrations**
```bash
# Apply pending migrations
npx dotenvx run -f .env.local -- supabase db push

# Check migration status
npx dotenvx run -f .env.local -- supabase db status
```

### Backup & Recovery

#### **Export Data**
```bash
# Export to SQL file
pg_dump $DATABASE_URL > budbringer-backup-$(date +%Y%m%d).sql

# Export specific tables
pg_dump $DATABASE_URL -t content_sources -t pipelines > sources-backup.sql
```

#### **Import Data**
```bash
# Restore from backup
psql $DATABASE_URL < budbringer-backup-20241201.sql
```

---

## 🧪 Testing & Troubleshooting

### Manual Content Generation

#### **Generate Test Digest**
```bash
# Full digest generation (no email)
npm run digest:generate

# Test specific pipeline
npx tsx scripts/digestGenerator.ts

# Test with email sending
npx tsx scripts/dailyDigest.ts
```

#### **Test Individual Sources**
```bash
# Test Norwegian sources specifically
npx tsx scripts/test-norwegian-sources.ts

# Test source connectivity
npm run sources:test
```

### Debugging Common Issues

#### **1. No Norwegian Content in Newsletter**
**Symptoms**: Newsletter only contains international sources

**Diagnosis**:
```bash
npx tsx scripts/check-sources.ts
npx tsx scripts/test-norwegian-sources.ts
```

**Common Causes**:
- Norwegian sources don't publish AI content regularly
- Keyword filtering too strict
- Source RSS feeds broken or changed

**Solutions**:
- Broaden keywords: Add "digitalisering", "automatisering", "teknologi"
- Lower filter strength in pipeline config
- Add more Norwegian tech sources

#### **2. Digest Generation Fails**
**Symptoms**: Runs show "error" status in admin panel

**Diagnosis**:
```bash
# Check recent runs
npx tsx -e "
import { getSupabaseServiceClient } from './lib/supabase-admin.js';
const supabase = getSupabaseServiceClient();
const { data } = await supabase
  .from('digest_runs')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(5);
console.log(data);
"
```

**Common Causes**:
- API rate limits (OpenAI, Anthropic)
- Network timeouts fetching RSS
- Database connection issues
- Invalid prompt format

#### **3. Email Delivery Issues**
**Symptoms**: Digest generates but emails don't send

**Diagnosis**:
```bash
# Test worker directly
npx tsx scripts/test-worker-direct.ts

# Check Cloudflare Worker logs
source <(grep CLOUDFLARE_API_TOKEN .env.local | sed 's/^/export /') && npx wrangler tail
```

**Common Causes**:
- Resend API quota exceeded
- Invalid Resend API key
- Domain verification issues
- Worker environment variables incorrect

#### **4. Source Reliability Issues**
**Symptoms**: Unreliable sources ranked too high

**View Source Reliability**:
```sql
SELECT name, reliability_score, fetch_success_rate, total_fetches
FROM content_sources
ORDER BY reliability_score DESC;
```

**Adjust Reliability**:
```sql
-- Manual reliability adjustment
UPDATE content_sources
SET reliability_score = 0.85
WHERE name = 'Source Name';
```

### Performance Monitoring

#### **Check Source Performance**
```bash
# Test all sources
npm run sources:test

# Check circuit breaker status
npx tsx -e "
import { circuitBreakerRegistry } from './lib/circuit-breaker.js';
console.log('Circuit breaker status:', circuitBreakerRegistry.getStatus());
"
```

#### **Monitor Database Performance**
```sql
-- Check table sizes
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check recent activity
SELECT COUNT(*) as digest_runs_last_week
FROM digest_runs
WHERE created_at > NOW() - INTERVAL '7 days';
```

---

## 📁 File Locations Reference

### **Configuration Files**
- `.env.local` - Environment variables (encrypted with dotenvx)
- `.env.keys` - Encryption keys for dotenvx (gitignored)
- `CLAUDE.md` - AI assistant instructions
- `package.json` - Dependencies and scripts

### **Core Application**
```
app/
├── admin/                    # Admin interface
│   ├── page.tsx             # Admin dashboard
│   ├── prompts/page.tsx     # Prompt management
│   ├── recipients/page.tsx  # Subscriber management
│   ├── pending/page.tsx     # Pending approvals
│   └── runs/page.tsx        # Digest run history
├── api/                     # API endpoints
│   ├── admin/               # Admin API routes
│   ├── subscribe/           # Newsletter subscription
│   └── unsubscribe/         # Newsletter unsubscribe
└── unsubscribe/page.tsx     # Unsubscribe confirmation
```

### **Components**
```
components/
├── admin/
│   ├── PromptManager.tsx    # Prompt CRUD interface
│   ├── RecipientManager.tsx # Subscriber management
│   ├── PendingSubscribers.tsx # Approval interface
│   └── RunsManager.tsx      # Digest run monitoring
└── SubscribeForm.tsx        # Public subscription form
```

### **Business Logic**
```
lib/
├── ai-processor.ts          # AI model integration
├── circuit-breaker.ts       # Resilient API calls
├── content-processor.ts     # News processing & prompts
├── deduplication.ts         # Article deduplication
├── email.ts                 # Email template rendering
├── feed-cache.ts            # RSS feed caching
├── markdown-utils.ts        # Markdown processing
├── news-fetcher.ts          # RSS feed fetching
├── queries.ts               # Database queries
├── semantic-search.ts       # Vector similarity search
├── source-reliability.ts    # Source quality scoring
├── supabase-admin.ts        # Database client
├── timezone.ts              # Oslo timezone handling
└── unsubscribe.ts           # HMAC signature utilities
```

### **Scripts**
```
scripts/
├── check-pipelines.ts       # Pipeline configuration analysis
├── check-sources.ts         # Source configuration analysis
├── dailyDigest.ts          # Full digest + email dispatch
├── digestGenerator.ts       # Content generation only
├── test-email-design.ts     # Email template testing
├── test-norwegian-sources.ts # Norwegian source testing
├── test-unsubscribe.ts      # Unsubscribe flow testing
└── test-worker-direct.ts    # Cloudflare Worker testing
```

### **Database**
```
supabase/
├── migrations/              # Database schema changes
│   ├── 202509280002_add_source_reliability.sql
│   ├── 202509280003_add_pgvector.sql
│   └── [other migrations]
└── config.toml             # Supabase configuration
```

### **Deployment**
```
workers/
└── email-dispatcher.js     # Cloudflare Worker for email delivery
```

---

## 🚀 Quick Start Checklist

### **Initial Setup**
- [ ] Access admin panel at `/admin`
- [ ] Check active prompt in dashboard
- [ ] Review current sources in database
- [ ] Test digest generation: `npm run digest:generate`

### **Customization Priority**
1. **Content**: Adjust AI prompts for tone and focus
2. **Sources**: Add Norwegian tech sources, adjust priorities
3. **Design**: Customize email template colors and branding
4. **Pipeline**: Adjust filtering and article limits

### **Regular Maintenance**
- [ ] Monitor digest run success rate (`/admin/runs`)
- [ ] Review source reliability scores
- [ ] Check subscriber growth (`/admin/recipients`)
- [ ] Test email deliverability monthly

### **Emergency Contacts**
- **Supabase Dashboard**: Database monitoring and logs
- **Cloudflare Dashboard**: Worker logs and performance
- **Resend Dashboard**: Email delivery stats and domain verification

---

*Last Updated: September 28, 2025*
*Version: 2.0 (with Phase 2 improvements)*
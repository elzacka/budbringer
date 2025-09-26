import { processDigestContentMarkdown, processDigestContentText } from './markdown-utils';

interface DigestSection {
  heading: string;
  bullets: string[];
  link?: string;
}

interface DigestEmailPayload {
  dateLabel: string;
  lead: string;
  sections: DigestSection[];
  actions?: string[];
  audioUrl?: string | null;
}

const PUBLIC_BASE_URL = process.env.PUBLIC_SITE_URL ? process.env.PUBLIC_SITE_URL.replace(/\/$/, '') : '';
const LOGO_PATH = '/budbringer-logo.svg';
const LOGO_URL = PUBLIC_BASE_URL ? `${PUBLIC_BASE_URL}${encodeURI(LOGO_PATH)}` : null;

export function renderDigestHtml(payload: DigestEmailPayload) {
  // Process markdown formatting
  const processedContent = processDigestContentMarkdown(payload);

  const { dateLabel, lead, sections, actions, audioUrl } = processedContent;

  const sectionHtml = sections
    .map(
      (section) => `
        <section style="margin-bottom: 32px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
            <div style="width: 3px; height: 20px; background: linear-gradient(135deg, #38bdf8, #0ea5e9); border-radius: 2px;"></div>
            <h2 style="font-size: 19px; margin: 0; color: #0f172a; font-weight: 600;">${section.heading}</h2>
          </div>
          <ul style="padding-left: 20px; margin: 0; list-style: none;">
            ${section.bullets.map((bullet) =>
              `<li style="margin-bottom: 10px; color: #1e293b; line-height: 1.6; position: relative;">
                <span style="position: absolute; left: -16px; top: 8px; width: 4px; height: 4px; background: #0ea5e9; border-radius: 50%;"></span>
                ${bullet}
              </li>`
            ).join('')}
          </ul>
          ${section.link ? `<p style="margin-top: 12px;"><a href="${section.link}" style="color: #0ea5e9; text-decoration: none; font-weight: 500; display: inline-flex; align-items: center; gap: 4px;">Les mer →</a></p>` : ''}
        </section>
      `
    )
    .join('\n');

  const actionsHtml = actions?.length
    ? `
      <section style="margin-top: 40px; padding: 24px; background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border-radius: 16px; border: 1px solid #bae6fd;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
          <div style="width: 20px; height: 20px; background: linear-gradient(135deg, #0ea5e9, #0284c7); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 10px; font-weight: bold;">✓</span>
          </div>
          <h3 style="font-size: 17px; margin: 0; color: #0f172a; font-weight: 600;">Hva bør du gjøre?</h3>
        </div>
        <ol style="padding-left: 20px; margin: 0; color: #1e293b;">
          ${actions.map((action, index) =>
            `<li style="margin-bottom: 8px; line-height: 1.6; counter-increment: step-counter;">
              <span style="font-weight: 500; color: #0ea5e9;">${index + 1}.</span> ${action}
            </li>`
          ).join('')}
        </ol>
      </section>
    `
    : '';

  const audioBlock = audioUrl
    ? `
      <div style="margin: 24px 0; padding: 20px; border-radius: 16px; background: linear-gradient(135deg, #f0f9ff, #dbeafe); border: 1px solid #bfdbfe;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 16px;">▶</span>
          </div>
          <div style="flex: 1;">
            <p style="margin: 0 0 4px 0; font-weight: 600; color: #1e40af; font-size: 15px;">Vil du lytte i stedet?</p>
            <a href="${audioUrl}" style="color: #0ea5e9; text-decoration: none; font-weight: 500;">Klikk her for å høre dagens briefing →</a>
          </div>
        </div>
      </div>
    `
    : '';

  const logoBlock = LOGO_URL
    ? `<img src="${LOGO_URL}" alt="Budbringer" style="height: 72px; width: auto; display: block; margin-bottom: 20px;" />`
    : `<div style="margin-bottom: 20px;">
        <h1 style="font-size: 32px; font-weight: 700; color: #0f172a; margin: 0; letter-spacing: -0.02em;">Budbringer</h1>
       </div>`;

  const badgeBlock = `
    <div style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 20px; border-radius: 999px; background: linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(14, 165, 233, 0.15)); border: 1px solid rgba(56, 189, 248, 0.3); margin-bottom: 16px;">
      <div style="width: 8px; height: 8px; background: linear-gradient(135deg, #38bdf8, #0ea5e9); border-radius: 50%;"></div>
      <span style="color: #0f172a; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;">Daglig KI-brief</span>
    </div>`;

  return `
    <!DOCTYPE html>
    <html lang="no">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${dateLabel} - Budbringer</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); color: #0f172a; line-height: 1.6;">
      <div style="max-width: 680px; margin: 0 auto; padding: 40px 24px;">

        <!-- Header Card -->
        <header style="background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border-radius: 24px; padding: 40px 36px; margin-bottom: 32px; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08), 0 8px 20px rgba(15, 23, 42, 0.04); border: 1px solid rgba(255, 255, 255, 0.8);">
          ${logoBlock}
          ${badgeBlock}
          <h1 style="font-size: 32px; font-weight: 700; margin: 0 0 20px 0; color: #0f172a; letter-spacing: -0.02em; line-height: 1.2;">${dateLabel}</h1>
          <div style="font-size: 18px; color: #475569; line-height: 1.7; margin-bottom: 16px;">
            ${lead}
          </div>
          ${audioBlock}
        </header>

        <!-- Main Content Card -->
        <main style="background: #ffffff; border-radius: 24px; padding: 40px 36px; box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06), 0 4px 12px rgba(15, 23, 42, 0.03); border: 1px solid rgba(255, 255, 255, 0.8);">
          ${sectionHtml}
          ${actionsHtml}
        </main>

        <!-- Footer -->
        <footer style="margin-top: 40px; text-align: center; padding: 0 20px;">
          <div style="background: rgba(255, 255, 255, 0.6); border-radius: 16px; padding: 24px; border: 1px solid rgba(255, 255, 255, 0.8);">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b; line-height: 1.5;">
              Du får denne e-posten fordi du har meldt deg på Budbringers daglige KI-brief.
            </p>
            <p style="margin: 0; font-size: 13px; color: #64748b;">
              <a href="{{unsubscribe_url}}" style="color: #0ea5e9; text-decoration: none; font-weight: 500;">Meld deg av nyhetsbrevet</a> •
              <a href="/gdpr/delete" style="color: #64748b; text-decoration: none;">Slett alle data (GDPR)</a>
            </p>
          </div>
        </footer>

      </div>
    </body>
    </html>
  `;
}

export function renderDigestText(payload: DigestEmailPayload) {
  // Process markdown formatting for plain text
  const processedContent = processDigestContentText(payload);

  const { dateLabel, lead, sections, actions, audioUrl } = processedContent;

  const sectionText = sections
    .map((section) => {
      const bullets = section.bullets.map((bullet) => `  • ${bullet}`).join('\n');
      const linkLine = section.link ? `\n  Les mer: ${section.link}` : '';
      return `${section.heading}\n${bullets}${linkLine}`;
    })
    .join('\n\n');

  const actionsText = actions?.length
    ? `\n\nHva bør du gjøre?\n${actions.map((action, index) => `${index + 1}. ${action}`).join('\n')}`
    : '';

  const audioLine = audioUrl ? `\n\nLytt til dagens briefing: ${audioUrl}` : '';

  return `BUDBRINGER – ${dateLabel.toUpperCase()}

${lead}

${sectionText}${actionsText}${audioLine}

---
Administrer abonnementet ditt: {{unsubscribe_url}}
Slett alle data (GDPR): https://budbringer.no/gdpr/delete`;
}

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

export function renderDigestHtml(payload: DigestEmailPayload) {
  // Process markdown formatting
  const processedContent = processDigestContentMarkdown(payload);

  const { dateLabel, lead, sections, actions, audioUrl } = processedContent;

  const sectionHtml = sections
    .map(
      (section) => `
        <section style="margin-bottom: 56px;">
          <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 28px;">
            <div style="width: 5px; height: 28px; background: linear-gradient(135deg, #0ea5e9, #0284c7); border-radius: 4px; margin-top: 3px; flex-shrink: 0; box-shadow: 0 2px 4px rgba(14, 165, 233, 0.2);"></div>
            <h2 style="font-size: 22px; margin: 0; color: #0f172a; font-weight: 700; line-height: 1.25; letter-spacing: -0.02em; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;">${section.heading}</h2>
          </div>
          <div style="padding-left: 21px;">
            <ul style="padding: 0; margin: 0; list-style: none;">
              ${section.bullets.map((bullet) =>
                `<li style="margin-bottom: 20px; color: #475569; line-height: 1.7; position: relative; padding-left: 24px; font-size: 16px; font-weight: 400;">
                  <span style="position: absolute; left: 0; top: 12px; width: 7px; height: 7px; background: linear-gradient(135deg, #0ea5e9, #0284c7); border-radius: 50%; opacity: 0.9; box-shadow: 0 1px 3px rgba(14, 165, 233, 0.3);"></span>
                  ${bullet}
                </li>`
              ).join('')}
            </ul>
            ${section.link ? `<div style="margin-top: 28px; padding-left: 24px;"><a href="${section.link}" style="color: #0ea5e9; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-flex; align-items: center; gap: 8px; border-radius: 8px; padding: 12px 18px; background: linear-gradient(135deg, rgba(14, 165, 233, 0.08), rgba(14, 165, 233, 0.06)); border: 1px solid rgba(14, 165, 233, 0.15); transition: all 0.2s; box-shadow: 0 2px 4px rgba(14, 165, 233, 0.1);">Les mer <span style="font-size: 14px; font-weight: 700;">→</span></a></div>` : ''}
          </div>
        </section>
      `
    )
    .join('\n');

  const actionsHtml = actions?.length
    ? `
      <section style="margin-top: 64px; padding: 40px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 24px; border: 1px solid rgba(226, 232, 240, 0.8); box-shadow: 0 8px 25px rgba(15, 23, 42, 0.08), 0 3px 10px rgba(15, 23, 42, 0.04);">
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 32px;">
          <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #0ea5e9, #0284c7); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25);">
            <span style="color: white; font-size: 16px; font-weight: 700;">✓</span>
          </div>
          <h3 style="font-size: 20px; margin: 0; color: #0f172a; font-weight: 700; letter-spacing: -0.02em; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;">Hva bør du gjøre?</h3>
        </div>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${actions.map((action, index) =>
            `<div style="display: flex; align-items: flex-start; gap: 20px; padding: 16px 0; ${index !== actions.length - 1 ? 'border-bottom: 1px solid rgba(226, 232, 240, 0.6);' : ''}">
              <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #0ea5e9, #0284c7); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: 700; color: white; font-size: 16px; box-shadow: 0 3px 8px rgba(14, 165, 233, 0.25), 0 1px 3px rgba(14, 165, 233, 0.1);">${index + 1}</div>
              <span style="flex: 1; color: #475569; font-size: 16px; line-height: 1.6; margin-top: 4px; font-weight: 400;">${action}</span>
            </div>`
          ).join('')}
        </div>
      </section>
    `
    : '';

  const audioBlock = audioUrl
    ? `
      <div style="margin: 32px 0; padding: 28px; border-radius: 20px; background: linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%); border: 1px solid rgba(191, 219, 254, 0.8); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);">
        <div style="display: flex; align-items: center; gap: 18px;">
          <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);">
            <span style="color: white; font-size: 18px; font-weight: 700;">▶</span>
          </div>
          <div style="flex: 1;">
            <p style="margin: 0 0 6px 0; font-weight: 700; color: #1e40af; font-size: 17px; letter-spacing: -0.01em;">Vil du lytte i stedet?</p>
            <a href="${audioUrl}" style="color: #0ea5e9; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-flex; align-items: center; gap: 6px;">Klikk her for å høre dagens briefing <span style="font-size: 14px; font-weight: 700;">→</span></a>
          </div>
        </div>
      </div>
    `
    : '';

  const headerBlock = `
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="font-size: 42px; font-weight: 800; color: #0f172a; margin: 0 0 20px 0; letter-spacing: -0.03em; line-height: 1.05; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;">Budbringer</h1>
      <div style="display: inline-flex; align-items: center; gap: 12px; padding: 12px 28px; border-radius: 999px; background: linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(14, 165, 233, 0.15)); border: 1px solid rgba(14, 165, 233, 0.25); box-shadow: 0 4px 12px rgba(14, 165, 233, 0.12), 0 2px 6px rgba(14, 165, 233, 0.08);">
        <div style="width: 12px; height: 12px; background: linear-gradient(135deg, #0ea5e9, #0284c7); border-radius: 50%; box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.2), 0 2px 4px rgba(14, 165, 233, 0.1);"></div>
        <span style="color: #0f172a; font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;">Daglig KI-brief</span>
      </div>
    </div>`;

  return `
    <!DOCTYPE html>
    <html lang="no">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${dateLabel} - Budbringer</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%); color: #0f172a; line-height: 1.6;">
      <div style="max-width: 720px; margin: 0 auto; padding: 48px 32px;">

        <!-- Header Card -->
        <header style="background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border-radius: 28px; padding: 48px 44px; margin-bottom: 40px; box-shadow: 0 25px 50px rgba(15, 23, 42, 0.1), 0 10px 25px rgba(15, 23, 42, 0.06); border: 1px solid rgba(255, 255, 255, 0.9);">
          ${headerBlock}
          <h1 style="font-size: 36px; font-weight: 800; margin: 0 0 28px 0; color: #0f172a; letter-spacing: -0.025em; line-height: 1.15; text-align: center; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;">${dateLabel}</h1>
          <div style="font-size: 19px; color: #475569; line-height: 1.65; margin-bottom: 24px; font-weight: 400;">
            ${lead}
          </div>
          ${audioBlock}
        </header>

        <!-- Main Content Card -->
        <main style="background: #ffffff; border-radius: 28px; padding: 48px 44px; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08), 0 8px 20px rgba(15, 23, 42, 0.04); border: 1px solid rgba(255, 255, 255, 0.9);">
          ${sectionHtml}
          ${actionsHtml}
        </main>

        <!-- Footer -->
        <footer style="margin-top: 72px; text-align: center; padding: 0 24px;">
          <div style="background: rgba(255, 255, 255, 0.7); border-radius: 20px; padding: 36px; border: 1px solid rgba(255, 255, 255, 0.9); box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);">
            <p style="margin: 0 0 16px 0; font-size: 14px; color: #64748b; line-height: 1.6; font-weight: 400;">
              Du får denne e-posten fordi du har meldt deg på Budbringers daglige KI-brief.
            </p>
            <p style="margin: 0 0 12px 0; font-size: 14px; color: #64748b;">
              <a href="{{unsubscribe_url}}" style="color: #0ea5e9; text-decoration: none; font-weight: 600; border-bottom: 1px solid rgba(14, 165, 233, 0.3);">Meld deg av nyhetsbrevet</a>
            </p>
            <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
              Alle personopplysninger slettes automatisk når du trykker på "Meld deg av nyhetsbrevet"
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
Alle personopplysninger slettes automatisk ved avmelding (GDPR-kompatibelt)`;
}

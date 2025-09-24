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

export function renderDigestHtml({ dateLabel, lead, sections, actions, audioUrl }: DigestEmailPayload) {
  const sectionHtml = sections
    .map(
      (section) => `
        <section style="margin-bottom: 24px;">
          <h2 style="font-size: 18px; margin-bottom: 8px; color: #0f172a;">${section.heading}</h2>
          <ul style="padding-left: 16px; margin: 0;">
            ${section.bullets.map((bullet) => `<li style="margin-bottom: 6px; color: #1e293b;">${bullet}</li>`).join('')}
          </ul>
          ${section.link ? `<p style="margin-top: 8px;"><a href="${section.link}" style="color:#2563eb;">Les mer</a></p>` : ''}
        </section>
      `
    )
    .join('\n');

  const actionsHtml = actions?.length
    ? `
      <section style="margin-top: 24px;">
        <h3 style="font-size: 16px; margin-bottom: 8px; color: #0f172a;">Hva bør du gjøre?</h3>
        <ol style="padding-left: 18px; margin: 0; color: #1e293b;">
          ${actions.map((action) => `<li style="margin-bottom: 6px;">${action}</li>`).join('')}
        </ol>
      </section>
    `
    : '';

  const audioBlock = audioUrl
    ? `
      <div style="margin: 24px 0; padding: 16px; border-radius: 12px; background: #e0f2fe;">
        <p style="margin: 0 0 8px 0; font-weight: 600; color: #0369a1;">Vil du lytte i stedet?</p>
        <a href="${audioUrl}" style="color: #0f172a;">Klikk her for å høre dagens briefing.</a>
      </div>
    `
    : '';

  const logoBlock = LOGO_URL
    ? `<img src="${LOGO_URL}" alt="Budbringer" style="height:68px; width:auto; display:block; margin-bottom:18px;" />`
    : `<p style="text-transform: uppercase; letter-spacing: 0.12em; font-size: 12px; color: #475569; font-weight: 600; margin: 0 0 16px 0;">Budbringer</p>`;

  const badgeBlock = `<span style="display:inline-flex; align-items:center; gap:6px; padding:6px 16px; border-radius:999px; background:linear-gradient(90deg,#bae6fd33,#60a5fa33); color:#0f172a; font-size:11px; font-weight:600; letter-spacing:0.18em; text-transform:uppercase;">Daglig KI-brief</span>`;

  return `
    <body style="margin:0; font-family: 'Inter', sans-serif; background-color: #e2e8f0; color: #0f172a;">
      <div style="max-width: 640px; margin: 0 auto; padding: 32px 24px;">
        <header style="margin-bottom: 32px; padding: 28px; border-radius: 24px; background: linear-gradient(135deg,#ffffff,#e0f2fe); border: 1px solid #f8fafc; box-shadow: 0 22px 55px rgba(30, 41, 59, 0.15);">
          ${logoBlock}
          ${badgeBlock}
          <h1 style="font-size: 28px; margin: 12px 0 16px 0; color:#0f172a;">${dateLabel}</h1>
          <p style="font-size: 18px; color: #1e293b; line-height: 1.6;">${lead}</p>
          ${audioBlock}
        </header>
        <main style="background:#ffffff; border-radius: 24px; padding: 32px 28px; box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);">
          ${sectionHtml}
          ${actionsHtml}
        </main>
        <footer style="margin-top: 32px; font-size: 12px; color: #64748b; text-align:center;">
          <p>Du mottar denne e-posten fordi du har meldt deg på Budbringers daglige KI-brief.</p>
          <p>Oppdater preferansene dine eller meld deg av <a href="{{unsubscribe_url}}" style="color: #2563eb;">her</a>.</p>
        </footer>
      </div>
    </body>
  `;
}

export function renderDigestText({ dateLabel, lead, sections, actions, audioUrl }: DigestEmailPayload) {
  const sectionText = sections
    .map((section) => {
      const bullets = section.bullets.map((bullet) => `  - ${bullet}`).join('\n');
      const linkLine = section.link ? `\nLes mer: ${section.link}` : '';
      return `${section.heading}\n${bullets}${linkLine}`;
    })
    .join('\n\n');

  const actionsText = actions?.length
    ? `\n\nHva bør du gjøre?\n${actions.map((action, index) => `${index + 1}. ${action}`).join('\n')}`
    : '';

  const audioLine = audioUrl ? `\n\nLytt: ${audioUrl}` : '';

  return `Budbringer – ${dateLabel}\n\n${lead}\n\n${sectionText}${actionsText}${audioLine}\n\nAdministrer abonnementet ditt: {{unsubscribe_url}}`;
}

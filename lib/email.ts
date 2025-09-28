/**
 * EMAIL TEMPLATE SYSTEM
 * =====================
 * This file generates the HTML and text versions of the newsletter emails.
 * It takes content from the AI and formats it into beautiful, responsive emails.
 *
 * MAIN FUNCTIONS:
 * - renderDigestHtml(): Creates the HTML email (what users see in email clients)
 * - renderDigestText(): Creates the plain text version (fallback for old email clients)
 *
 * CUSTOMIZATION GUIDE:
 * - Colors: Search for hex codes like #0ea5e9 to change brand colors
 * - Spacing: Look for margin/padding values like "32px" to adjust spacing
 * - Fonts: Change font-family and font-size properties
 * - Layout: Modify the structure in the HTML template sections
 */

import { processDigestContentMarkdown, processDigestContentText } from './markdown-utils';
import { DigestEmailPayload } from './types';

/**
 * MAIN HTML EMAIL RENDERER
 * =========================
 * This function takes newsletter content and creates a beautiful HTML email.
 *
 * INPUT: DigestEmailPayload (the newsletter content from AI processing)
 * OUTPUT: Complete HTML email as a string
 *
 * STRUCTURE:
 * 1. Header (logo, date, intro text)
 * 2. Main content sections (news items organized by topic)
 * 3. Action items (what the reader should do)
 * 4. Footer (unsubscribe links)
 */
export function renderDigestHtml(payload: DigestEmailPayload) {
  // STEP 1: Process markdown formatting (converts **bold** to <strong>bold</strong>, etc.)
  const processedContent = processDigestContentMarkdown(payload);

  // STEP 2: Extract all the data we need from the processed content
  const { dateLabel, lead, sections, actions, audioUrl } = processedContent;

  /**
   * STEP 3: BUILD MAIN CONTENT SECTIONS
   * ====================================
   * This creates the main body of the newsletter where each news topic gets its own section.
   * Each section has:
   * - A colored sidebar + heading
   * - Bullet points with the news items
   * - Optional source links under each bullet
   * - Optional "Read more" link at the bottom
   *
   * CUSTOMIZATION:
   * - Change section spacing: modify "margin-bottom: 56px"
   * - Change section colors: modify the gradient colors #0ea5e9, #0284c7
   * - Change text sizes: modify font-size values
   * - Change bullet style: modify the bullet point span styles
   */
  const sectionHtml = sections
    .map(
      (section) => `
        <section style="margin-bottom: 56px;">
          <!-- SECTION HEADER: Colored sidebar + heading -->
          <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 28px;">
            <!-- Colored sidebar (vertical line) -->
            <div style="width: 5px; height: 28px; background: linear-gradient(135deg, #0ea5e9, #0284c7); border-radius: 4px; margin-top: 3px; flex-shrink: 0; box-shadow: 0 2px 4px rgba(14, 165, 233, 0.2);"></div>
            <!-- Section heading text -->
            <h2 style="font-size: 22px; margin: 0; color: #0f172a; font-weight: 700; line-height: 1.25; letter-spacing: -0.02em; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;">${section.heading}</h2>
          </div>

          <!-- SECTION CONTENT: Bullet points with news items -->
          <div style="padding-left: 21px;">
            <ul style="padding: 0; margin: 0; list-style: none;">
              ${section.bullets.map((bullet) => {
                // Handle both old format (just text) and new format (with source links)
                const bulletText = typeof bullet === 'string' ? bullet : bullet.text;

                // Create source link if we have source info (this is the new feature!)
                const sourceLink = typeof bullet === 'object' && bullet.sourceUrl && bullet.sourceName
                  ? `<div style="margin-top: 8px; font-size: 14px;"><a href="${bullet.sourceUrl}" style="color: #64748b; text-decoration: none; font-weight: 500; border-bottom: 1px solid rgba(100, 116, 139, 0.3); transition: all 0.2s;" onmouseover="this.style.color='#0ea5e9'; this.style.borderColor='rgba(14, 165, 233, 0.5)'" onmouseout="this.style.color='#64748b'; this.style.borderColor='rgba(100, 116, 139, 0.3)'">Kilde: ${bullet.sourceName}</a></div>`
                  : '';

                return `<li style="margin-bottom: 20px; color: #475569; line-height: 1.7; position: relative; padding-left: 24px; font-size: 16px; font-weight: 400;">
                  <!-- Bullet point dot -->
                  <span style="position: absolute; left: 0; top: 12px; width: 7px; height: 7px; background: linear-gradient(135deg, #0ea5e9, #0284c7); border-radius: 50%; opacity: 0.9; box-shadow: 0 1px 3px rgba(14, 165, 233, 0.3);"></span>
                  <!-- Main text + source link -->
                  ${bulletText}${sourceLink}
                </li>`;
              }).join('')}
            </ul>

            <!-- Optional "Read more" button if section has a link -->
            ${section.link ? `<div style="margin-top: 28px; padding-left: 24px;"><a href="${section.link}" style="color: #0ea5e9; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-flex; align-items: center; gap: 8px; border-radius: 8px; padding: 12px 18px; background: linear-gradient(135deg, rgba(14, 165, 233, 0.08), rgba(14, 165, 233, 0.06)); border: 1px solid rgba(14, 165, 233, 0.15); transition: all 0.2s; box-shadow: 0 2px 4px rgba(14, 165, 233, 0.1);">Les mer <span style="font-size: 14px; font-weight: 700;">→</span></a></div>` : ''}
          </div>
        </section>
      `
    )
    .join('\n');

  /**
   * STEP 4: BUILD ACTION ITEMS SECTION
   * ===================================
   * This creates the "What should you do?" section at the bottom of the newsletter.
   * It only appears if there are action items from the AI.
   *
   * CUSTOMIZATION:
   * - Change the background color: modify the background gradient colors
   * - Change the checkmark icon: replace the "✓" with another symbol
   * - Change spacing between items: modify padding values
   * - Change the heading text: modify "Hva bør du gjøre?"
   */
  const actionsHtml = actions?.length
    ? `
      <!-- ACTIONS SECTION: Highlighted box with action items -->
      <section style="margin-top: 64px; padding: 36px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 20px; border: 1px solid rgba(226, 232, 240, 0.8); box-shadow: 0 8px 25px rgba(15, 23, 42, 0.08), 0 3px 10px rgba(15, 23, 42, 0.04);">

        <!-- Actions header with checkmark icon -->
        <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 24px;">
          <!-- Checkmark icon -->
          <div style="width: 28px; height: 28px; background: linear-gradient(135deg, #0ea5e9, #0284c7); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25);">
            <span style="color: white; font-size: 14px; font-weight: 700;">✓</span>
          </div>
          <!-- Section heading -->
          <h3 style="font-size: 20px; margin: 0; color: #0f172a; font-weight: 700; letter-spacing: -0.02em; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1;">Hva bør du gjøre?</h3>
        </div>

        <!-- Numbered list of action items -->
        <div style="display: flex; flex-direction: column; gap: 0;">
          ${actions.map((action, index) =>
            `<div style="display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; ${index !== actions.length - 1 ? 'border-bottom: 1px solid rgba(226, 232, 240, 0.5);' : ''}">
              <!-- Number -->
              <span style="color: #0ea5e9; font-size: 15px; font-weight: 700; min-width: 24px; line-height: 1.6;">${index + 1}.</span>
              <!-- Action text -->
              <span style="flex: 1; color: #475569; font-size: 15px; line-height: 1.6; font-weight: 400;">${action}</span>
            </div>`
          ).join('')}
        </div>
      </section>
    `
    : ''; // Don't show actions section if there are no action items

  /**
   * STEP 5: BUILD AUDIO SECTION (OPTIONAL)
   * =======================================
   * This creates an audio player section if there's an audio version of the newsletter.
   * Currently not used but ready for future audio features.
   *
   * CUSTOMIZATION:
   * - Change colors: modify the blue gradient colors (#3b82f6, #1d4ed8)
   * - Change text: modify "Vil du lytte i stedet?" and button text
   * - Change play button: replace "▶" with another symbol
   */
  const audioBlock = audioUrl
    ? `
      <!-- AUDIO SECTION: Optional audio player -->
      <div style="margin: 32px 0; padding: 28px; border-radius: 20px; background: linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%); border: 1px solid rgba(191, 219, 254, 0.8); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);">
        <div style="display: flex; align-items: center; gap: 18px;">
          <!-- Play button icon -->
          <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);">
            <span style="color: white; font-size: 18px; font-weight: 700;">▶</span>
          </div>
          <!-- Audio text and link -->
          <div style="flex: 1;">
            <p style="margin: 0 0 6px 0; font-weight: 700; color: #1e40af; font-size: 17px; letter-spacing: -0.01em;">Vil du lytte i stedet?</p>
            <a href="${audioUrl}" style="color: #0ea5e9; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-flex; align-items: center; gap: 6px;">Klikk her for å høre dagens briefing <span style="font-size: 14px; font-weight: 700;">→</span></a>
          </div>
        </div>
      </div>
    `
    : ''; // Don't show audio section if there's no audio URL

  /**
   * STEP 6: BUILD HEADER BLOCK
   * ===========================
   * This creates the main Budbringer logo and branding at the top of the email.
   *
   * CUSTOMIZATION:
   * - Change the logo text: modify "Budbringer"
   * - Change the tagline: modify "Daglig KI-brief"
   * - Change the brand colors: modify the gradient colors
   * - Change the logo size: modify font-size values
   */
  const headerBlock = `
    <div style="text-align: center; margin-bottom: 36px;">
      <!-- Brand badge with dot and tagline -->
      <div style="display: inline-flex; align-items: center; gap: 10px; padding: 10px 24px; border-radius: 999px; background: linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(14, 165, 233, 0.15)); border: 1px solid rgba(14, 165, 233, 0.25); box-shadow: 0 4px 12px rgba(14, 165, 233, 0.12), 0 2px 6px rgba(14, 165, 233, 0.08); margin-bottom: 20px;">
        <!-- Brand dot/indicator -->
        <div style="width: 10px; height: 10px; background: linear-gradient(135deg, #0ea5e9, #0284c7); border-radius: 50%; box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.2), 0 2px 4px rgba(14, 165, 233, 0.1);"></div>
        <!-- Tagline text -->
        <span style="color: #0f172a; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;">Daglig KI-brief</span>
      </div>
      <!-- Main logo/brand name -->
      <h1 style="font-size: 42px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.03em; line-height: 1.05; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;">Budbringer</h1>
    </div>`;

  /**
   * STEP 7: ASSEMBLE FINAL HTML EMAIL
   * ==================================
   * This combines all the sections into a complete HTML email with proper structure.
   *
   * LAYOUT STRUCTURE:
   * - Overall container: max-width 720px (good for email clients)
   * - Header card: Logo, date, intro text, optional audio
   * - Main content card: All the news sections and actions
   * - Footer: Unsubscribe links and legal text
   *
   * CUSTOMIZATION:
   * - Change email width: modify "max-width: 720px"
   * - Change overall colors: modify background gradients
   * - Change card spacing: modify margin and padding values
   * - Change card shadows: modify box-shadow values
   */
  return `
    <!DOCTYPE html>
    <html lang="no">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${dateLabel} - Budbringer</title>
      <!-- Load Inter font from Google Fonts -->
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%); color: #0f172a; line-height: 1.6;">
      <!-- Main email container -->
      <div style="max-width: 720px; margin: 0 auto; padding: 48px 32px;">

        <!-- HEADER CARD: Logo, date, intro text -->
        <header style="background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border-radius: 28px; padding: 48px 44px; margin-bottom: 40px; box-shadow: 0 25px 50px rgba(15, 23, 42, 0.1), 0 10px 25px rgba(15, 23, 42, 0.06); border: 1px solid rgba(255, 255, 255, 0.9);">
          ${headerBlock}
          <!-- Date/title -->
          <h2 style="font-size: 24px; font-weight: 600; margin: 0 0 24px 0; color: #475569; letter-spacing: -0.015em; line-height: 1.3; text-align: center; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;">${dateLabel}</h2>
          <!-- Intro paragraph -->
          <div style="font-size: 19px; color: #475569; line-height: 1.65; margin-bottom: 24px; font-weight: 400;">
            ${lead}
          </div>
          <!-- Optional audio section -->
          ${audioBlock}
        </header>

        <!-- MAIN CONTENT CARD: News sections and action items -->
        <main style="background: #ffffff; border-radius: 28px; padding: 48px 44px; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08), 0 8px 20px rgba(15, 23, 42, 0.04); border: 1px solid rgba(255, 255, 255, 0.9);">
          ${sectionHtml}
          ${actionsHtml}
        </main>

        <!-- FOOTER: Unsubscribe and legal text -->
        <footer style="margin-top: 96px; text-align: center; padding: 0 24px;">
          <div style="background: rgba(255, 255, 255, 0.7); border-radius: 16px; padding: 24px 28px; border: 1px solid rgba(255, 255, 255, 0.9); box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);">
            <!-- Subscription notice -->
            <p style="margin: 0 0 10px 0; font-size: 13px; color: #64748b; line-height: 1.5; font-weight: 400;">
              Du får denne e-posten fordi du har meldt deg på Budbringers daglige KI-brief.
            </p>
            <!-- Unsubscribe link -->
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b; font-weight: 400;">
              <a href="{{unsubscribe_url}}" style="color: #0ea5e9; text-decoration: none; font-weight: 600; border-bottom: 1px solid rgba(14, 165, 233, 0.3);">Meld deg av nyhetsbrevet</a>
            </p>
            <!-- GDPR compliance text -->
            <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.5; font-weight: 400;">
              Alle personopplysninger slettes automatisk når du trykker på "Meld deg av nyhetsbrevet".
            </p>
          </div>
        </footer>

      </div>
    </body>
    </html>
  `;
}

/**
 * PLAIN TEXT EMAIL RENDERER
 * ==========================
 * This creates a plain text version of the newsletter for email clients that don't support HTML.
 * It's much simpler than the HTML version but contains the same information.
 *
 * INPUT: DigestEmailPayload (same as HTML version)
 * OUTPUT: Plain text email as a string
 *
 * STRUCTURE:
 * 1. Header (BUDBRINGER - DATE)
 * 2. Intro paragraph
 * 3. Sections with bullet points
 * 4. Action items (numbered list)
 * 5. Footer with unsubscribe link
 *
 * CUSTOMIZATION:
 * - Change bullet symbols: modify "•" character
 * - Change section separators: modify "\n\n" spacing
 * - Change header format: modify "BUDBRINGER – ${dateLabel.toUpperCase()}"
 * - Change numbering style: modify action item formatting
 */
export function renderDigestText(payload: DigestEmailPayload) {
  // Process markdown formatting for plain text (removes **bold** etc.)
  const processedContent = processDigestContentText(payload);

  const { dateLabel, lead, sections, actions, audioUrl } = processedContent;

  /**
   * BUILD MAIN SECTIONS
   * ===================
   * Convert each news section into plain text format:
   * - Section heading
   * - Bullet points with source links
   * - Optional "Read more" links
   */
  const sectionText = sections
    .map((section) => {
      // Convert bullets to plain text format
      const bullets = section.bullets.map((bullet) => {
        const bulletText = typeof bullet === 'string' ? bullet : bullet.text;
        // Add source link on separate line if available
        const sourceLine = typeof bullet === 'object' && bullet.sourceUrl && bullet.sourceName
          ? `\n    Kilde: ${bullet.sourceName} (${bullet.sourceUrl})`
          : '';
        return `  • ${bulletText}${sourceLine}`;
      }).join('\n');

      // Add "Read more" link if section has one
      const linkLine = section.link ? `\n  Les mer: ${section.link}` : '';

      return `${section.heading}\n${bullets}${linkLine}`;
    })
    .join('\n\n');

  /**
   * BUILD ACTION ITEMS
   * ==================
   * Create numbered list of action items (if any exist)
   */
  const actionsText = actions?.length
    ? `\n\nHva bør du gjøre?\n${actions.map((action, index) => `${index + 1}. ${action}`).join('\n')}`
    : '';

  /**
   * ADD AUDIO LINK
   * ==============
   * Include audio URL if available (currently not used but ready for future)
   */
  const audioLine = audioUrl ? `\n\nLytt til dagens briefing: ${audioUrl}` : '';

  /**
   * ASSEMBLE FINAL TEXT EMAIL
   * =========================
   * Combine all parts into the final plain text email
   */
  return `BUDBRINGER – ${dateLabel.toUpperCase()}

${lead}

${sectionText}${actionsText}${audioLine}

---
Administrer abonnementet ditt: {{unsubscribe_url}}
Alle personopplysninger slettes automatisk ved avmelding (GDPR-kompatibelt)`;
}

/**
 * QUICK CUSTOMIZATION REFERENCE
 * ==============================
 * Common things you might want to change:
 *
 * BRAND COLORS:
 * - Primary blue: #0ea5e9 (used for links, buttons, accents)
 * - Secondary blue: #0284c7 (used in gradients)
 * - Text colors: #0f172a (dark), #475569 (medium), #64748b (light)
 *
 * BRAND TEXT:
 * - Newsletter name: "Budbringer" (line 192)
 * - Tagline: "Daglig KI-brief" (line 189)
 * - Actions heading: "Hva bør du gjøre?" (line 123)
 * - Audio text: "Vil du lytte i stedet?" (line 163)
 *
 * LAYOUT:
 * - Email width: max-width: 720px (line 224)
 * - Card spacing: margin-bottom values
 * - Text sizes: font-size values throughout
 * - Border radius: border-radius values for card roundness
 *
 * SOURCE LINKS:
 * - Source link color: #64748b (line 79)
 * - Source link text: "Kilde:" (line 79)
 * - Source hover color: #0ea5e9 (line 79)
 *
 * To find where to change something specific, search for the relevant text
 * or CSS property in this file. Each section is clearly labeled with comments.
 */

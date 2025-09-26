/**
 * Simple markdown processing for email content
 * Converts basic markdown formatting to HTML
 */

export function processMarkdownToHtml(text: string): string {
  if (!text) return text;

  return text
    // Bold text: **text** -> <strong>text</strong> (must come before single *)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

    // Italic text: _text_ or *text* -> <em>text</em> (after ** processing)
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')

    // Links: [text](url) -> <a href="url">text</a>
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #2563eb; text-decoration: none;">$1</a>')

    // Inline code: `code` -> <code>code</code>
    .replace(/`([^`]+)`/g, '<code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: \'JetBrains Mono\', monospace; font-size: 0.9em;">$1</code>')

    // Line breaks: double newlines -> paragraph breaks
    .replace(/\n\s*\n/g, '</p><p style="margin: 0 0 12px 0; line-height: 1.6;">')

    // Single newlines -> <br>
    .replace(/\n/g, '<br>');
}

export function processMarkdownToText(text: string): string {
  if (!text) return text;

  return text
    // Remove bold/italic formatting, keep content
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')

    // Links: [text](url) -> text (url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')

    // Remove inline code formatting
    .replace(/`([^`]+)`/g, '$1')

    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Process digest content to handle markdown formatting
 */
export function processDigestContentMarkdown(content: {
  dateLabel: string;
  lead: string;
  sections: Array<{
    heading: string;
    bullets: string[];
    link?: string;
  }>;
  actions: string[];
}): typeof content {
  return {
    ...content,
    lead: processMarkdownToHtml(content.lead),
    sections: content.sections.map(section => ({
      ...section,
      heading: processMarkdownToHtml(section.heading),
      bullets: section.bullets.map(bullet => processMarkdownToHtml(bullet))
    })),
    actions: content.actions.map(action => processMarkdownToHtml(action))
  };
}

/**
 * Process digest content for plain text output
 */
export function processDigestContentText(content: {
  dateLabel: string;
  lead: string;
  sections: Array<{
    heading: string;
    bullets: string[];
    link?: string;
  }>;
  actions: string[];
}): typeof content {
  return {
    ...content,
    lead: processMarkdownToText(content.lead),
    sections: content.sections.map(section => ({
      ...section,
      heading: processMarkdownToText(section.heading),
      bullets: section.bullets.map(bullet => processMarkdownToText(bullet))
    })),
    actions: content.actions.map(action => processMarkdownToText(action))
  };
}
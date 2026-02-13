// Simple markdown to HTML converter
// Handles: paragraphs, headers, bold, italic, links, lists, code, blockquotes, horizontal rules

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function processInline(text: string): string {
  const placeholders: string[] = [];
  function placeholder(content: string): string {
    placeholders.push(content);
    return `\x00PH${placeholders.length - 1}\x00`;
  }

  // Code (inline)
  text = text.replace(/`([^`]+)`/g, (_, code) => placeholder(`<code>${code}</code>`));

  // Links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, linkText, url) => {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:')) {
      return placeholder(`<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`);
    }
    return placeholder(`<a href="${url}">${linkText}</a>`);
  });

  // Bold
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // Italic
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  text = text.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Restore placeholders
  text = text.replace(/\x00PH(\d+)\x00/g, (_, idx) => placeholders[parseInt(idx)]);

  return text;
}

export function renderMarkdown(md: string): string {
  const lines = md.split('\n');
  const html: string[] = [];
  let listStack: { type: 'ul' | 'ol'; indent: number }[] = [];
  let openLiCount = 0;
  let inBlockquote = false;
  let inCodeBlock = false;
  let paragraph: string[] = [];

  function flushParagraph() {
    if (paragraph.length > 0) {
      const text = paragraph.join('<br>').trim();
      if (text) {
        html.push(`<p>${processInline(text)}</p>`);
      }
      paragraph = [];
    }
  }

  function closeAllLists() {
    while (listStack.length > 0) {
      if (openLiCount > 0) {
        html.push('</li>');
        openLiCount--;
      }
      const list = listStack.pop()!;
      html.push(list.type === 'ol' ? '</ol>' : '</ul>');
    }
  }

  function closeBlockquote() {
    if (inBlockquote) {
      html.push('</blockquote>');
      inBlockquote = false;
    }
  }

  function getIndentLevel(line: string): number {
    const match = line.match(/^([\t ]*)/);
    if (!match) return 0;
    let level = 0;
    for (const char of match[1]) {
      if (char === '\t') level += 1;
      else level += 0.25;
    }
    return Math.floor(level);
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block
    if (line.startsWith('```')) {
      flushParagraph();
      closeAllLists();
      closeBlockquote();
      if (inCodeBlock) {
        html.push('</pre>');
        inCodeBlock = false;
      } else {
        html.push('<pre>');
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      html.push(escapeHtml(line));
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      flushParagraph();
      closeAllLists();
      closeBlockquote();
      continue;
    }

    // Headers
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      flushParagraph();
      closeAllLists();
      closeBlockquote();
      const level = headerMatch[1].length;
      html.push(`<h${level}>${processInline(headerMatch[2])}</h${level}>`);
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      flushParagraph();
      closeAllLists();
      if (!inBlockquote) {
        html.push('<blockquote>');
        inBlockquote = true;
      }
      html.push(`<p>${processInline(line.slice(2))}</p>`);
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^([\t ]*)[-*]\s+(.+)$/);
    if (ulMatch) {
      flushParagraph();
      closeBlockquote();
      const indent = getIndentLevel(line);
      const content = ulMatch[2];

      while (listStack.length > 0) {
        const top = listStack[listStack.length - 1];
        if (top.indent > indent) {
          if (openLiCount > 0) { html.push('</li>'); openLiCount--; }
          html.push(top.type === 'ol' ? '</ol>' : '</ul>');
          listStack.pop();
        } else if (top.indent === indent) {
          if (top.type === 'ul') {
            if (openLiCount > 0) { html.push('</li>'); openLiCount--; }
            break;
          } else {
            if (openLiCount > 0) { html.push('</li>'); openLiCount--; }
            html.push('</ol>');
            listStack.pop();
          }
        } else {
          break;
        }
      }

      if (listStack.length === 0 || listStack[listStack.length - 1].indent < indent) {
        html.push('<ul>');
        listStack.push({ type: 'ul', indent });
      }

      html.push(`<li>${processInline(content)}`);
      openLiCount++;
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^([\t ]*)\d+\.\s+(.+)$/);
    if (olMatch) {
      flushParagraph();
      closeBlockquote();
      const indent = getIndentLevel(line);
      const content = olMatch[2];

      while (listStack.length > 0) {
        const top = listStack[listStack.length - 1];
        if (top.indent > indent) {
          if (openLiCount > 0) { html.push('</li>'); openLiCount--; }
          html.push(top.type === 'ol' ? '</ol>' : '</ul>');
          listStack.pop();
        } else if (top.indent === indent) {
          if (top.type === 'ol') {
            if (openLiCount > 0) { html.push('</li>'); openLiCount--; }
            break;
          } else {
            if (openLiCount > 0) { html.push('</li>'); openLiCount--; }
            html.push('</ul>');
            listStack.pop();
          }
        } else {
          break;
        }
      }

      if (listStack.length === 0 || listStack[listStack.length - 1].indent < indent) {
        html.push('<ol>');
        listStack.push({ type: 'ol', indent });
      }

      html.push(`<li>${processInline(content)}`);
      openLiCount++;
      continue;
    }

    // Horizontal rule
    if (line.match(/^[-*_]{3,}$/)) {
      flushParagraph();
      closeAllLists();
      closeBlockquote();
      html.push('<hr>');
      continue;
    }

    // Regular paragraph content
    paragraph.push(line);
  }

  flushParagraph();
  closeAllLists();
  closeBlockquote();
  if (inCodeBlock) {
    html.push('</pre>');
  }

  return html.join('\n');
}

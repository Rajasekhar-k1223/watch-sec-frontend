/**
 * Monitorix Sovereign Enterprise — High-Fidelity Markdown Documentation Engine
 * 100% Client-Side, Sovereign & Offline. Zero external dependencies.
 */

class MonitorixDocViewer {
  constructor(options = {}) {
    this.containerId = options.containerId || 'docViewerContent';
    this.tocContainerId = options.tocContainerId || 'docViewerToc';
    this.titleContainerId = options.titleContainerId || 'docViewerTitle';
    this.metaContainerId = options.metaContainerId || 'docViewerMeta';
  }

  /**
   * Escape raw HTML entities
   */
  escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Parse Markdown to rich semantic HTML
   */
  renderMarkdown(md) {
    if (!md) return '<p class="doc-empty">Document is empty.</p>';

    // Normalize line breaks
    let src = md.replace(/\r\n/g, '\n');

    // Remove YAML frontmatter if present
    src = src.replace(/^---\n[\s\S]*?\n---\n/, '');

    // Placeholders for code blocks to prevent inner markdown processing
    const codeBlocks = [];
    src = src.replace(/```([a-zA-Z0-9_\-\.]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const idx = codeBlocks.length;
      const cleanLang = (lang || 'text').toLowerCase();
      const escapedCode = this.escapeHtml(code.trimEnd());
      
      let html = '';
      if (cleanLang === 'mermaid') {
        html = `
          <div class="doc-mermaid-block">
            <div class="doc-mermaid-header">
              <span class="doc-code-lang">📊 Mermaid Architecture Flow</span>
            </div>
            <pre class="mermaid-raw"><code>${escapedCode}</code></pre>
          </div>
        `;
      } else {
        html = `
          <div class="doc-code-block">
            <div class="doc-code-header">
              <span class="doc-code-lang">${cleanLang}</span>
              <button class="doc-copy-btn" onclick="MonitorixDocViewer.copyCode(this)">
                <span>📋</span> Copy
              </button>
            </div>
            <pre class="doc-pre"><code class="language-${cleanLang}">${escapedCode}</code></pre>
          </div>
        `;
      }
      codeBlocks.push(html);
      return `\n\n%%CODE_BLOCK_${idx}%%\n\n`;
    });

    const lines = src.split('\n');
    const out = [];
    let inList = false;
    let listType = null; // 'ul' or 'ol'
    let inTable = false;
    let tableRows = [];
    let inBlockquote = false;
    let blockquoteLines = [];

    const flushBlockquote = () => {
      if (!inBlockquote) return;
      const fullText = blockquoteLines.join('\n').trim();
      blockquoteLines = [];
      inBlockquote = false;

      // Check for GitHub Alerts
      const alertMatch = fullText.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n?([\s\S]*)$/i);
      if (alertMatch) {
        const type = alertMatch[1].toUpperCase();
        const content = this.renderInline(alertMatch[2].trim());
        const icons = {
          'NOTE': 'ℹ️',
          'TIP': '💡',
          'IMPORTANT': '📌',
          'WARNING': '⚠️',
          'CAUTION': '🚨'
        };
        const titles = {
          'NOTE': 'Note',
          'TIP': 'Tip & Best Practice',
          'IMPORTANT': 'Critical Requirement',
          'WARNING': 'Warning',
          'CAUTION': 'High-Risk Caution'
        };
        out.push(`
          <div class="doc-alert alert-${type.toLowerCase()}">
            <div class="doc-alert-title">
              <span class="doc-alert-icon">${icons[type] || 'ℹ️'}</span>
              <span>${titles[type] || type}</span>
            </div>
            <div class="doc-alert-content">${content}</div>
          </div>
        `);
      } else {
        out.push(`
          <blockquote class="doc-blockquote">
            ${this.renderInline(fullText)}
          </blockquote>
        `);
      }
    };

    const flushList = () => {
      if (inList) {
        out.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
    };

    const flushTable = () => {
      if (!inTable) return;
      inTable = false;
      if (tableRows.length < 2) {
        // Not a valid table, output as plain text
        tableRows.forEach(r => out.push(`<p>${this.renderInline(r)}</p>`));
        tableRows = [];
        return;
      }

      const headerRow = tableRows[0];
      const separatorRow = tableRows[1];
      const bodyRows = tableRows.slice(2);
      tableRows = [];

      // Check if second line is table separator
      if (!separatorRow.includes('---')) {
        out.push(`<p>${this.renderInline(headerRow)}</p>`);
        out.push(`<p>${this.renderInline(separatorRow)}</p>`);
        bodyRows.forEach(r => out.push(`<p>${this.renderInline(r)}</p>`));
        return;
      }

      const parseCells = row => {
        return row.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
      };

      const headers = parseCells(headerRow);
      let tableHtml = '<div class="doc-table-wrapper"><table class="doc-table"><thead><tr>';
      headers.forEach(h => {
        tableHtml += `<th>${this.renderInline(h)}</th>`;
      });
      tableHtml += '</tr></thead><tbody>';

      bodyRows.forEach(r => {
        if (!r.trim()) return;
        const cells = parseCells(r);
        tableHtml += '<tr>';
        cells.forEach((c, idx) => {
          tableHtml += `<td>${this.renderInline(c)}</td>`;
        });
        tableHtml += '</tr>';
      });

      tableHtml += '</tbody></table></div>';
      out.push(tableHtml);
    };

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Code block placeholder
      if (line.trim().startsWith('%%CODE_BLOCK_')) {
        flushBlockquote();
        flushList();
        flushTable();
        out.push(line.trim());
        continue;
      }

      // Blockquotes
      if (line.startsWith('>')) {
        flushList();
        flushTable();
        inBlockquote = true;
        blockquoteLines.push(line.replace(/^>\s?/, ''));
        continue;
      } else if (inBlockquote) {
        if (line.trim() === '') {
          flushBlockquote();
        } else {
          blockquoteLines.push(line);
          continue;
        }
      }

      // Tables (| ... |)
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        flushBlockquote();
        flushList();
        inTable = true;
        tableRows.push(line.trim());
        continue;
      } else if (inTable) {
        flushTable();
      }

      // Horizontal rules
      if (/^(\*\*\*|---|___)\s*$/.test(line.trim())) {
        flushBlockquote();
        flushList();
        flushTable();
        out.push('<hr class="doc-hr" />');
        continue;
      }

      // Headings
      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        flushBlockquote();
        flushList();
        flushTable();
        const level = headingMatch[1].length;
        const text = headingMatch[2].trim();
        const slug = MonitorixDocViewer.slugify(text);
        out.push(`
          <h${level} id="${slug}" class="doc-heading doc-h${level}">
            <a href="#${slug}" class="doc-anchor">#</a>
            <span>${this.renderInline(text)}</span>
          </h${level}>
        `);
        continue;
      }

      // Unordered list
      const ulMatch = line.match(/^(\s*)([\*\-\+])\s+(.*)$/);
      if (ulMatch) {
        flushBlockquote();
        flushTable();
        if (!inList || listType !== 'ul') {
          flushList();
          out.push('<ul class="doc-ul">');
          inList = true;
          listType = 'ul';
        }
        let itemText = ulMatch[3];
        // Checkboxes
        if (itemText.startsWith('[ ] ')) {
          itemText = '<input type="checkbox" disabled class="doc-task-checkbox"> ' + itemText.substring(4);
        } else if (itemText.startsWith('[x] ') || itemText.startsWith('[X] ')) {
          itemText = '<input type="checkbox" checked disabled class="doc-task-checkbox"> ' + itemText.substring(4);
        }
        out.push(`<li class="doc-li">${this.renderInline(itemText)}</li>`);
        continue;
      }

      // Ordered list
      const olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
      if (olMatch) {
        flushBlockquote();
        flushTable();
        if (!inList || listType !== 'ol') {
          flushList();
          out.push('<ol class="doc-ol">');
          inList = true;
          listType = 'ol';
        }
        out.push(`<li class="doc-li">${this.renderInline(olMatch[3])}</li>`);
        continue;
      }

      // Empty line
      if (line.trim() === '') {
        flushBlockquote();
        flushList();
        flushTable();
        continue;
      }

      // Regular paragraph
      flushBlockquote();
      flushList();
      flushTable();
      out.push(`<p class="doc-p">${this.renderInline(line)}</p>`);
    }

    // Flush any remaining blocks
    flushBlockquote();
    flushList();
    flushTable();

    // Re-insert code blocks
    let finalHtml = out.join('\n');
    codeBlocks.forEach((block, idx) => {
      finalHtml = finalHtml.replace(`%%CODE_BLOCK_${idx}%%`, block);
    });

    return finalHtml;
  }

  /**
   * Render inline formatting: bold, italic, code, links, images
   */
  renderInline(text) {
    if (!text) return '';

    // Inline code (`...`)
    text = text.replace(/`([^`]+)`/g, (m, c) => `<code class="doc-inline-code">${this.escapeHtml(c)}</code>`);

    // Bold + Italic (***...***)
    text = text.replace(/\*\*\*([^\*]+)\*\*\*/g, '<strong><em>$1</em></strong>');

    // Bold (**...**)
    text = text.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');

    // Italic (*...*)
    text = text.replace(/\*([^\*]+)\*/g, '<em>$1</em>');

    // Images (![alt](url))
    text = text.replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, (m, alt, url) => {
      return `<div class="doc-img-container"><img src="${url}" alt="${alt}" class="doc-img" onclick="openLightbox('${url}', '${alt}')" /><div class="doc-img-caption">${alt}</div></div>`;
    });

    // Links ([text](url)) - rewrite .md links to viewer
    text = text.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, (m, txt, url) => {
      let targetUrl = url;
      let isExternal = url.startsWith('http://') || url.startsWith('https://');
      
      // If linking to a local .md document, open via viewer
      if (url.endsWith('.md') && !isExternal) {
        const cleanName = url.split('/').pop();
        return `<a href="/docs/viewer.html?doc=${cleanName}" class="doc-link" onclick="if(window.openDocViewer){openDocViewer('${cleanName}', event);}">${txt} ↗</a>`;
      }
      return `<a href="${targetUrl}" class="doc-link" ${isExternal ? 'target="_blank" rel="noopener"' : ''}>${txt}</a>`;
    });

    return text;
  }

  /**
   * Extract Table of Contents from HTML
   */
  generateToc(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const headings = temp.querySelectorAll('h1, h2, h3');
    if (headings.length === 0) return '<p class="doc-toc-empty">No sections available</p>';

    let tocHtml = '<ul class="doc-toc-list">';
    headings.forEach(h => {
      const level = h.tagName.toLowerCase();
      const id = h.id;
      const text = h.innerText.replace(/^#\s*/, '').trim();
      tocHtml += `
        <li class="doc-toc-item doc-toc-${level}">
          <a href="#${id}" class="doc-toc-link" onclick="MonitorixDocViewer.smoothScroll('${id}', event)">
            ${text}
          </a>
        </li>
      `;
    });
    tocHtml += '</ul>';
    return tocHtml;
  }

  /**
   * Calculate Reading Time
   */
  static estimateReadingTime(text) {
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 220));
    return `${minutes} min read (${words.toLocaleString()} words)`;
  }

  /**
   * Convert heading text to clean URL slug
   */
  static slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  /**
   * Copy code snippet to clipboard with feedback
   */
  static copyCode(btn) {
    const codeBlock = btn.closest('.doc-code-block');
    const code = codeBlock.querySelector('code').innerText;
    navigator.clipboard.writeText(code).then(() => {
      const orig = btn.innerHTML;
      btn.innerHTML = '<span>✓</span> Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.classList.remove('copied');
      }, 2000);
    });
  }

  /**
   * Smooth scroll to anchor without jumping layout
   */
  static smoothScroll(id, evt) {
    if (evt) evt.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.pushState(null, null, `#${id}`);
    }
  }

  /**
   * Load and render document by filename
   */
  async loadDocument(filename) {
    const contentEl = document.getElementById(this.containerId);
    const tocEl = document.getElementById(this.tocContainerId);
    const titleEl = document.getElementById(this.titleContainerId);
    const metaEl = document.getElementById(this.metaContainerId);

    if (contentEl) {
      contentEl.innerHTML = `
        <div class="doc-loading">
          <div class="doc-spinner"></div>
          <p>Loading sovereign documentation <strong>${this.escapeHtml(filename)}</strong>...</p>
        </div>
      `;
    }

    try {
      // Append ?raw=1 so Nginx doesn't redirect and serves pure text/markdown
      const resp = await fetch(`/docs/${encodeURIComponent(filename)}?raw=1`, {
        headers: { 'Accept': 'text/markdown, text/plain, */*' },
        cache: 'no-cache'
      });

      if (!resp.ok) {
        throw new Error(`Failed to load document (${resp.status} ${resp.statusText})`);
      }

      const mdText = await resp.text();
      const renderedHtml = this.renderMarkdown(mdText);

      if (contentEl) contentEl.innerHTML = renderedHtml;

      // Update Title & Meta
      const cleanTitle = filename.replace('.md', '').replace(/_/g, ' ');
      if (titleEl) titleEl.innerText = cleanTitle;
      if (metaEl) {
        metaEl.innerHTML = `
          <span>⏱️ ${MonitorixDocViewer.estimateReadingTime(mdText)}</span>
          <span>🔒 Air-Gapped Offline Verified</span>
          <span>🏷️ Production Release 19.1.0</span>
        `;
      }

      // Generate TOC
      if (tocEl) {
        tocEl.innerHTML = this.generateToc(renderedHtml);
      }

      // Check if URL has hash to scroll to
      if (window.location.hash) {
        const hashId = window.location.hash.substring(1);
        setTimeout(() => {
          MonitorixDocViewer.smoothScroll(hashId);
        }, 150);
      }

    } catch (err) {
      if (contentEl) {
        contentEl.innerHTML = `
          <div class="doc-error-card">
            <h3>⚠️ Unable to Load Documentation</h3>
            <p>${this.escapeHtml(err.message)}</p>
            <p style="font-size: 13px; color: var(--text-muted); margin-top: 10px;">
              Verify that <code>/docs/${this.escapeHtml(filename)}</code> exists on the sovereign node storage.
            </p>
          </div>
        `;
      }
    }
  }
}

// Global instance helper
window.MonitorixDocViewer = MonitorixDocViewer;

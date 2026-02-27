/**
 * PDF/Document Generation Tools — HTML documents with print CSS.
 *
 * Generates branded HTML documents ready for browser print-to-PDF.
 * Reuses contentEngine for brand styling and storage.
 * No heavy dependencies (no puppeteer, no pdfkit).
 */

import type { ToolSchema } from './registry.js';
import { storeContent, generateContentId, getBrandKit, injectBrandCSS } from './contentEngine.js';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Minimal markdown-to-HTML converter (no external deps) */
function markdownToHtml(md: string): string {
  let html = md;

  // Code blocks (``` ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    return `<pre style="background:#f4f4f4;padding:16px;border-radius:8px;overflow-x:auto;font-size:0.85em"><code>${escapeHtml(code.trimEnd())}</code></pre>`;
  });

  // Tables (| col | col |)
  html = html.replace(
    /(?:^\|.+\|$\n?)+/gm,
    (tableBlock) => {
      const lines = tableBlock.trim().split('\n').filter(Boolean);
      if (lines.length < 2) return tableBlock;

      const parseRow = (l: string) =>
        l.split('|').slice(1, -1).map((c) => c.trim());
      const headers = parseRow(lines[0]);
      // Skip separator row (line[1] = |---|---|)
      const rows = lines.slice(2).map(parseRow);

      let t = '<table><thead><tr>';
      for (const h of headers) t += `<th>${h}</th>`;
      t += '</tr></thead><tbody>';
      for (const row of rows) {
        t += '<tr>';
        for (const cell of row) t += `<td>${cell}</td>`;
        t += '</tr>';
      }
      t += '</tbody></table>';
      return t;
    },
  );

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold + italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Inline code
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');

  // Bullet lists (- item)
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
  // Fix nested <ul> by collapsing consecutive
  html = html.replace(/<\/ul>\s*<ul>/g, '');

  // Paragraphs (double newline)
  html = html.replace(/\n{2,}/g, '</p><p>');

  // Wrap in paragraphs if not already
  if (!html.startsWith('<')) html = `<p>${html}</p>`;

  return html;
}

export function getAllPdfGenerationTools(): ToolSchema[] {
  return [
    {
      name: 'pdf_generate',
      description:
        'Generate a branded HTML document ready for print-to-PDF. ' +
        'Use for: reports, proposals, letters, summaries, invoices, meeting notes, any printable document.',
      parameters: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: 'Document body in markdown or plain text',
          },
          title: {
            type: 'string',
            description: 'Document title (appears as heading)',
          },
          filename: {
            type: 'string',
            description: 'Suggested filename without extension (default: derived from title)',
          },
          org_id: {
            type: 'string',
            description: 'Organization ID for branding (optional)',
          },
        },
        required: ['content', 'title'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        try {
          const content = String(args.content || '');
          const title = String(args.title || 'Document');
          const filename = String(
            args.filename ||
              title
                .replace(/[^a-zA-Z0-9_\- ]/g, '')
                .replace(/\s+/g, '_')
                .slice(0, 50),
          );
          const orgId = (args.org_id as string) || 'default';
          const brand = getBrandKit(orgId);

          const bodyHtml = markdownToHtml(content);
          const dateStr = new Date().toLocaleDateString('es-PA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

          const fullHtml = injectBrandCSS(
            `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)}</title>
<style>
  body { max-width: 800px; margin: 0 auto; padding: 40px; font-family: var(--font-body); color: var(--brand-text); line-height: 1.6; }
  h1 { color: var(--brand-primary); border-bottom: 2px solid var(--brand-primary); padding-bottom: 8px; margin-bottom: 24px; }
  h2 { color: var(--brand-secondary); margin-top: 24px; }
  h3 { color: var(--brand-text); margin-top: 16px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th, td { padding: 8px 12px; border: 1px solid #ddd; text-align: left; }
  th { background: var(--brand-primary); color: #fff; font-weight: 600; }
  tr:nth-child(even) { background: #f9f9f9; }
  code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
  pre { background: #f4f4f4; padding: 16px; border-radius: 8px; overflow-x: auto; }
  blockquote { border-left: 4px solid var(--brand-primary); padding-left: 16px; color: #555; margin: 16px 0; }
  ul { padding-left: 24px; }
  li { margin-bottom: 4px; }
  @media print { body { margin: 0; padding: 20px; } @page { margin: 1in; } .no-print { display: none; } }
</style>
</head>
<body>
<div style="text-align:right;font-size:12px;color:#999;margin-bottom:24px">${brand.businessName} &middot; ${dateStr}</div>
<h1>${escapeHtml(title)}</h1>
${bodyHtml}
<div style="margin-top:40px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#aaa;text-align:center">
Generated by KITZ &middot; ${brand.businessName}
</div>
</body>
</html>`,
            brand,
          );

          const contentId = generateContentId();
          storeContent({
            contentId,
            type: 'document',
            html: fullHtml,
            data: { title, filename, traceId } as unknown as Record<string, unknown>,
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          return {
            success: true,
            contentId,
            html: fullHtml,
            filename: `${filename}.html`,
            title,
          };
        } catch (err) {
          return { error: `pdf_generate failed: ${(err as Error).message}` };
        }
      },
    },
  ];
}

/**
 * PDF/Document Generation Tools — HTML documents with print CSS.
 *
 * Generates branded HTML documents ready for browser print-to-PDF.
 * Reuses contentEngine for brand styling and storage.
 * No heavy dependencies (no puppeteer, no pdfkit).
 */

import type { ToolSchema } from './registry.js';
import { storeContent, generateContentId, generateSlug, getBrandKit, injectBrandCSS } from './contentEngine.js';
import { createSubsystemLogger } from 'kitz-schemas';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const log = createSubsystemLogger('pdfGenerationTools');
const __dirname = dirname(fileURLToPath(import.meta.url));
const PDF_DIR = join(__dirname, '..', '..', 'data', 'pdfs');

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
Generated by KitZ (OS) &middot; ${brand.businessName}
</div>
</body>
</html>`,
            brand,
          );

          const contentId = generateContentId();
          storeContent({
            contentId,
            slug: generateSlug(title || filename || 'Document', contentId),
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

    // ── 2. Generate Real PDF Binary via pdfkit ──
    {
      name: 'pdf_generateBinary',
      description:
        'Generate a real PDF file (binary) from structured data. ' +
        'Use for invoices, receipts, contracts, reports. Returns file path + base64.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Document title' },
          content: { type: 'string', description: 'Document body text (markdown or plain text)' },
          sections: {
            type: 'string',
            description: 'JSON array of sections: [{"heading":"...","body":"..."}]',
          },
          table: {
            type: 'string',
            description: 'JSON object with headers and rows: {"headers":["Item","Qty","Price"],"rows":[["Widget",2,10]]}',
          },
          footer: { type: 'string', description: 'Footer text (default: "Generated by KitZ (OS)")' },
          filename: { type: 'string', description: 'Filename without extension' },
        },
        required: ['title'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        try {
          const PDFDocument = (await import('pdfkit')).default;

          await mkdir(PDF_DIR, { recursive: true });
          const title = String(args.title || 'Document');
          const filename = String(
            args.filename || title.replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_').slice(0, 50),
          );
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          const pdfFilename = `${filename}-${timestamp}.pdf`;
          const pdfPath = join(PDF_DIR, pdfFilename);

          // Build PDF
          const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
          const chunks: Buffer[] = [];
          doc.on('data', (chunk: Buffer) => chunks.push(chunk));

          const pdfDone = new Promise<void>((resolve) => doc.on('end', resolve));

          // Header — KITZ brand purple
          doc.fontSize(10).fillColor('#999999')
            .text(`KitZ (OS) · ${new Date().toLocaleDateString('es-PA', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'right' })
            .moveDown(0.5);

          // Title
          doc.fontSize(22).fillColor('#A855F7').text(title)
            .moveDown(0.3);
          doc.strokeColor('#A855F7').lineWidth(2)
            .moveTo(50, doc.y).lineTo(562, doc.y).stroke()
            .moveDown(0.5);

          // Content body
          if (args.content) {
            doc.fontSize(11).fillColor('#333333').text(String(args.content), { lineGap: 4 });
            doc.moveDown(0.5);
          }

          // Sections
          if (args.sections) {
            try {
              const sections = JSON.parse(String(args.sections)) as Array<{ heading: string; body: string }>;
              for (const section of sections) {
                doc.fontSize(14).fillColor('#7C3AED').text(section.heading || '').moveDown(0.2);
                doc.fontSize(11).fillColor('#333333').text(section.body || '', { lineGap: 3 }).moveDown(0.5);
              }
            } catch { /* invalid sections JSON, skip */ }
          }

          // Table
          if (args.table) {
            try {
              const table = JSON.parse(String(args.table)) as { headers: string[]; rows: Array<Array<string | number>> };
              const headers = table.headers || [];
              const rows = table.rows || [];
              const colWidth = (512 / Math.max(headers.length, 1));
              const startX = 50;

              // Header row
              doc.moveDown(0.5);
              let y = doc.y;
              doc.rect(startX, y, 512, 20).fill('#A855F7');
              doc.fontSize(10).fillColor('#FFFFFF');
              headers.forEach((h, i) => {
                doc.text(String(h), startX + i * colWidth + 4, y + 4, { width: colWidth - 8, align: 'left' });
              });
              y += 20;

              // Data rows
              doc.fillColor('#333333');
              for (const row of rows) {
                const bgColor = rows.indexOf(row) % 2 === 0 ? '#F9F9F9' : '#FFFFFF';
                doc.rect(startX, y, 512, 18).fill(bgColor);
                doc.fillColor('#333333');
                row.forEach((cell, i) => {
                  doc.text(String(cell), startX + i * colWidth + 4, y + 3, { width: colWidth - 8, align: 'left' });
                });
                y += 18;
              }
              doc.y = y + 10;
            } catch { /* invalid table JSON, skip */ }
          }

          // Footer
          doc.moveDown(2);
          const footer = String(args.footer || 'Generated by KitZ (OS)');
          doc.fontSize(9).fillColor('#AAAAAA')
            .text(footer, 50, doc.page.height - 50, { align: 'center', width: 512 });

          doc.end();
          await pdfDone;

          // Write to file
          const pdfBuffer = Buffer.concat(chunks);
          await writeFile(pdfPath, pdfBuffer);
          const pdfBase64 = pdfBuffer.toString('base64');

          log.info('pdf_binary_generated', { filename: pdfFilename, sizeKB: (pdfBuffer.length / 1024).toFixed(1), trace_id: traceId });

          return {
            success: true,
            filePath: pdfPath,
            filename: pdfFilename,
            sizeKB: Number((pdfBuffer.length / 1024).toFixed(1)),
            pdfBase64: pdfBase64.slice(0, 100) + '... (truncated, full file at filePath)',
            title,
            source: 'pdfkit',
          };
        } catch (err) {
          return { error: `PDF generation failed: ${(err as Error).message}` };
        }
      },
    },
  ];
}

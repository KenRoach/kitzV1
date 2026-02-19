import type { RawFinding } from './types.js';

const OFFICIAL_PANAMA_SOURCES = {
  DGI: 'https://dgi.mef.gob.pa/',
  'Panama Emprende': 'https://www.panamaemprende.gob.pa/',
  MITRADEL: 'https://www.mitradel.gob.pa/',
  CSS: 'https://w3.css.gob.pa/'
} as const;

const extractDate = (text: string): string | null => {
  const match = text.match(/(20\d{2}-\d{2}-\d{2})/);
  return match ? match[1] : null;
};

const fetchSnippet = async (url: string): Promise<{ title: string; text: string; date: string | null }> => {
  try {
    const response = await fetch(url, { headers: { 'user-agent': 'kitz-compliance-agent/1.0' } });
    const html = await response.text();
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const normalizedText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return {
      title: titleMatch?.[1]?.trim() || url,
      text: normalizedText.slice(0, 4000),
      date: extractDate(normalizedText)
    };
  } catch {
    return { title: url, text: 'Unable to fetch source during this run.', date: null };
  }
};

export const collectDgi = async (): Promise<RawFinding[]> => {
  const snippet = await fetchSnippet(OFFICIAL_PANAMA_SOURCES.DGI);
  return [{ regulatory_body: 'DGI', update_type: 'tax', title: snippet.title, url: OFFICIAL_PANAMA_SOURCES.DGI, date: snippet.date, text: snippet.text }];
};

export const collectPanamaEmprende = async (): Promise<RawFinding[]> => {
  const snippet = await fetchSnippet(OFFICIAL_PANAMA_SOURCES['Panama Emprende']);
  return [{ regulatory_body: 'Panama Emprende', update_type: 'corporate', title: snippet.title, url: OFFICIAL_PANAMA_SOURCES['Panama Emprende'], date: snippet.date, text: snippet.text }];
};

export const collectMitradel = async (): Promise<RawFinding[]> => {
  const snippet = await fetchSnippet(OFFICIAL_PANAMA_SOURCES.MITRADEL);
  return [{ regulatory_body: 'MITRADEL', update_type: 'labor', title: snippet.title, url: OFFICIAL_PANAMA_SOURCES.MITRADEL, date: snippet.date, text: snippet.text }];
};

export const collectCss = async (): Promise<RawFinding[]> => {
  const snippet = await fetchSnippet(OFFICIAL_PANAMA_SOURCES.CSS);
  return [{ regulatory_body: 'CSS', update_type: 'labor', title: snippet.title, url: OFFICIAL_PANAMA_SOURCES.CSS, date: snippet.date, text: snippet.text }];
};

export const collectPanamaFindings = async (): Promise<RawFinding[]> => {
  const results = await Promise.all([collectDgi(), collectPanamaEmprende(), collectMitradel(), collectCss()]);
  return results.flat();
};

/**
 * Web Browsing Tools — Intelligent URL understanding for KITZ OS.
 *
 * Tools:
 *   1. browse_url          — Auto-detect URL type and route to best strategy
 *   2. browse_read_page    — Fetch any URL, return clean markdown content
 *   3. browse_github_repo  — GitHub API: repo metadata and stats
 *   4. browse_github_tree  — GitHub API: directory listing at a path
 *   5. browse_github_file  — GitHub API: read a file's content
 *   6. browse_github_readme — GitHub API: fetch repo README
 *
 * Zero new dependencies — uses native fetch + cheerio (already installed).
 */

import * as cheerio from 'cheerio';
import type { ToolSchema } from './registry.js';
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('webBrowsing');

const FETCH_TIMEOUT_MS = 15_000;
const GITHUB_API = 'https://api.github.com';
const MAX_CONTENT_CHARS = 8000;
const MAX_FILE_BYTES = 50_000;
const USER_AGENT = 'KitzBot/1.0 (+https://kitz.services)';

// ── Helpers ──────────────────────────────────────────────

function getGitHubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': USER_AGENT,
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }
  return headers;
}

/** Block SSRF — reject private IPs, localhost, cloud metadata endpoints. */
function validateUrl(rawUrl: string): { safe: boolean; error?: string } {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, error: `Blocked scheme: ${parsed.protocol}` };
    }
    const host = parsed.hostname.toLowerCase();
    const blocked = [
      'localhost', '0.0.0.0', '[::1]',
      '169.254.169.254',
      'metadata.google.internal',
    ];
    if (blocked.includes(host)) {
      return { safe: false, error: `Blocked host: ${host}` };
    }
    const ipMatch = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (ipMatch) {
      const [, a, b] = ipMatch.map(Number);
      if (a === 127 || a === 10 ||
          (a === 172 && b >= 16 && b <= 31) ||
          (a === 192 && b === 168) ||
          (a === 169 && b === 254)) {
        return { safe: false, error: `Blocked private IP: ${host}` };
      }
    }
    return { safe: true };
  } catch {
    return { safe: false, error: 'Invalid URL' };
  }
}

function normalizeUrl(raw: string): string {
  let url = raw.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  return url;
}

/** Parse a GitHub URL into its components. */
function parseGitHubUrl(url: string): {
  type: 'repo' | 'tree' | 'blob' | 'unknown';
  owner: string;
  repo: string;
  /** Raw segments after tree/blob — needs branch resolution */
  refAndPath?: string[];
} | null {
  try {
    const parsed = new URL(normalizeUrl(url));
    if (!parsed.hostname.includes('github.com')) return null;

    const parts = parsed.pathname.replace(/^\//, '').replace(/\/$/, '').split('/');
    if (parts.length < 2) return null;

    const owner = parts[0];
    const repo = parts[1];

    if (parts.length === 2) {
      return { type: 'repo', owner, repo };
    }

    if (parts[2] === 'tree' && parts.length >= 4) {
      return { type: 'tree', owner, repo, refAndPath: parts.slice(3) };
    }

    if (parts[2] === 'blob' && parts.length >= 4) {
      return { type: 'blob', owner, repo, refAndPath: parts.slice(3) };
    }

    return { type: 'unknown', owner, repo };
  } catch {
    return null;
  }
}

/**
 * Resolve branch name from URL segments. Branch names can contain slashes
 * (e.g. "claude/setup-renewflo-repo-LyECH"), so we try progressively longer
 * candidate branch names against the GitHub API until one resolves.
 */
async function resolveBranchAndPath(
  owner: string,
  repo: string,
  segments: string[],
): Promise<{ branch: string; path: string }> {
  // Try from longest possible branch name down to single segment
  for (let i = segments.length; i >= 1; i--) {
    const candidateBranch = segments.slice(0, i).join('/');
    const candidatePath = segments.slice(i).join('/');
    try {
      await githubFetch(`/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(candidateBranch)}`);
      return { branch: candidateBranch, path: candidatePath };
    } catch {
      // Branch doesn't exist at this length, try shorter
    }
  }
  // Fallback: assume first segment is branch
  return { branch: segments[0], path: segments.slice(1).join('/') };
}

/** Fetch a GitHub API endpoint. */
async function githubFetch<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${GITHUB_API}${endpoint}`, {
    headers: getGitHubHeaders(),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (res.status === 404) {
    throw new Error('Not found — check the URL or repo name.');
  }
  if (res.status === 403) {
    const remaining = res.headers.get('x-ratelimit-remaining');
    if (remaining === '0') {
      throw new Error('GitHub API rate limit hit. Add GITHUB_TOKEN to .env for 5000 req/hr.');
    }
    throw new Error('Access denied. Private repo? Add GITHUB_TOKEN to .env.');
  }
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

/** Fetch a page and convert HTML to clean markdown-ish text. */
async function fetchAsMarkdown(url: string): Promise<{ title: string; content: string; url: string }> {
  const normalized = normalizeUrl(url);
  const check = validateUrl(normalized);
  if (!check.safe) throw new Error(`URL blocked: ${check.error}`);

  const res = await fetch(normalized, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; KitzBot/1.0; +https://kitz.services)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

  const html = await res.text();
  const $ = cheerio.load(html);

  // Remove noise
  $('script, style, nav, footer, header, iframe, noscript, svg, [role="navigation"], .nav, .footer, .header, .sidebar, .menu, .cookie-banner, .ad, .advertisement, .popup, .modal').remove();

  const title = $('title').text().trim() || $('h1').first().text().trim() || '';

  // Find main content container
  let $main = $('article, main, [role="main"], .content, .post, .article').first();
  if (!$main.length || $main.text().trim().length < 100) {
    $main = $('body');
  }

  // Convert to markdown-style text
  const lines: string[] = [];

  $main.find('h1, h2, h3, h4, h5, h6, p, li, pre, code, blockquote, td, th').each((_, el) => {
    const $el = $(el);
    const tag = el.type === 'tag' ? el.name : '';
    const text = $el.text().trim();
    if (!text) return;

    if (tag.startsWith('h')) {
      const level = parseInt(tag[1], 10);
      lines.push('');
      lines.push(`${'#'.repeat(level)} ${text}`);
    } else if (tag === 'li') {
      lines.push(`- ${text}`);
    } else if (tag === 'pre' || tag === 'code') {
      if (text.length > 10) {
        lines.push('```');
        lines.push(text.slice(0, 2000));
        lines.push('```');
      }
    } else if (tag === 'blockquote') {
      lines.push(`> ${text}`);
    } else {
      lines.push(text);
    }
  });

  let content = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  if (content.length > MAX_CONTENT_CHARS) {
    content = content.slice(0, MAX_CONTENT_CHARS) + '\n\n[... content truncated]';
  }

  return { title, content, url: res.url };
}

// ── GitHub Data Types ────────────────────────────────────

interface GitHubRepo {
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  default_branch: string;
  updated_at: string;
  topics: string[];
  open_issues_count: number;
  license: { name: string } | null;
  private: boolean;
  size: number;
}

interface GitHubContentItem {
  name: string;
  path: string;
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  size: number;
  html_url: string;
  download_url: string | null;
}

interface GitHubFileContent {
  name: string;
  path: string;
  size: number;
  content: string;
  encoding: string;
  html_url: string;
}

// ── Tools ────────────────────────────────────────────────

export function getAllWebBrowsingTools(): ToolSchema[] {
  return [
    // 1. BROWSE URL — auto-detect and route
    {
      name: 'browse_url',
      description:
        'Intelligently browse any URL. Auto-detects the URL type (GitHub repo, GitHub file, article, docs page) ' +
        'and returns the best-formatted content. The "one tool for any URL" entry point.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Any URL to browse (GitHub, article, docs, etc.)' },
        },
        required: ['url'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const url = args.url as string;
        try {
          const gh = parseGitHubUrl(url);
          if (gh) {
            log.info('browse_url: detected GitHub URL', { type: gh.type, owner: gh.owner, repo: gh.repo });

            if ((gh.type === 'blob' || gh.type === 'tree') && gh.refAndPath) {
              // Resolve branch name (may contain slashes)
              const { branch, path } = await resolveBranchAndPath(gh.owner, gh.repo, gh.refAndPath);

              if (gh.type === 'blob') {
                // File view
                const file = await githubFetch<GitHubFileContent>(
                  `/repos/${gh.owner}/${gh.repo}/contents/${path}?ref=${encodeURIComponent(branch)}`
                );
                let content = '';
                if (file.encoding === 'base64' && file.content) {
                  content = Buffer.from(file.content, 'base64').toString('utf-8');
                  if (content.length > MAX_FILE_BYTES) {
                    content = content.slice(0, MAX_FILE_BYTES) + '\n\n[... file truncated at 50KB]';
                  }
                }
                return {
                  type: 'github_file',
                  name: file.name,
                  path: file.path,
                  size: file.size,
                  url: file.html_url,
                  branch,
                  content,
                };
              }

              // Tree — directory listing
              const items = await githubFetch<GitHubContentItem[]>(
                `/repos/${gh.owner}/${gh.repo}/contents/${path}?ref=${encodeURIComponent(branch)}`
              );
              const dirs = items.filter(i => i.type === 'dir').sort((a, b) => a.name.localeCompare(b.name));
              const files = items.filter(i => i.type !== 'dir').sort((a, b) => a.name.localeCompare(b.name));
              const sorted = [...dirs, ...files];

              return {
                type: 'github_tree',
                repo: `${gh.owner}/${gh.repo}`,
                branch,
                path: path || '/',
                items: sorted.map(i => ({
                  name: i.type === 'dir' ? `${i.name}/` : i.name,
                  type: i.type,
                  size: i.type === 'file' ? i.size : undefined,
                })),
                count: sorted.length,
              };
            }

            // Repo overview — fetch repo info + README
            const [repo, readme] = await Promise.allSettled([
              githubFetch<GitHubRepo>(`/repos/${gh.owner}/${gh.repo}`),
              githubFetch<GitHubFileContent>(`/repos/${gh.owner}/${gh.repo}/readme`),
            ]);

            const repoData = repo.status === 'fulfilled' ? repo.value : null;
            let readmeContent = '';
            if (readme.status === 'fulfilled' && readme.value.content) {
              readmeContent = Buffer.from(readme.value.content, 'base64').toString('utf-8');
              if (readmeContent.length > MAX_CONTENT_CHARS) {
                readmeContent = readmeContent.slice(0, MAX_CONTENT_CHARS) + '\n\n[... README truncated]';
              }
            }

            return {
              type: 'github_repo',
              ...(repoData ? {
                name: repoData.full_name,
                description: repoData.description,
                url: repoData.html_url,
                language: repoData.language,
                stars: repoData.stargazers_count,
                forks: repoData.forks_count,
                open_issues: repoData.open_issues_count,
                default_branch: repoData.default_branch,
                topics: repoData.topics,
                license: repoData.license?.name || null,
                last_updated: repoData.updated_at,
                size_kb: repoData.size,
              } : { error: 'Could not fetch repo info' }),
              readme: readmeContent || null,
            };
          }

          // Not GitHub — general page read
          log.info('browse_url: fetching page', { url });
          const page = await fetchAsMarkdown(url);
          return {
            type: 'web_page',
            title: page.title,
            url: page.url,
            content: page.content,
          };
        } catch (err) {
          return { error: `Failed to browse: ${(err as Error).message}` };
        }
      },
    },

    // 2. BROWSE READ PAGE — clean markdown extraction
    {
      name: 'browse_read_page',
      description:
        'Fetch any web page and return its content as clean, readable markdown. ' +
        'Strips ads, navigation, popups. Great for reading articles, docs, and blog posts.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to read' },
        },
        required: ['url'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        try {
          const page = await fetchAsMarkdown(args.url as string);
          return { title: page.title, url: page.url, content: page.content };
        } catch (err) {
          return { error: `Failed to read page: ${(err as Error).message}` };
        }
      },
    },

    // 3. BROWSE GITHUB REPO — repo metadata
    {
      name: 'browse_github_repo',
      description:
        'Get metadata about a GitHub repository: description, stars, language, topics, license, last updated.',
      parameters: {
        type: 'object',
        properties: {
          owner: { type: 'string', description: 'Repository owner (e.g. "KenRoach")' },
          repo: { type: 'string', description: 'Repository name (e.g. "kitzV1")' },
        },
        required: ['owner', 'repo'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        try {
          const data = await githubFetch<GitHubRepo>(`/repos/${args.owner}/${args.repo}`);
          return {
            name: data.full_name,
            description: data.description,
            url: data.html_url,
            language: data.language,
            stars: data.stargazers_count,
            forks: data.forks_count,
            open_issues: data.open_issues_count,
            default_branch: data.default_branch,
            topics: data.topics,
            license: data.license?.name || null,
            last_updated: data.updated_at,
            size_kb: data.size,
          };
        } catch (err) {
          return { error: `GitHub repo error: ${(err as Error).message}` };
        }
      },
    },

    // 4. BROWSE GITHUB TREE — directory listing
    {
      name: 'browse_github_tree',
      description:
        'List files and folders in a GitHub repository directory. Shows names, types, and sizes.',
      parameters: {
        type: 'object',
        properties: {
          owner: { type: 'string', description: 'Repository owner' },
          repo: { type: 'string', description: 'Repository name' },
          path: { type: 'string', description: 'Path within the repo (default: root "/")' },
          branch: { type: 'string', description: 'Branch name (default: repo default branch)' },
        },
        required: ['owner', 'repo'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        try {
          const p = (args.path as string) || '';
          const ref = args.branch ? `?ref=${args.branch}` : '';
          const items = await githubFetch<GitHubContentItem[]>(
            `/repos/${args.owner}/${args.repo}/contents/${p}${ref}`
          );
          const dirs = items.filter(i => i.type === 'dir').sort((a, b) => a.name.localeCompare(b.name));
          const files = items.filter(i => i.type !== 'dir').sort((a, b) => a.name.localeCompare(b.name));
          const sorted = [...dirs, ...files];

          return {
            repo: `${args.owner}/${args.repo}`,
            path: p || '/',
            items: sorted.map(i => ({
              name: i.type === 'dir' ? `${i.name}/` : i.name,
              type: i.type,
              size: i.type === 'file' ? i.size : undefined,
            })),
            count: sorted.length,
          };
        } catch (err) {
          return { error: `GitHub tree error: ${(err as Error).message}` };
        }
      },
    },

    // 5. BROWSE GITHUB FILE — read file content
    {
      name: 'browse_github_file',
      description:
        'Read the content of a specific file from a GitHub repository. Decodes from base64, truncates at 50KB.',
      parameters: {
        type: 'object',
        properties: {
          owner: { type: 'string', description: 'Repository owner' },
          repo: { type: 'string', description: 'Repository name' },
          path: { type: 'string', description: 'File path (e.g. "src/index.ts")' },
          branch: { type: 'string', description: 'Branch name (default: repo default branch)' },
        },
        required: ['owner', 'repo', 'path'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        try {
          const ref = args.branch ? `?ref=${args.branch}` : '';
          const file = await githubFetch<GitHubFileContent>(
            `/repos/${args.owner}/${args.repo}/contents/${args.path}${ref}`
          );

          let content = '';
          if (file.encoding === 'base64' && file.content) {
            content = Buffer.from(file.content, 'base64').toString('utf-8');
            if (content.length > MAX_FILE_BYTES) {
              content = content.slice(0, MAX_FILE_BYTES) + '\n\n[... file truncated at 50KB]';
            }
          }

          return {
            name: file.name,
            path: file.path,
            size: file.size,
            url: file.html_url,
            content,
          };
        } catch (err) {
          return { error: `GitHub file error: ${(err as Error).message}` };
        }
      },
    },

    // 6. BROWSE GITHUB README — fetch README
    {
      name: 'browse_github_readme',
      description:
        'Fetch the README file from a GitHub repository. Returns the raw markdown content.',
      parameters: {
        type: 'object',
        properties: {
          owner: { type: 'string', description: 'Repository owner' },
          repo: { type: 'string', description: 'Repository name' },
        },
        required: ['owner', 'repo'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        try {
          const file = await githubFetch<GitHubFileContent>(
            `/repos/${args.owner}/${args.repo}/readme`
          );
          let content = '';
          if (file.encoding === 'base64' && file.content) {
            content = Buffer.from(file.content, 'base64').toString('utf-8');
            if (content.length > MAX_CONTENT_CHARS) {
              content = content.slice(0, MAX_CONTENT_CHARS) + '\n\n[... README truncated]';
            }
          }
          return {
            name: file.name,
            path: file.path,
            url: file.html_url,
            content,
          };
        } catch (err) {
          return { error: `GitHub README error: ${(err as Error).message}` };
        }
      },
    },
  ];
}

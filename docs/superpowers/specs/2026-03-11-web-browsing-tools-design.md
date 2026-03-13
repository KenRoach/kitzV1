# Web Browsing Tools for KITZ OS

**Date:** 2026-03-11
**Status:** Approved

## Overview

New `webBrowsingTools.ts` module giving KITZ OS intelligent URL understanding: smart page reading, GitHub repo browsing, and URL auto-detection routing.

## Tools

| Tool | Risk | Purpose |
|------|------|---------|
| `browse_url` | low | Auto-detect URL type, route to best extraction strategy |
| `browse_read_page` | low | Fetch any URL, return clean markdown content |
| `browse_github_repo` | low | GitHub API: repo metadata, description, stats |
| `browse_github_tree` | low | GitHub API: directory listing at a path |
| `browse_github_file` | low | GitHub API: read file content (base64 decoded) |
| `browse_github_readme` | low | GitHub API: fetch repo README |

## URL Auto-Detection (`browse_url`)

- `github.com/<owner>/<repo>` -> `browse_github_repo` + `browse_github_readme`
- `github.com/<owner>/<repo>/tree/<branch>/<path>` -> `browse_github_tree`
- `github.com/<owner>/<repo>/blob/<branch>/<path>` -> `browse_github_file`
- Everything else -> `browse_read_page`

## Technical Details

- **HTTP:** Native `fetch()` with 15s timeout
- **HTML parsing:** cheerio (already installed)
- **SSRF protection:** Reuse `validateUrl()` pattern from webTools.ts
- **GitHub API:** REST v3, unauthenticated (60 req/hr), optional `GITHUB_TOKEN` for 5000 req/hr
- **Content limit:** 8000 chars max output for LLM context
- **File content limit:** 50KB decoded for GitHub files
- **Dependencies:** Zero new — fetch + cheerio + callLLM (all existing)

## Error Handling

- 404 -> "Page not found"
- 403 -> "Access denied. Private repo? Add GITHUB_TOKEN"
- 429 -> "Rate limit hit. Add GITHUB_TOKEN for 5000 req/hr"
- Timeout -> "Page took too long (15s)"
- Invalid URL -> "Invalid URL format"

## Registration

- Export `getAllWebBrowsingTools(): ToolSchema[]`
- Add import + getter to `registry.ts`
- Existing `webTools.ts` untouched

## Env Var

```
GITHUB_TOKEN=  # Optional. Public repos work without it.
```

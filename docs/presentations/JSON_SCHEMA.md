# Kitz Presentation System -- Extended JSON Schema & Remix System

**Date**: 2026-02-24
**Status**: Draft
**Module**: `kitz_os/src/tools/deckTools.ts`
**Dependencies**: `contentEngine.ts` (BrandKit, storeContent, getContent, generateContentId, injectBrandCSS)
**Schema version**: JSON Schema draft 2020-12

---

## Table of Contents

1. [Overview](#1-overview)
2. [Phase 4: Extended JSON Schema for Automation](#2-phase-4-extended-json-schema-for-automation)
   - 2.1 Enhanced SlideSpec
   - 2.2 Enhanced DeckData
   - 2.3 Full JSON Schema (draft 2020-12)
   - 2.4 API Contract
3. [Phase 6: Remix System](#3-phase-6-remix-system)
   - 3.1 Remix Operations
   - 3.2 Remix Schema
   - 3.3 Remix Rules per Format
   - 3.4 Integration with Existing Content Engine
4. [Migration & Backwards Compatibility](#4-migration--backwards-compatibility)
5. [Implementation Checklist](#5-implementation-checklist)

---

## 1. Overview

The Kitz presentation system currently supports three deck templates (`investor-pitch`, `sales-proposal`, `business-overview`) with six slide types (`title`, `content`, `stats`, `comparison`, `quote`, `cta`). Decks are generated from briefs via `claudeChat()` using Claude Sonnet, rendered to HTML, and stored through the shared `contentEngine.ts` pipeline.

This document extends the existing schema in two phases:

- **Phase 4** adds speaker notes, timing metadata, transitions, layout control, media placeholders, emphasis levels, and deck-level metadata (audience, tone, rubric scoring). The schema is fully backwards-compatible: every existing `SlideSpec` and `DeckData` object remains valid under the extended schema.

- **Phase 6** adds a remix system that transforms a deck into derivative formats (executive summary, one-pager, email pitch, social posts, speaker script, handout). Remixed content flows through the existing `storeContent()` pipeline and follows the same `draft -> approved -> shipped` lifecycle.

---

## 2. Phase 4: Extended JSON Schema for Automation

### 2.1 Enhanced SlideSpec

The enhanced `SlideSpec` adds six new optional fields to the existing interface. No existing field changes type or becomes required.

```typescript
interface SlideSpec {
  // --- Existing fields (unchanged) ---
  title: string;
  type: 'title' | 'content' | 'stats' | 'comparison' | 'quote' | 'cta';
  bullets?: string[];
  stats?: Array<{ label: string; value: string }>;
  leftColumn?: string[];
  rightColumn?: string[];
  quoteText?: string;
  attribution?: string;
  ctaText?: string;

  // --- Phase 4 extensions (all optional) ---

  /** Presenter notes displayed in speaker view, never rendered on the slide itself. */
  speaker_notes?: string;

  /** Suggested time to spend on this slide, in seconds. Used for pacing guidance and
      totalDuration calculation. Default: 60 for content slides, 30 for title/cta. */
  duration_seconds?: number;

  /** Visual transition when advancing to this slide.
      'none' means an instant cut. Default: 'fade'. */
  transition?: 'fade' | 'slide' | 'none';

  /** Content layout strategy.
      - 'centered': all content centered horizontally and vertically (title, cta, quote)
      - 'left-aligned': standard left-aligned flow (content, stats)
      - 'split': two-column layout (comparison, or content with media)
      - 'grid': multi-cell grid (stats with 4+ items)
      Default is inferred from slide type if omitted. */
  layout?: 'centered' | 'left-aligned' | 'split' | 'grid';

  /** Optional media attachment. At generation time, the AI populates `placeholder`
      with a description; the actual `url` is filled later by the user or an asset pipeline. */
  media?: {
    type: 'image' | 'chart' | 'video';
    /** Resolved asset URL. Null/undefined until the user or asset pipeline provides one. */
    url?: string;
    /** Accessible alt text describing the media content. Always required. */
    alt: string;
    /** Human-readable description of what media should go here. Used by AI and
        by the UI to show a placeholder card. Example: "Bar chart showing Q3 revenue by region". */
    placeholder: string;
  };

  /** Visual weight hint for the renderer.
      - 'high': larger fonts, bolder colors, full-bleed background
      - 'medium': standard presentation weight
      - 'low': subdued, supporting slide (appendix, backup data)
      Default: 'medium'. */
  emphasis?: 'high' | 'medium' | 'low';
}
```

**Default inference rules for `layout`** (applied at render time when `layout` is omitted):

| Slide type   | Inferred layout  |
|-------------|-----------------|
| `title`     | `centered`      |
| `content`   | `left-aligned`  |
| `stats`     | `grid`          |
| `comparison`| `split`         |
| `quote`     | `centered`      |
| `cta`       | `centered`      |

### 2.2 Enhanced DeckData

The enhanced `DeckData` adds metadata fields for audience targeting, tone control, authorship, versioning, and automated quality scoring.

```typescript
interface RubricScore {
  /** Overall quality score, 0-100. */
  overall: number;
  /** Does the narrative flow logically from slide to slide? 0-100. */
  narrative_flow: number;
  /** Is the content density appropriate (not too sparse, not overloaded)? 0-100. */
  content_density: number;
  /** Is the visual hierarchy clear (titles, subtitles, body text)? 0-100. */
  visual_hierarchy: number;
  /** Are brand kit colors, fonts, and tone applied consistently? 0-100. */
  brand_consistency: number;
  /** Is the call-to-action clear and compelling? 0-100. */
  cta_strength: number;
  /** Free-text improvement suggestions from the AI evaluator. */
  suggestions: string[];
}

interface DeckData {
  // --- Existing fields (unchanged) ---
  deckId: string;
  template: string;
  slideCount: number;
  slides: SlideSpec[];        // now uses enhanced SlideSpec
  brief: string;
  createdAt: string;

  // --- Phase 4 extensions ---

  /** Human-readable deck title. Derived from the brief by the AI or provided explicitly. */
  title: string;

  /** Optional subtitle or tagline for the deck. */
  subtitle?: string;

  /** Author name or identifier. Defaults to BrandKit.businessName if omitted. */
  author: string;

  /** Target audience segment. Drives tone, vocabulary, and content depth decisions
      in the AI generation prompt. */
  audience: 'investors' | 'clients' | 'team' | 'students' | 'general';

  /** Desired presentation tone. Works in concert with BrandKit.tone but can
      override for this specific deck. */
  tone: 'formal' | 'conversational' | 'energetic' | 'authoritative';

  /** ISO 639-1 language code (e.g., 'es', 'en', 'pt'). Defaults to BrandKit.language. */
  language: string;

  /** Estimated total presentation duration in minutes. Calculated as
      sum(slides[].duration_seconds) / 60, rounded up. */
  totalDuration: number;

  /** Schema version number. Starts at 1 for Phase 4 decks. Existing decks
      without this field are implicitly version 0. */
  version: number;

  /** Freeform tags for categorization and search. Examples: ['Q3', 'fundraising', 'series-a']. */
  tags: string[];

  /** Auto-evaluated quality rubric. Populated after generation by a second AI pass.
      Omitted if evaluation was skipped or failed. */
  rubricScore?: RubricScore;
}
```

### 2.3 Full JSON Schema (draft 2020-12)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://kitz.app/schemas/deck/v1",
  "title": "Kitz Deck Schema",
  "description": "JSON Schema for the Kitz presentation system. Defines the enhanced SlideSpec and DeckData structures used by the deck_create and deck_export tools.",
  "type": "object",

  "$defs": {

    "MediaSpec": {
      "type": "object",
      "description": "Media attachment for a slide. The placeholder is always set by AI; url is filled later.",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["image", "chart", "video"],
          "description": "The kind of media asset."
        },
        "url": {
          "type": "string",
          "format": "uri",
          "description": "Resolved asset URL. Null until provided by the user or asset pipeline."
        },
        "alt": {
          "type": "string",
          "minLength": 1,
          "description": "Accessible alt text describing the media content."
        },
        "placeholder": {
          "type": "string",
          "minLength": 1,
          "description": "Human-readable description of what media should appear here."
        }
      },
      "required": ["type", "alt", "placeholder"],
      "additionalProperties": false
    },

    "StatItem": {
      "type": "object",
      "description": "A single statistic displayed on a stats slide.",
      "properties": {
        "label": {
          "type": "string",
          "minLength": 1,
          "description": "Metric label (e.g., 'TAM', 'MRR', 'Users')."
        },
        "value": {
          "type": "string",
          "minLength": 1,
          "description": "Metric value as a formatted string (e.g., '$1.2M', '15%')."
        }
      },
      "required": ["label", "value"],
      "additionalProperties": false
    },

    "SlideSpec": {
      "type": "object",
      "description": "Specification for a single slide in the deck.",
      "properties": {
        "title": {
          "type": "string",
          "minLength": 1,
          "description": "Slide heading. Displayed prominently on every slide type."
        },
        "type": {
          "type": "string",
          "enum": ["title", "content", "stats", "comparison", "quote", "cta"],
          "description": "Slide layout type. Determines which optional fields are relevant and how the slide is rendered."
        },
        "bullets": {
          "type": "array",
          "items": { "type": "string", "minLength": 1 },
          "minItems": 1,
          "description": "Bullet points for 'content' slides. Each string is one bullet."
        },
        "stats": {
          "type": "array",
          "items": { "$ref": "#/$defs/StatItem" },
          "minItems": 1,
          "description": "Key metrics for 'stats' slides."
        },
        "leftColumn": {
          "type": "array",
          "items": { "type": "string", "minLength": 1 },
          "minItems": 1,
          "description": "Left column items for 'comparison' slides (typically features)."
        },
        "rightColumn": {
          "type": "array",
          "items": { "type": "string", "minLength": 1 },
          "minItems": 1,
          "description": "Right column items for 'comparison' slides (typically benefits)."
        },
        "quoteText": {
          "type": "string",
          "minLength": 1,
          "description": "The quote body for 'quote' slides."
        },
        "attribution": {
          "type": "string",
          "description": "Attribution line for 'quote' slides (e.g., 'Jane Doe, CEO')."
        },
        "ctaText": {
          "type": "string",
          "description": "Call-to-action button/label text for 'cta' slides."
        },
        "speaker_notes": {
          "type": "string",
          "description": "Presenter-only notes. Never rendered on the slide itself. Supports markdown."
        },
        "duration_seconds": {
          "type": "integer",
          "minimum": 5,
          "maximum": 600,
          "description": "Suggested time on this slide in seconds. Range: 5-600. Default: 60 (content), 30 (title/cta)."
        },
        "transition": {
          "type": "string",
          "enum": ["fade", "slide", "none"],
          "default": "fade",
          "description": "Visual transition when advancing to this slide."
        },
        "layout": {
          "type": "string",
          "enum": ["centered", "left-aligned", "split", "grid"],
          "description": "Content layout strategy. Inferred from slide type if omitted."
        },
        "media": {
          "$ref": "#/$defs/MediaSpec"
        },
        "emphasis": {
          "type": "string",
          "enum": ["high", "medium", "low"],
          "default": "medium",
          "description": "Visual weight hint. 'high' = bold/full-bleed, 'low' = subdued/appendix."
        }
      },
      "required": ["title", "type"],
      "additionalProperties": false,

      "allOf": [
        {
          "if": { "properties": { "type": { "const": "content" } } },
          "then": { "required": ["title", "type", "bullets"] }
        },
        {
          "if": { "properties": { "type": { "const": "stats" } } },
          "then": { "required": ["title", "type", "stats"] }
        },
        {
          "if": { "properties": { "type": { "const": "comparison" } } },
          "then": { "required": ["title", "type", "leftColumn", "rightColumn"] }
        },
        {
          "if": { "properties": { "type": { "const": "quote" } } },
          "then": { "required": ["title", "type", "quoteText"] }
        },
        {
          "if": { "properties": { "type": { "const": "cta" } } },
          "then": { "required": ["title", "type", "ctaText"] }
        }
      ],

      "examples": [
        {
          "title": "Revenue Growth Q3",
          "type": "stats",
          "stats": [
            { "label": "MRR", "value": "$48K" },
            { "label": "Growth", "value": "23%" },
            { "label": "Churn", "value": "1.2%" }
          ],
          "speaker_notes": "Emphasize the churn improvement -- down from 3.1% last quarter.",
          "duration_seconds": 90,
          "transition": "fade",
          "layout": "grid",
          "emphasis": "high"
        },
        {
          "title": "Our Solution",
          "type": "content",
          "bullets": [
            "AI-powered inventory management",
            "WhatsApp-native ordering",
            "Real-time analytics dashboard"
          ],
          "speaker_notes": "Demo the WhatsApp ordering flow here if time permits.",
          "duration_seconds": 120,
          "transition": "slide",
          "layout": "left-aligned",
          "media": {
            "type": "image",
            "alt": "Screenshot of the WhatsApp ordering interface",
            "placeholder": "Product screenshot showing a customer placing an order via WhatsApp chat"
          },
          "emphasis": "medium"
        }
      ]
    },

    "RubricScore": {
      "type": "object",
      "description": "Auto-evaluated quality rubric produced by a second AI pass after deck generation.",
      "properties": {
        "overall": {
          "type": "integer",
          "minimum": 0,
          "maximum": 100,
          "description": "Aggregate quality score."
        },
        "narrative_flow": {
          "type": "integer",
          "minimum": 0,
          "maximum": 100,
          "description": "Does the story progress logically from slide to slide?"
        },
        "content_density": {
          "type": "integer",
          "minimum": 0,
          "maximum": 100,
          "description": "Is each slide appropriately dense (not too sparse, not overloaded)?"
        },
        "visual_hierarchy": {
          "type": "integer",
          "minimum": 0,
          "maximum": 100,
          "description": "Are headings, subheadings, and body text clearly differentiated?"
        },
        "brand_consistency": {
          "type": "integer",
          "minimum": 0,
          "maximum": 100,
          "description": "Are brand colors, fonts, and tone applied consistently?"
        },
        "cta_strength": {
          "type": "integer",
          "minimum": 0,
          "maximum": 100,
          "description": "Is the call-to-action clear and compelling?"
        },
        "suggestions": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Free-text improvement suggestions from the evaluator."
        }
      },
      "required": ["overall", "narrative_flow", "content_density", "visual_hierarchy", "brand_consistency", "cta_strength", "suggestions"],
      "additionalProperties": false
    },

    "DeckData": {
      "type": "object",
      "description": "Complete deck payload. Returned by deck_create, stored via storeContent(), and used by deck_export and remix tools.",
      "properties": {
        "deckId": {
          "type": "string",
          "pattern": "^cnt-[a-z0-9]+-[a-z0-9]+$",
          "description": "Unique content ID generated by generateContentId(). Format: cnt-{timestamp36}-{random}."
        },
        "template": {
          "type": "string",
          "enum": ["investor-pitch", "sales-proposal", "business-overview"],
          "description": "Template key used to seed the slide structure."
        },
        "slideCount": {
          "type": "integer",
          "minimum": 1,
          "maximum": 50,
          "description": "Number of slides in the deck."
        },
        "slides": {
          "type": "array",
          "items": { "$ref": "#/$defs/SlideSpec" },
          "minItems": 1,
          "maxItems": 50,
          "description": "Ordered array of slide specifications."
        },
        "brief": {
          "type": "string",
          "minLength": 10,
          "description": "The original user brief that drove deck generation."
        },
        "createdAt": {
          "type": "string",
          "format": "date-time",
          "description": "ISO 8601 creation timestamp."
        },
        "title": {
          "type": "string",
          "minLength": 1,
          "maxLength": 200,
          "description": "Human-readable deck title."
        },
        "subtitle": {
          "type": "string",
          "maxLength": 300,
          "description": "Optional subtitle or tagline."
        },
        "author": {
          "type": "string",
          "minLength": 1,
          "description": "Author name. Defaults to BrandKit.businessName."
        },
        "audience": {
          "type": "string",
          "enum": ["investors", "clients", "team", "students", "general"],
          "description": "Target audience. Influences AI content generation tone and depth."
        },
        "tone": {
          "type": "string",
          "enum": ["formal", "conversational", "energetic", "authoritative"],
          "description": "Desired presentation tone. Can differ from BrandKit.tone for this specific deck."
        },
        "language": {
          "type": "string",
          "pattern": "^[a-z]{2}(-[A-Z]{2})?$",
          "description": "ISO 639-1 language code, optionally with region (e.g., 'es', 'en', 'pt-BR')."
        },
        "totalDuration": {
          "type": "number",
          "minimum": 0.5,
          "description": "Estimated total presentation duration in minutes. Computed from slide durations."
        },
        "version": {
          "type": "integer",
          "minimum": 0,
          "description": "Schema version. 0 = legacy (pre-Phase 4), 1 = Phase 4 extended schema."
        },
        "tags": {
          "type": "array",
          "items": { "type": "string", "minLength": 1, "maxLength": 50 },
          "uniqueItems": true,
          "description": "Freeform tags for categorization and search."
        },
        "rubricScore": {
          "$ref": "#/$defs/RubricScore"
        }
      },
      "required": [
        "deckId",
        "template",
        "slideCount",
        "slides",
        "brief",
        "createdAt",
        "title",
        "author",
        "audience",
        "tone",
        "language",
        "totalDuration",
        "version",
        "tags"
      ],
      "additionalProperties": false
    }
  },

  "$ref": "#/$defs/DeckData"
}
```

### 2.4 API Contract

#### Extended `deck_create` Tool

**Current signature** (from `deckTools.ts`):

```
deck_create(brief, template?, slide_count?, org_id?)
```

**Extended signature**:

```typescript
// Input parameters
interface DeckCreateInput {
  // --- Existing ---
  brief: string;                    // Required. Description of deck purpose and content.
  template?: string;                // 'investor-pitch' | 'sales-proposal' | 'business-overview'. Default: 'business-overview'.
  slide_count?: number;             // Override for number of slides.
  org_id?: string;                  // Organization ID for brand kit lookup. Default: 'default'.

  // --- Phase 4 additions ---
  audience?: 'investors' | 'clients' | 'team' | 'students' | 'general';  // Default: 'general'.
  tone?: 'formal' | 'conversational' | 'energetic' | 'authoritative';    // Default: 'formal'.
  language?: string;                // ISO 639-1 code. Default: BrandKit.language.
  tags?: string[];                  // Freeform tags. Default: [].
  include_speaker_notes?: boolean;  // Generate speaker notes per slide. Default: true.
  include_rubric?: boolean;         // Run quality evaluation after generation. Default: true.
  title?: string;                   // Explicit title. If omitted, AI derives one from the brief.
  subtitle?: string;                // Optional subtitle.
}

// Output payload
interface DeckCreateOutput {
  contentId: string;
  html: string;
  slideCount: number;
  template: string;
  deckData: DeckData;               // Full enhanced DeckData object.
  rubricScore?: RubricScore;        // Also surfaced at top level for convenience.
}
```

**Tool schema definition** (for the OsToolRegistry):

```typescript
const deck_create: ToolSchema = {
  name: 'deck_create',
  description:
    'Generate a branded slide deck from a brief. Claude Sonnet fills slide content based ' +
    'on the brief, audience, and tone. Returns HTML document with branded slides and an ' +
    'optional quality rubric score.',
  parameters: {
    type: 'object',
    properties: {
      brief:                 { type: 'string', description: 'Description of the deck purpose and content' },
      template:              { type: 'string', enum: ['investor-pitch', 'sales-proposal', 'business-overview'], description: 'Deck template (default: business-overview)' },
      slide_count:           { type: 'number', description: 'Optional override for number of slides' },
      org_id:                { type: 'string', description: 'Organization ID' },
      audience:              { type: 'string', enum: ['investors', 'clients', 'team', 'students', 'general'], description: 'Target audience (default: general)' },
      tone:                  { type: 'string', enum: ['formal', 'conversational', 'energetic', 'authoritative'], description: 'Presentation tone (default: formal)' },
      language:              { type: 'string', description: 'ISO 639-1 language code (default: from brand kit)' },
      tags:                  { type: 'array', items: { type: 'string' }, description: 'Freeform tags' },
      include_speaker_notes: { type: 'boolean', description: 'Generate speaker notes per slide (default: true)' },
      include_rubric:        { type: 'boolean', description: 'Run quality rubric evaluation (default: true)' },
      title:                 { type: 'string', description: 'Explicit deck title (AI derives one if omitted)' },
      subtitle:              { type: 'string', description: 'Optional subtitle' },
    },
    required: ['brief'],
  },
  riskLevel: 'high',
  execute: async (params: Record<string, unknown>) => { /* implementation */ },
};
```

**Execution flow**:

```
1. Parse and validate input parameters.
2. Load brand kit via getBrandKit(orgId).
3. Look up template slides from DECK_TEMPLATES[templateKey].
4. Build AI prompt incorporating: brief, template structure, audience, tone, language,
   include_speaker_notes flag.
5. Call claudeChat() with the enhanced prompt (model: 'sonnet').
6. Parse AI response as JSON array of enhanced SlideSpec objects.
7. Apply slide_count override (truncate or extend).
8. Compute totalDuration from slide duration_seconds values.
9. Derive title from AI response or explicit parameter.
10. Render slides to HTML via renderSlide() (extended to handle new fields).
11. If include_rubric is true:
    a. Build rubric evaluation prompt with the complete DeckData.
    b. Call claudeChat() (model: 'haiku' for speed).
    c. Parse RubricScore from response.
12. Assemble DeckData object with all fields.
13. Store via storeContent({ contentId, type: 'deck', html, data: deckData, status: 'draft', ... }).
14. Return DeckCreateOutput.
```

**Validation rules**:

| Field | Rule | Error |
|-------|------|-------|
| `brief` | Required, min 10 chars | `"brief must be at least 10 characters"` |
| `template` | Must be a key in `DECK_TEMPLATES` | `"Unknown template: {value}. Options: investor-pitch, sales-proposal, business-overview"` |
| `slide_count` | If provided, must be integer 1-50 | `"slide_count must be between 1 and 50"` |
| `audience` | Must be one of the enum values | `"Invalid audience. Options: investors, clients, team, students, general"` |
| `tone` | Must be one of the enum values | `"Invalid tone. Options: formal, conversational, energetic, authoritative"` |
| `language` | Must match `^[a-z]{2}(-[A-Z]{2})?$` | `"Invalid language code. Use ISO 639-1 format (e.g., 'es', 'en')"` |
| `tags` | Each tag max 50 chars, array max 20 items | `"Maximum 20 tags allowed, each up to 50 characters"` |

**Rubric evaluation prompt** (sent as a second AI call after generation):

```
You are a presentation quality evaluator. Score the following deck on a scale of 0-100
for each criterion. Return ONLY valid JSON matching this structure:

{
  "overall": <number>,
  "narrative_flow": <number>,
  "content_density": <number>,
  "visual_hierarchy": <number>,
  "brand_consistency": <number>,
  "cta_strength": <number>,
  "suggestions": ["suggestion 1", "suggestion 2", ...]
}

Deck:
<full DeckData JSON>

Scoring guide:
- narrative_flow: Does the story progress logically? Are transitions smooth?
- content_density: 3-5 bullets per content slide, 2-4 stats per stats slide.
- visual_hierarchy: Clear title/subtitle/body differentiation across slides.
- brand_consistency: Tone matches the audience and specified tone setting.
- cta_strength: Is there a clear, compelling call-to-action?
- overall: Weighted average (narrative 25%, density 20%, hierarchy 20%, brand 15%, cta 20%).
```

---

## 3. Phase 6: Remix System

### 3.1 Remix Operations

The remix system transforms a source deck into six derivative formats. Each operation is a deterministic mapping (which slides to include, how to transform content) combined with an AI generation step (rewriting content for the target format).

| Operation | Source | Target | Description |
|-----------|--------|--------|-------------|
| `deck -> executive-summary` | 10+ slides | 3 slides | Distill to Problem, Solution, CTA |
| `deck -> one-pager` | All slides | Single HTML page | Scrollable page with sections |
| `deck -> email-pitch` | All slides | 3-paragraph email | Key points in email format |
| `deck -> social-posts` | Key slides | 3-5 posts | Social media highlights |
| `deck -> speaker-script` | All slides | Full script | Word-for-word speaker script |
| `deck -> handout` | All slides | 2-column PDF-ready HTML | Printable meeting handout |

### 3.2 Remix Schema

```typescript
// ── Request ──

interface RemixRequest {
  /** Content ID of the source deck. Must reference a stored deck (type: 'deck'). */
  sourceContentId: string;

  /** Target output format. */
  targetFormat: 'executive-summary' | 'one-pager' | 'email-pitch' | 'social-posts' | 'speaker-script' | 'handout';

  /** Override audience for the remixed content. Falls back to source deck's audience. */
  audience?: 'investors' | 'clients' | 'team' | 'students' | 'general';

  /** Override tone for the remixed content. Falls back to source deck's tone. */
  tone?: 'formal' | 'conversational' | 'energetic' | 'authoritative';

  /** Maximum word count for text-based outputs (email-pitch, speaker-script).
      Ignored for structured outputs (executive-summary, social-posts). */
  maxLength?: number;

  /** Organization ID for brand kit lookup. */
  orgId?: string;
}

// ── Result ──

interface RemixResult {
  /** New content ID for the remixed output. */
  contentId: string;

  /** Content ID of the source deck. */
  sourceContentId: string;

  /** The target format that was produced. */
  format: 'executive-summary' | 'one-pager' | 'email-pitch' | 'social-posts' | 'speaker-script' | 'handout';

  /** The remixed content. HTML for visual formats, plain text for text formats. */
  content: string;

  /** Metadata about the remixed output. */
  metadata: RemixMetadata;
}

interface RemixMetadata {
  /** Total word count of the output. */
  wordCount: number;

  /** Estimated reading time in minutes (at 200 words/minute). */
  readingTime: number;

  /** Section breakdown of the output. */
  sections: RemixSection[];

  /** Which source slide indices were used. */
  sourceSlideIndices: number[];

  /** ISO 8601 timestamp of remix creation. */
  createdAt: string;
}

interface RemixSection {
  /** Section heading. */
  title: string;

  /** Section type for rendering. */
  type: 'heading' | 'paragraph' | 'bullets' | 'stat-block' | 'quote' | 'cta';

  /** Word count for this section. */
  wordCount: number;
}
```

**JSON Schema for RemixRequest**:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://kitz.app/schemas/remix-request/v1",
  "title": "Kitz Remix Request",
  "type": "object",
  "properties": {
    "sourceContentId": {
      "type": "string",
      "pattern": "^cnt-[a-z0-9]+-[a-z0-9]+$",
      "description": "Content ID of the source deck."
    },
    "targetFormat": {
      "type": "string",
      "enum": ["executive-summary", "one-pager", "email-pitch", "social-posts", "speaker-script", "handout"],
      "description": "Target remix format."
    },
    "audience": {
      "type": "string",
      "enum": ["investors", "clients", "team", "students", "general"],
      "description": "Override audience for the remix."
    },
    "tone": {
      "type": "string",
      "enum": ["formal", "conversational", "energetic", "authoritative"],
      "description": "Override tone for the remix."
    },
    "maxLength": {
      "type": "integer",
      "minimum": 50,
      "maximum": 10000,
      "description": "Maximum word count for text-based outputs."
    },
    "orgId": {
      "type": "string",
      "description": "Organization ID for brand kit lookup."
    }
  },
  "required": ["sourceContentId", "targetFormat"],
  "additionalProperties": false
}
```

**JSON Schema for RemixResult**:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://kitz.app/schemas/remix-result/v1",
  "title": "Kitz Remix Result",
  "type": "object",
  "properties": {
    "contentId": {
      "type": "string",
      "pattern": "^cnt-[a-z0-9]+-[a-z0-9]+$"
    },
    "sourceContentId": {
      "type": "string",
      "pattern": "^cnt-[a-z0-9]+-[a-z0-9]+$"
    },
    "format": {
      "type": "string",
      "enum": ["executive-summary", "one-pager", "email-pitch", "social-posts", "speaker-script", "handout"]
    },
    "content": {
      "type": "string",
      "minLength": 1
    },
    "metadata": {
      "type": "object",
      "properties": {
        "wordCount": { "type": "integer", "minimum": 0 },
        "readingTime": { "type": "number", "minimum": 0 },
        "sections": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "title": { "type": "string" },
              "type": { "type": "string", "enum": ["heading", "paragraph", "bullets", "stat-block", "quote", "cta"] },
              "wordCount": { "type": "integer", "minimum": 0 }
            },
            "required": ["title", "type", "wordCount"]
          }
        },
        "sourceSlideIndices": {
          "type": "array",
          "items": { "type": "integer", "minimum": 0 }
        },
        "createdAt": {
          "type": "string",
          "format": "date-time"
        }
      },
      "required": ["wordCount", "readingTime", "sections", "sourceSlideIndices", "createdAt"]
    }
  },
  "required": ["contentId", "sourceContentId", "format", "content", "metadata"],
  "additionalProperties": false
}
```

### 3.3 Remix Rules per Format

---

#### 3.3.1 Executive Summary (`executive-summary`)

**Purpose**: Compress a full deck into exactly 3 high-impact slides for time-constrained audiences (board meetings, elevator-pitch scenarios).

**Slide selection rules**:

| Output slide | Source slide selection | Priority |
|-------------|----------------------|----------|
| Slide 1: Problem | First slide of type `content` with problem-related title keywords (`problem`, `challenge`, `pain`, `issue`) | If no keyword match, use slide at index 1 (first non-title slide) |
| Slide 2: Solution | First slide of type `content` with solution-related title keywords (`solution`, `approach`, `how`, `product`) + first `stats` slide merged in | If no keyword match, use slide at index 2 |
| Slide 3: CTA | Last slide of type `cta` | If no CTA slide, generate one from deck title + brand contact info |

**Transformation rules**:

- Maximum 3 bullets per slide (select the highest-impact bullets from source).
- If the source Problem slide has > 3 bullets, the AI selects the 3 most compelling.
- The Solution slide merges content bullets and up to 2 key stats into a combined layout.
- The CTA slide preserves `ctaText` and adds a one-sentence summary of the value proposition.
- Speaker notes are regenerated for executive-summary pacing (30 seconds per slide).
- `emphasis` is set to `high` on all 3 slides.

**Target**: 3 slides, ~150 total words across all bullets.

**Output format**: HTML (same slide rendering as the deck system).

**Example output structure**:

```json
{
  "slides": [
    {
      "title": "The Problem",
      "type": "content",
      "bullets": [
        "LatAm SMBs lose 15 hours/week on manual invoicing",
        "67% have no digital payment infrastructure",
        "Customer follow-up is entirely manual"
      ],
      "emphasis": "high",
      "duration_seconds": 30,
      "speaker_notes": "Set the stage quickly. These are the pain points our investors care about most."
    },
    {
      "title": "Kitz: The Operating System for Your Business",
      "type": "content",
      "bullets": [
        "AI-powered invoicing, payments, and CRM in one WhatsApp-native platform",
        "48K MRR with 23% month-over-month growth",
        "1,200+ active businesses across Panama and Colombia"
      ],
      "emphasis": "high",
      "duration_seconds": 30,
      "speaker_notes": "Combine the product story with traction proof. The stats do the heavy lifting."
    },
    {
      "title": "Join the Round",
      "type": "cta",
      "ctaText": "Schedule a 15-minute call to discuss our Series A",
      "emphasis": "high",
      "duration_seconds": 30,
      "speaker_notes": "Direct ask. Hand out the one-pager after this slide."
    }
  ]
}
```

---

#### 3.3.2 One-Pager (`one-pager`)

**Purpose**: Convert the entire deck into a single scrollable HTML page with distinct sections. Suitable for sharing as a link or embedding in a website.

**Slide inclusion rules**: All slides are included. No slides are dropped.

**Transformation rules**:

| Source slide type | One-pager section treatment |
|-------------------|---------------------------|
| `title` | Hero section: large heading + subtitle + brand logo area |
| `content` | Section with `<h2>` heading and `<p>` paragraphs (bullets converted to prose sentences joined by periods, or kept as a `<ul>` if > 3 items) |
| `stats` | Stat cards row: inline-flex cards with large value and label beneath |
| `comparison` | Two-column responsive grid with column headings |
| `quote` | Blockquote section with attribution |
| `cta` | Sticky footer or final section with a centered button and contact info |

**Formatting rules**:

- Single continuous HTML page (no page breaks).
- Responsive: max-width 720px, centered, mobile-friendly.
- Brand CSS injected via `injectBrandCSS()`.
- Each section gets an `id` derived from the slide title (slugified) for anchor navigation.
- A mini table of contents is generated at the top with anchor links.
- Images/media placeholders rendered as gray boxes with the `placeholder` text.

**Target word count**: No fixed limit. Preserves all source content.

**Example output structure** (HTML skeleton):

```html
<div class="one-pager" style="max-width:720px;margin:0 auto;padding:24px">

  <!-- Hero -->
  <section id="company-name" style="text-align:center;padding:48px 0">
    <h1>Company Name</h1>
    <p class="subtitle">Tagline here</p>
  </section>

  <!-- Table of Contents -->
  <nav style="margin-bottom:32px">
    <ul>
      <li><a href="#the-problem">The Problem</a></li>
      <li><a href="#our-solution">Our Solution</a></li>
      <!-- ... -->
    </ul>
  </nav>

  <!-- Content Section -->
  <section id="the-problem">
    <h2>The Problem</h2>
    <p>Pain point 1. Pain point 2. Pain point 3.</p>
  </section>

  <!-- Stats Section -->
  <section id="market-size">
    <h2>Market Size</h2>
    <div style="display:flex;gap:16px;flex-wrap:wrap">
      <div class="stat-card">
        <div class="stat-value">$1.2B</div>
        <div class="stat-label">TAM</div>
      </div>
      <!-- ... -->
    </div>
  </section>

  <!-- Quote Section -->
  <section id="testimonial">
    <blockquote>"Great product!"</blockquote>
    <cite>-- Jane Doe, CEO</cite>
  </section>

  <!-- CTA Section -->
  <section id="next-steps" style="text-align:center;padding:48px 0">
    <h2>Next Steps</h2>
    <a class="btn-primary" href="#">Schedule a Call</a>
  </section>

</div>
```

---

#### 3.3.3 Email Pitch (`email-pitch`)

**Purpose**: Transform the deck into a concise 3-paragraph email suitable for cold outreach, investor introductions, or client proposals.

**Slide selection rules**:

| Email paragraph | Source slides |
|----------------|--------------|
| Paragraph 1: Hook + Problem | `title` slide (for company name) + first `content` slide (problem) |
| Paragraph 2: Solution + Proof | `content` slides with solution keywords + `stats` slides (cherry-pick top 2-3 metrics) |
| Paragraph 3: CTA | `cta` slide + `quote` slide (if available, use as social proof one-liner) |

**Transformation rules**:

- Bullets are converted to flowing prose sentences.
- Stats are woven into sentences naturally: "We have grown to $48K MRR with 23% month-over-month growth."
- Quotes are shortened to a single sentence and attributed inline: "As Jane Doe put it, 'Great product.'"
- The email includes a subject line derived from the deck title.
- A P.S. line is added if there is a quote slide (uses the quote as social proof).
- No HTML formatting in the body (plain text email). Links are written out as URLs.

**Target word count**: 150-250 words (default `maxLength`: 250).

**Formatting rules**:

```
Subject: {deck title} -- {one-sentence hook}

Hi {recipient_placeholder},

{Paragraph 1: 2-3 sentences. State who you are and the problem you solve.}

{Paragraph 2: 3-4 sentences. Your solution, backed by 2-3 key metrics.}

{Paragraph 3: 1-2 sentences. Clear ask with a specific next step.}

Best,
{author}
{BrandKit.contactInfo.email}
{BrandKit.contactInfo.phone}

P.S. {Social proof quote, if available.}
```

**Example output**:

```
Subject: Kitz -- The Operating System LatAm SMBs Have Been Waiting For

Hi {name},

Small businesses across Latin America lose over 15 hours every week on manual
invoicing, follow-ups, and payment tracking. Most have no digital infrastructure
to streamline these core operations.

Kitz is changing that. Our WhatsApp-native platform combines AI-powered invoicing,
CRM, and payments into a single operating system. We have reached $48K MRR with
23% month-over-month growth across 1,200 active businesses in Panama and Colombia.

I would love to share a 15-minute walkthrough of what we are building. Are you
available this week for a quick call?

Best,
Maria Garcia
maria@kitz.app
+507 6000-0000

P.S. "Kitz cut our invoicing time by 80%." -- Carlos Mendez, owner of Tienda Digital
```

---

#### 3.3.4 Social Posts (`social-posts`)

**Purpose**: Generate 3-5 standalone social media posts, each highlighting a different aspect of the deck.

**Slide selection rules**:

| Post # | Source slide(s) | Focus |
|--------|----------------|-------|
| Post 1 | `title` + first `content` | Hook: problem statement as a question or bold claim |
| Post 2 | `stats` slide (first) | Proof: key metrics as attention-grabbing numbers |
| Post 3 | `content` slide (solution) | Value prop: what the product/service does |
| Post 4 (if `quote` exists) | `quote` slide | Social proof: customer testimonial |
| Post 5 (if `cta` exists) | `cta` slide | Call-to-action: direct engagement prompt |

**Transformation rules**:

- Each post is self-contained (makes sense without reading the others).
- Maximum 280 characters for Twitter/X-length posts; a longer variant (up to 500 characters) is also generated for LinkedIn/Instagram.
- Stats are reformatted as bold statements: "23% growth. $48K MRR. 1,200+ businesses. That is Kitz."
- Bullets are collapsed into a single compelling sentence.
- Each post ends with a CTA or engagement prompt (question, "Link in bio", "DM us").
- Hashtags are appended (3-5 relevant hashtags derived from deck tags and industry).
- Emojis are NOT included by default (can be enabled via a future flag).

**Target**: 3-5 posts, each 100-280 characters (short) + 200-500 characters (long).

**Output format**: Plain text, one post per section.

**Example output structure**:

```json
{
  "posts": [
    {
      "short": "LatAm SMBs lose 15+ hours/week on manual invoicing. There is a better way. #SmallBusiness #LatAm #Fintech",
      "long": "Small businesses across Latin America spend over 15 hours every week on manual invoicing, chasing payments, and tracking customers in spreadsheets. We built Kitz to change that -- one WhatsApp-native platform for invoicing, CRM, and payments. #SmallBusiness #LatAm #Fintech",
      "sourceSlideIndex": 1,
      "focus": "problem"
    },
    {
      "short": "$48K MRR. 23% month-over-month growth. 1,200+ active businesses. Kitz is scaling across LatAm. #StartupMetrics",
      "long": "The numbers speak for themselves: $48K in monthly recurring revenue, 23% month-over-month growth, and over 1,200 active businesses across Panama and Colombia. Kitz is the operating system LatAm SMBs have been waiting for. #StartupMetrics #LatAm #SaaS",
      "sourceSlideIndex": 5,
      "focus": "traction"
    },
    {
      "short": "AI-powered invoicing + WhatsApp-native CRM + instant payments. All in one platform. That is Kitz.",
      "long": "Imagine managing your entire business from WhatsApp -- invoicing, customer relationships, and payments, all powered by AI. That is exactly what Kitz delivers. No app downloads. No learning curve. Just results. Learn more at kitz.app",
      "sourceSlideIndex": 2,
      "focus": "solution"
    }
  ]
}
```

---

#### 3.3.5 Speaker Script (`speaker-script`)

**Purpose**: Generate a complete word-for-word speaker script with transitions between slides, timing cues, and stage directions.

**Slide inclusion rules**: All slides are included in order. No slides are dropped.

**Transformation rules**:

| Element | Rule |
|---------|------|
| Slide heading | Rendered as `## Slide N: {title}` with `[{duration_seconds}s]` timing cue |
| Bullets | Expanded into 2-3 spoken sentences per bullet. Conversational register. |
| Stats | Narrated with context: "Let me draw your attention to a key number: our MRR has reached forty-eight thousand dollars, growing at twenty-three percent month over month." |
| Quotes | Introduced with a transition: "One of our customers, Carlos Mendez, said it best..." |
| Comparisons | Narrated as contrast: "On the left you will see... and on the right..." |
| CTA | Closes with a direct ask and a pause cue: "[Pause.] I would love to continue this conversation. Who here would like to schedule a deeper dive?" |
| Transitions | Between every slide, a 1-sentence bridging phrase: "Now that we have established the problem, let me show you our approach." |
| Speaker notes | If `speaker_notes` exists on the source slide, they are incorporated into the script. |

**Formatting rules**:

```markdown
# {Deck Title}
**Speaker**: {author}
**Total time**: {totalDuration} minutes
**Audience**: {audience}

---

## Slide 1: {Title} [30s]

{Spoken script for this slide. 2-4 paragraphs of natural speech.}

> Transition: {bridging sentence to next slide}

---

## Slide 2: {Title} [60s]

{Spoken script...}

> Transition: {bridging sentence}

---

...

## Slide N: {Title} [30s]

{Closing script with CTA.}

[END]
```

**Target word count**: ~150 words per minute of `totalDuration`. For a 10-minute deck, target ~1,500 words (default `maxLength`: totalDuration * 150).

---

#### 3.3.6 Handout (`handout`)

**Purpose**: Generate a printable two-column summary document suitable for leaving behind after a meeting.

**Slide inclusion rules**: All slides except `title` are included. The `title` slide data is used for the document header.

**Transformation rules**:

| Source slide type | Handout treatment |
|-------------------|-------------------|
| `title` | Document header: company name, subtitle, date, author (not a row in the two-column layout) |
| `content` | Left column: heading. Right column: bullets as a compact list. |
| `stats` | Left column: heading. Right column: stat values formatted as `Label: Value` list. |
| `comparison` | Full-width row with two sub-columns preserving the comparison. |
| `quote` | Full-width row: italicized quote with attribution. |
| `cta` | Footer section: CTA text + contact information from BrandKit. |

**Formatting rules**:

- Two-column layout using CSS grid (`grid-template-columns: 1fr 2fr`).
- Print-optimized: `@media print` rules, A4/Letter page size, no page breaks within sections.
- Compact typography: 11pt body, 14pt headings.
- Brand colors applied sparingly (headings and accent lines only; body text is black).
- Footer includes: company name, contact email, phone, website (from BrandKit).
- Page numbers in bottom-right corner.

**Target word count**: Condensed. Maximum 100 words per source slide.

**Output format**: HTML with print CSS (same pattern as `deck_export`).

**Example output structure** (HTML skeleton):

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    @page { size: A4; margin: 20mm; }
    body { font-family: 'Inter', sans-serif; font-size: 11pt; color: #0A0A0A; }
    .header { border-bottom: 3px solid var(--brand-primary); padding-bottom: 12px; margin-bottom: 24px; }
    .header h1 { font-size: 22pt; margin: 0; color: var(--brand-primary); }
    .header .meta { font-size: 9pt; color: #666; }
    .row { display: grid; grid-template-columns: 1fr 2fr; gap: 16px; margin-bottom: 16px;
           padding-bottom: 16px; border-bottom: 1px solid #eee; }
    .row-label { font-weight: 700; font-size: 12pt; color: var(--brand-primary); }
    .row-content { font-size: 11pt; }
    .row-content ul { margin: 0; padding-left: 16px; }
    .full-width { grid-column: 1 / -1; }
    .quote { font-style: italic; padding: 12px; border-left: 3px solid var(--brand-accent); }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 3px solid var(--brand-primary);
              font-size: 9pt; color: #666; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Company Name</h1>
    <div class="meta">Prepared by Maria Garcia | February 2026 | Confidential</div>
  </div>

  <div class="row">
    <div class="row-label">The Problem</div>
    <div class="row-content">
      <ul>
        <li>Pain point 1</li>
        <li>Pain point 2</li>
        <li>Pain point 3</li>
      </ul>
    </div>
  </div>

  <div class="row">
    <div class="row-label">Market Size</div>
    <div class="row-content">TAM: $1.2B | SAM: $200M | SOM: $30M</div>
  </div>

  <div class="row full-width">
    <div class="quote">"Great product!" -- Jane Doe, CEO</div>
  </div>

  <div class="footer">
    <div>Company Name | maria@kitz.app | +507 6000-0000</div>
    <div>Page 1</div>
  </div>
</body>
</html>
```

---

### 3.4 Integration with Existing Content Engine

#### 3.4.1 Content Type Mapping

Remixed content is stored via the existing `storeContent()` function from `contentEngine.ts`. The `ContentItem.type` field needs to be extended to accommodate remix outputs.

**Current `ContentItem.type` values**:

```typescript
type: 'invoice' | 'quote' | 'deck' | 'email' | 'flyer' | 'promo' | 'landing' | 'catalog' | 'biolink';
```

**Extended type values (add these)**:

```typescript
type: 'invoice' | 'quote' | 'deck' | 'email' | 'flyer' | 'promo' | 'landing' | 'catalog' | 'biolink'
    | 'deck-summary'     // executive-summary remix
    | 'one-pager'        // one-pager remix
    | 'email-pitch'      // email-pitch remix
    | 'social-posts'     // social-posts remix
    | 'speaker-script'   // speaker-script remix
    | 'handout';         // handout remix
```

**Mapping table**:

| Remix target | ContentItem.type | Content format |
|-------------|-----------------|---------------|
| `executive-summary` | `deck-summary` | HTML (slide deck, 3 slides) |
| `one-pager` | `one-pager` | HTML (single page) |
| `email-pitch` | `email-pitch` | Plain text |
| `social-posts` | `social-posts` | JSON string (array of post objects) |
| `speaker-script` | `speaker-script` | Markdown |
| `handout` | `handout` | HTML (print-ready) |

#### 3.4.2 Content Storage

Each remix output is stored as an independent `ContentItem` with a reference back to the source deck.

```typescript
// Inside deck_remix execute():
const remixContentId = generateContentId();

storeContent({
  contentId: remixContentId,
  type: contentTypeForFormat(targetFormat),  // maps format to ContentItem.type
  html: remixContent,                         // or plain text, depending on format
  data: {
    sourceContentId: sourceContentId,
    format: targetFormat,
    audience: effectiveAudience,
    tone: effectiveTone,
    metadata: remixMetadata,
  },
  status: 'draft',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
```

#### 3.4.3 Status Workflow

Remixed content follows the same `ContentItem.status` lifecycle as all other content:

```
draft -> previewing -> editing -> approved -> shipped -> archived
```

**Workflow details**:

| Status | How it is reached | What the user sees |
|--------|------------------|-------------------|
| `draft` | Immediately after `deck_remix` completes | Remix output displayed in CanvasPreview |
| `previewing` | User views the content in the preview panel | Same as draft but explicitly "previewed" |
| `editing` | User requests a change via `content_edit` (e.g., "make the email shorter") | AI regenerates the remix output |
| `approved` | User says "ship it" or explicitly approves | Content is locked; ready for delivery |
| `shipped` | `content_ship` sends via WhatsApp/Email | Content is delivered and logged |
| `archived` | Manual or automatic after 30 days post-ship | Stored in document archive |

**Edit behavior for remixed content**: The existing `content_edit` tool works on remixed content without modification. The AI receives the current HTML/text and the user's instruction, then regenerates. No special handling is needed because remixed content is just another `ContentItem`.

#### 3.4.4 Tool Registration

Two new tools are added to `deckTools.ts`:

```typescript
const deck_remix: ToolSchema = {
  name: 'deck_remix',
  description:
    'Remix an existing deck into a different format. Transforms a presentation into ' +
    'an executive summary (3 slides), one-pager (HTML), email pitch (text), social posts, ' +
    'speaker script, or printable handout.',
  parameters: {
    type: 'object',
    properties: {
      source_content_id: { type: 'string', description: 'Content ID of the source deck' },
      target_format: {
        type: 'string',
        enum: ['executive-summary', 'one-pager', 'email-pitch', 'social-posts', 'speaker-script', 'handout'],
        description: 'Target remix format',
      },
      audience: {
        type: 'string',
        enum: ['investors', 'clients', 'team', 'students', 'general'],
        description: 'Override audience (defaults to source deck audience)',
      },
      tone: {
        type: 'string',
        enum: ['formal', 'conversational', 'energetic', 'authoritative'],
        description: 'Override tone (defaults to source deck tone)',
      },
      max_length: { type: 'number', description: 'Max word count for text outputs' },
      org_id: { type: 'string', description: 'Organization ID' },
    },
    required: ['source_content_id', 'target_format'],
  },
  riskLevel: 'high',
  execute: async (params: Record<string, unknown>) => { /* implementation */ },
};

const deck_remix_list: ToolSchema = {
  name: 'deck_remix_list',
  description:
    'List all remixed content derived from a given deck. Returns content IDs, formats, ' +
    'statuses, and creation timestamps.',
  parameters: {
    type: 'object',
    properties: {
      source_content_id: { type: 'string', description: 'Content ID of the source deck' },
    },
    required: ['source_content_id'],
  },
  riskLevel: 'low',
  execute: async (params: Record<string, unknown>) => { /* implementation */ },
};
```

**Updated tool export**:

```typescript
export function getAllDeckTools(): ToolSchema[] {
  return [deck_create, deck_export, deck_remix, deck_remix_list];
}
```

#### 3.4.5 `deck_remix` Execution Flow

```
1.  Validate input: source_content_id exists, is type 'deck', target_format is valid.
2.  Load source DeckData from getContent(source_content_id).data.
3.  Load brand kit via getBrandKit(orgId).
4.  Determine effective audience and tone (override > source deck > defaults).
5.  Apply slide selection rules for the target format (Section 3.3).
6.  Build format-specific AI prompt:
    a. Include selected slide data as JSON.
    b. Include transformation rules for the target format.
    c. Include audience, tone, maxLength constraints.
    d. Include brand information (name, tagline, contact).
7.  Call claudeChat() (model: 'sonnet') with the prompt.
8.  Parse AI response into the target format structure.
9.  For HTML formats (executive-summary, one-pager, handout):
    a. Inject brand CSS via injectBrandCSS().
10. Compute metadata (wordCount, readingTime, sections, sourceSlideIndices).
11. Generate a new contentId via generateContentId().
12. Store via storeContent() with the appropriate type.
13. Return RemixResult.
```

#### 3.4.6 AI Prompt Templates per Format

Each remix format uses a tailored prompt. Here is the pattern:

```typescript
function buildRemixPrompt(
  format: RemixRequest['targetFormat'],
  deckData: DeckData,
  brand: BrandKit,
  audience: string,
  tone: string,
  maxLength?: number,
): string {
  const baseContext = `You are a content remixer for the Kitz platform.
Source deck: "${deckData.title}" by ${deckData.author}
Business: ${brand.businessName}${brand.tagline ? ` -- ${brand.tagline}` : ''}
Audience: ${audience}
Tone: ${tone}
Language: ${deckData.language}
${maxLength ? `Maximum word count: ${maxLength}` : ''}

Source slides:
${JSON.stringify(deckData.slides, null, 2)}`;

  const formatInstructions: Record<string, string> = {
    'executive-summary': `Produce exactly 3 slides as a JSON array matching the SlideSpec schema:
- Slide 1: Problem (type: "content", max 3 bullets, emphasis: "high")
- Slide 2: Solution + key stats merged (type: "content", max 3 bullets, emphasis: "high")
- Slide 3: CTA (type: "cta", emphasis: "high")
Include speaker_notes for each slide (30 seconds pacing).
Return ONLY a valid JSON array.`,

    'one-pager': `Produce a single HTML page. Requirements:
- Max-width 720px, centered layout, responsive
- Hero section from the title slide
- Each subsequent slide becomes a section with an id (slugified title)
- Generate a table of contents with anchor links
- Convert bullets to prose for sections with <= 3 bullets; keep as <ul> otherwise
- Stats become inline card elements
- Quotes become <blockquote> elements
- CTA becomes a centered button section
Return ONLY valid HTML (no doctype, no head -- those will be injected).`,

    'email-pitch': `Write a 3-paragraph email. Structure:
- Subject line derived from the deck title
- Paragraph 1: Who you are and the problem (2-3 sentences)
- Paragraph 2: Solution + 2-3 key metrics woven naturally into prose (3-4 sentences)
- Paragraph 3: Clear ask with a specific next step (1-2 sentences)
- Sign off with: author name, email, phone from brand info
- P.S. line using a customer quote if available
Plain text only. No HTML.
Return the complete email text.`,

    'social-posts': `Generate 3-5 social media posts as a JSON array. Each post object:
{ "short": "max 280 chars", "long": "max 500 chars", "sourceSlideIndex": <number>, "focus": "<keyword>" }
- Post 1: Problem statement as a hook
- Post 2: Key metrics / traction
- Post 3: Solution / value proposition
- Post 4 (optional): Customer testimonial
- Post 5 (optional): CTA / engagement prompt
Add 3-5 relevant hashtags. No emojis.
Return ONLY a valid JSON array.`,

    'speaker-script': `Write a complete speaker script in markdown. Structure:
# {Deck Title}
**Speaker**: {author}  **Total time**: {totalDuration} min  **Audience**: {audience}
---
For each slide:
## Slide N: {Title} [{duration}s]
{2-4 paragraphs of natural speech expanding on the slide content}
> Transition: {bridging sentence to next slide}
---
Expand bullets into spoken sentences. Narrate stats with context. Introduce quotes naturally.
End with a strong closing and CTA.
Target: ~150 words per minute of total duration.`,

    'handout': `Produce a two-column handout as HTML. Structure:
- Header: company name, subtitle, date, author, "Confidential" label
- Body: CSS grid (1fr 2fr) rows, one per slide
  - Left column: slide title (bold, brand primary color)
  - Right column: content (bullets as compact list, stats as "Label: Value" list)
- Quotes: full-width italic with left border
- Footer: company name, contact info, page number
Print CSS: @page A4, 20mm margins, 11pt body, 14pt headings.
Return ONLY valid HTML (complete document with <style> block).`,
  };

  return `${baseContext}\n\n${formatInstructions[format]}`;
}
```

#### 3.4.7 AOS Agent Wiring

The remix tools integrate with the existing AOS agent system:

| Agent | Tools Added | Use Case |
|-------|------------|----------|
| **ContentCreator** | `deck_remix` | Auto-generate derivative formats after deck approval |
| **CMO** | `deck_remix` | Create social posts and email pitches from approved decks |
| **OutreachDrafter** | `deck_remix` | Generate email pitches for outbound campaigns |

#### 3.4.8 n8n Workflow Templates

| Template | Trigger | Actions |
|----------|---------|---------|
| `deck-auto-remix.json` | Deck status changed to `approved` | Generate executive-summary + one-pager + email-pitch automatically |
| `deck-social-publish.json` | Social-posts remix approved | Schedule posts via social media API (future) |
| `deck-handout-print.json` | Handout remix approved | Push to print queue or email as PDF attachment |

---

## 4. Migration & Backwards Compatibility

### 4.1 Schema Versioning

- **Version 0** (implicit): Existing `DeckData` objects that lack the `version` field. These are valid under the extended schema because all new fields are optional at the storage layer.
- **Version 1**: Phase 4 extended `DeckData` objects. The `version` field is explicitly set to `1`.

### 4.2 Upgrade Path

When reading a stored deck, apply this normalization:

```typescript
function normalizeDeckData(raw: Record<string, unknown>): DeckData {
  const version = (raw.version as number) ?? 0;

  if (version === 0) {
    // Backfill Phase 4 fields with defaults
    return {
      ...(raw as DeckData),
      title: (raw as DeckData).slides?.[0]?.title ?? 'Untitled Deck',
      author: getBrandKit().businessName,
      audience: 'general',
      tone: 'formal',
      language: getBrandKit().language,
      totalDuration: ((raw as DeckData).slideCount ?? 1) * 1,  // 1 min per slide default
      version: 0,
      tags: [],
    };
  }

  return raw as DeckData;
}
```

### 4.3 Rendering Compatibility

The `renderSlide()` function is extended to handle new fields but falls back gracefully:

- If `layout` is omitted, infer from `type` (see Section 2.1 table).
- If `transition` is omitted, default to `'fade'`.
- If `emphasis` is omitted, default to `'medium'`.
- If `speaker_notes` is omitted, skip speaker notes rendering.
- If `media` is omitted, skip media placeholder rendering.
- If `duration_seconds` is omitted, use defaults (60 for content/stats/comparison, 30 for title/quote/cta).

### 4.4 ContentItem.type Extension

The `ContentItem` type union is extended in `contentEngine.ts`. Existing code that only checks for `'deck'` continues to work. New remix types are only matched by remix-aware code.

```typescript
// contentEngine.ts -- updated type union
export interface ContentItem {
  contentId: string;
  type: 'invoice' | 'quote' | 'deck' | 'email' | 'flyer' | 'promo' | 'landing'
      | 'catalog' | 'biolink'
      | 'deck-summary' | 'one-pager' | 'email-pitch' | 'social-posts'
      | 'speaker-script' | 'handout';
  html: string;
  data: Record<string, unknown>;
  status: 'draft' | 'previewing' | 'editing' | 'approved' | 'shipped' | 'archived';
  createdAt: string;
  updatedAt: string;
}
```

---

## 5. Implementation Checklist

### Phase 4: Extended Schema

- [ ] Add Phase 4 fields to `SlideSpec` interface in `deckTools.ts`
- [ ] Add Phase 4 fields to `DeckData` interface in `deckTools.ts`
- [ ] Add `RubricScore` interface in `deckTools.ts`
- [ ] Extend `deck_create` tool parameters to accept `audience`, `tone`, `language`, `tags`, `include_speaker_notes`, `include_rubric`, `title`, `subtitle`
- [ ] Update the AI generation prompt to include audience, tone, and speaker notes instructions
- [ ] Implement rubric evaluation as a second `claudeChat()` call (model: `haiku`)
- [ ] Compute `totalDuration` from `slides[].duration_seconds`
- [ ] Update `renderSlide()` to handle `layout`, `transition`, `emphasis`, `media` fields
- [ ] Add `normalizeDeckData()` for backwards-compatible reading of v0 decks
- [ ] Update `deck_export` to include speaker notes in a separate print section (optional)
- [ ] Add JSON Schema file at `kitz_os/schemas/deck-v1.json`
- [ ] Add unit tests for schema validation, default inference, and backwards compatibility

### Phase 6: Remix System

- [ ] Add `RemixRequest`, `RemixResult`, `RemixMetadata`, `RemixSection` interfaces
- [ ] Implement `deck_remix` tool with slide selection logic per format
- [ ] Implement `deck_remix_list` tool
- [ ] Implement `buildRemixPrompt()` with format-specific prompt templates
- [ ] Add `contentTypeForFormat()` mapping function
- [ ] Extend `ContentItem.type` union in `contentEngine.ts` with 6 new types
- [ ] Register `deck_remix` and `deck_remix_list` in `getAllDeckTools()`
- [ ] Add `deck_remix` to registry import list in `registry.ts` (already covered by `getAllDeckTools`)
- [ ] Wire `deck_remix` to ContentCreator, CMO, and OutreachDrafter agents
- [ ] Create `deck-auto-remix.json` n8n workflow template
- [ ] Create `deck-social-publish.json` n8n workflow template
- [ ] Create `deck-handout-print.json` n8n workflow template
- [ ] Add unit tests for each remix format (mock claudeChat, verify structure)
- [ ] Add integration test: create deck -> remix to all 6 formats -> verify storage

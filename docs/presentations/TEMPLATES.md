# Kitz Presentation Templates Reference

> Practical reference for the AI content generation system (`deckTools.ts`).
> Each template defines a complete slide-by-slide structure using the `SlideSpec` interface,
> along with tone, density, and color guidance for the generation agent.

---

## Table of Contents

1. [SlideSpec Quick Reference](#slidespec-quick-reference)
2. [Template 1: Educational Presentation (12 slides)](#template-1-educational-presentation)
3. [Template 2: Workshop Deck (15 slides)](#template-2-workshop-deck)
4. [Template 3: Internal Strategy Deck (10 slides)](#template-3-internal-strategy-deck)
5. [Template 4: Client Presentation (12 slides)](#template-4-client-presentation)
6. [Slide Density Rules (Global)](#slide-density-rules-global)
7. [Color Emphasis Guide](#color-emphasis-guide)
8. [AI Generation Notes](#ai-generation-notes)

---

## SlideSpec Quick Reference

```typescript
interface SlideSpec {
  title: string;
  type: 'title' | 'content' | 'stats' | 'comparison' | 'quote' | 'cta';
  bullets?: string[];                          // used by 'content' type
  stats?: Array<{ label: string; value: string }>;  // used by 'stats' type
  leftColumn?: string[];                       // used by 'comparison' type
  rightColumn?: string[];                      // used by 'comparison' type
  quoteText?: string;                          // used by 'quote' type
  attribution?: string;                        // used by 'quote' type
  ctaText?: string;                            // used by 'cta' type
}
```

**Type usage guidelines:**

| SlideSpec Type | Best For | Max Items |
|---|---|---|
| `title` | Opening slides, section dividers | Title + optional tagline |
| `content` | Bullet-based explanations, lists, processes | 3-5 bullets |
| `stats` | Metrics, KPIs, numeric comparisons | 3-4 stat cards |
| `comparison` | Side-by-side analysis, before/after, pros/cons | 4-6 items per column |
| `quote` | Testimonials, key statements, provocative hooks | 1 quote + attribution |
| `cta` | Closing actions, next steps, contact info | 1 action line |

---

## Template 1: Educational Presentation

**Template key:** `educational`
**Slide count:** 12
**Use case:** Teaching a concept, workshop intro, training material
**Audience:** Students, team members, workshop attendees
**Narrative arc:** Hook -> Context -> Core Concepts (3-4) -> Examples -> Practice -> Recap -> Resources

### Tone Guide

- **Register:** Conversational but authoritative. The speaker is a knowledgeable peer, not a lecturer.
- **Voice:** Second person ("you will learn", "notice how") mixed with first person plural ("let's explore").
- **Energy:** Builds from curiosity (slides 1-3) to depth (slides 4-7) to activation (slides 8-9) to consolidation (slides 10-12).
- **Language quirks:** Use questions in slide titles where appropriate. Prefer concrete examples over abstract definitions.

### Color Emphasis

- **Primary** (`--brand-primary`): Slide titles, concept headings, stat card backgrounds.
- **Secondary** (`--brand-secondary`): Sub-headings, supporting text, attribution lines.
- **Accent** (`--brand-accent`): Key terms to highlight within bullets, the "hook" stat value on slide 2, interactive/practice slide background tint.
- **Weight distribution:** 60% primary, 25% secondary, 15% accent.

### Slide Density Rules

| Slide | Word Target | Notes |
|---|---|---|
| Title (1) | 8-15 words | Topic name + speaker + date. No paragraphs. |
| Hook (2) | 15-30 words | One stat or question. White space is the design. |
| Agenda (3) | 30-50 words | 3-4 bullet learning objectives, each under 15 words. |
| Core Concepts (4-7) | 40-60 words each | One concept per slide. Title is the concept name. 3-4 bullets max. |
| Case Study (8) | 50-70 words | Real example. Use stats type if metrics are available. |
| Interactive (9) | 20-40 words | Exercise prompt must be actionable in one sentence. |
| Common Mistakes (10) | 40-60 words | 3-4 "don't" bullets. Frame negatively to create contrast. |
| Key Takeaways (11) | 30-50 words | 3-5 short bullets. Restate, don't introduce new material. |
| Resources (12) | 30-50 words | Links, book titles, tool names. CTA for continued learning. |

### Slide-by-Slide Structure

#### Slide 1 — Title
**Purpose:** Establish topic and speaker credibility.
**SlideSpec type:** `title`

```json
{
  "title": "{{topic_name}}",
  "type": "title"
}
```

**AI generation instructions:** Set `title` to the presentation topic from the brief. The brand tagline slot (rendered by `slideWrapper`) will show the business name. If the brief mentions a speaker name, append " | {{speaker_name}}" to the title. If a date is relevant, include it in the title string.

---

#### Slide 2 — Hook
**Purpose:** Create curiosity with a surprising statistic or provocative question.
**SlideSpec type:** `quote`

```json
{
  "title": "Did You Know?",
  "type": "quote",
  "quoteText": "{{surprising_stat_or_question}}",
  "attribution": "{{source_or_empty}}"
}
```

**AI generation instructions:** Extract or infer a compelling hook from the brief. Prefer a numeric stat with a source attribution. If no stat is available, use a thought-provoking question (attribution can be empty). The `quoteText` should be a single sentence, 20 words maximum.

---

#### Slide 3 — Agenda / Overview
**Purpose:** Set expectations. Tell them what they will learn.
**SlideSpec type:** `content`

```json
{
  "title": "What You'll Learn",
  "type": "content",
  "bullets": [
    "{{learning_objective_1}}",
    "{{learning_objective_2}}",
    "{{learning_objective_3}}",
    "{{learning_objective_4}}"
  ]
}
```

**AI generation instructions:** Derive 3-4 learning objectives from the brief. Each bullet should start with an action verb (Understand, Identify, Apply, Evaluate). Keep each bullet under 15 words. These objectives must map to slides 4-7.

---

#### Slides 4-7 — Core Concepts (4 slides)
**Purpose:** Teach one concept per slide. Each slide builds on the previous.
**SlideSpec type:** `content`

```json
{
  "title": "{{concept_name}}",
  "type": "content",
  "bullets": [
    "{{definition_or_explanation}}",
    "{{why_it_matters}}",
    "{{visual_metaphor_or_analogy}}",
    "{{practical_implication}}"
  ]
}
```

**AI generation instructions:** Break the topic from the brief into 3-4 core concepts. For each:
- Bullet 1: Define the concept in plain language.
- Bullet 2: Explain why it matters to the audience.
- Bullet 3: Provide an analogy or visual metaphor (prefix with "Think of it like...").
- Bullet 4: Give one practical implication or action.

If the brief covers fewer than 4 concepts, use 3 concept slides and convert slide 7 into a second case study or a deeper dive on the most important concept.

---

#### Slide 8 — Case Study
**Purpose:** Ground the concepts in a real-world example.
**SlideSpec type:** `stats` (if metrics available) or `content` (if narrative)

```json
{
  "title": "Case Study: {{company_or_scenario}}",
  "type": "stats",
  "stats": [
    { "label": "{{metric_1_label}}", "value": "{{metric_1_value}}" },
    { "label": "{{metric_2_label}}", "value": "{{metric_2_value}}" },
    { "label": "{{metric_3_label}}", "value": "{{metric_3_value}}" }
  ]
}
```

**Fallback (narrative case study):**

```json
{
  "title": "Case Study: {{company_or_scenario}}",
  "type": "content",
  "bullets": [
    "Challenge: {{what_they_faced}}",
    "Approach: {{what_they_did}}",
    "Result: {{what_happened}}",
    "Lesson: {{what_we_can_learn}}"
  ]
}
```

**AI generation instructions:** If the brief mentions specific results or numbers, use the `stats` type. Otherwise, use the `content` type with a Challenge/Approach/Result/Lesson structure. Prefer real companies or scenarios from the brief. If none are mentioned, construct a realistic hypothetical and label it clearly.

---

#### Slide 9 — Interactive / Practice
**Purpose:** Shift from passive to active learning.
**SlideSpec type:** `content`

```json
{
  "title": "Your Turn",
  "type": "content",
  "bullets": [
    "Exercise: {{clear_activity_instruction}}",
    "Time: {{duration}} minutes",
    "Format: {{individual_pair_or_group}}",
    "Share: {{what_to_share_with_group}}"
  ]
}
```

**AI generation instructions:** Design a simple exercise that applies concepts from slides 4-7. The exercise must be completable in 3-10 minutes. Be specific about what participants should produce (a list, a diagram, a one-paragraph response). If the brief does not suggest interactivity, default to a "Think-Pair-Share" prompt related to the core topic.

---

#### Slide 10 — Common Mistakes
**Purpose:** Preemptively address misconceptions.
**SlideSpec type:** `content`

```json
{
  "title": "Common Mistakes to Avoid",
  "type": "content",
  "bullets": [
    "{{mistake_1}}",
    "{{mistake_2}}",
    "{{mistake_3}}"
  ]
}
```

**AI generation instructions:** Identify 3-4 common pitfalls related to the topic. Frame each as a specific behavior or belief to avoid, not a vague warning. Prefix each bullet with a concise negative framing (e.g., "Assuming that...", "Skipping the step of...", "Over-relying on..."). Draw from the brief's domain if possible.

---

#### Slide 11 — Key Takeaways
**Purpose:** Consolidate learning. Nothing new here.
**SlideSpec type:** `content`

```json
{
  "title": "Key Takeaways",
  "type": "content",
  "bullets": [
    "{{takeaway_1}}",
    "{{takeaway_2}}",
    "{{takeaway_3}}",
    "{{takeaway_4}}",
    "{{takeaway_5}}"
  ]
}
```

**AI generation instructions:** Summarize the 3-5 most important points from slides 4-7. Each takeaway should be a complete sentence, under 12 words. Do not introduce new concepts. Mirror the language from the learning objectives on slide 3 for closure.

---

#### Slide 12 — Resources & Next Steps
**Purpose:** Provide continued learning path and closing CTA.
**SlideSpec type:** `cta`

```json
{
  "title": "Resources & Next Steps",
  "type": "cta",
  "ctaText": "{{primary_cta}}"
}
```

**AI generation instructions:** Set `ctaText` to a single actionable next step (e.g., "Download the worksheet at example.com", "Join the Slack channel for Q&A"). The title can include a subtitle with 2-3 resource mentions if the brief provides them. If no specific resources are in the brief, use a generic CTA like "Questions? Let's discuss." with the brand contact info rendered by the template.

---

### Template Array (for `DECK_TEMPLATES`)

```typescript
'educational': [
  { title: 'Topic Name', type: 'title' },
  { title: 'Did You Know?', type: 'quote', quoteText: 'Surprising stat or question', attribution: 'Source' },
  { title: 'What You\'ll Learn', type: 'content', bullets: ['Objective 1', 'Objective 2', 'Objective 3', 'Objective 4'] },
  { title: 'Concept 1', type: 'content', bullets: ['Definition', 'Why it matters', 'Analogy', 'Practical implication'] },
  { title: 'Concept 2', type: 'content', bullets: ['Definition', 'Why it matters', 'Analogy', 'Practical implication'] },
  { title: 'Concept 3', type: 'content', bullets: ['Definition', 'Why it matters', 'Analogy', 'Practical implication'] },
  { title: 'Concept 4', type: 'content', bullets: ['Definition', 'Why it matters', 'Analogy', 'Practical implication'] },
  { title: 'Case Study', type: 'stats', stats: [{ label: 'Metric 1', value: 'X' }, { label: 'Metric 2', value: 'X' }, { label: 'Metric 3', value: 'X' }] },
  { title: 'Your Turn', type: 'content', bullets: ['Exercise instruction', 'Time: X minutes', 'Format: Individual/Pair/Group', 'Share prompt'] },
  { title: 'Common Mistakes to Avoid', type: 'content', bullets: ['Mistake 1', 'Mistake 2', 'Mistake 3'] },
  { title: 'Key Takeaways', type: 'content', bullets: ['Takeaway 1', 'Takeaway 2', 'Takeaway 3', 'Takeaway 4', 'Takeaway 5'] },
  { title: 'Resources & Next Steps', type: 'cta', ctaText: 'Continue learning at...' },
]
```

---

## Template 2: Workshop Deck

**Template key:** `workshop`
**Slide count:** 15
**Use case:** Hands-on workshop, training session, bootcamp
**Audience:** Active participants who will do exercises
**Narrative arc:** Welcome -> Framework -> Exercise Cycles (3x: Teach -> Do -> Reflect) -> Synthesis

### Tone Guide

- **Register:** Energetic and directive. The facilitator is a coach guiding action.
- **Voice:** Second person imperative ("Try this", "Build a", "Discuss with your partner"). Direct instructions, not suggestions.
- **Energy:** High from the start. Each Teach->Do->Reflect cycle resets energy. Synthesis slide is reflective and calm.
- **Language quirks:** Use numbered steps in exercise slides. Time-box everything. Use verbs in slide titles (e.g., "Build Your First...", "Reflect on...").

### Color Emphasis

- **Primary** (`--brand-primary`): Concept/teach slide titles, framework diagram heading.
- **Secondary** (`--brand-secondary`): Exercise slide titles (differentiate "do" from "learn" visually).
- **Accent** (`--brand-accent`): Debrief/reflection slide titles, time indicators, action verbs in bullets.
- **Weight distribution:** 40% primary (teach), 35% secondary (do), 25% accent (reflect).

### Slide Density Rules

| Slide | Word Target | Notes |
|---|---|---|
| Title (1) | 10-20 words | Workshop name, facilitator, logistics (Wi-Fi, schedule). |
| Objectives (2) | 30-45 words | 3-4 outcomes starting with "By the end, you will be able to..." |
| Agenda (3) | 40-60 words | Time-blocked schedule. Include break times. |
| Framework (4) | 40-60 words | The model being taught. Use comparison type for visual structure. |
| Concept slides (5, 8, 11) | 35-50 words each | Focused explanation. One idea per slide. |
| Exercise slides (6, 9, 12) | 40-60 words each | Step-by-step instructions. Must include time limit. |
| Debrief slides (7, 10, 13) | 20-35 words each | 2-3 open-ended reflection questions. Less is more. |
| Synthesis (14) | 40-55 words | How concepts connect. Use comparison type for before/after. |
| Action Plan (15) | 30-50 words | Concrete next steps with resources. |

### Slide-by-Slide Structure

#### Slide 1 — Title
**Purpose:** Welcome participants, set logistics expectations.
**SlideSpec type:** `title`

```json
{
  "title": "{{workshop_name}}",
  "type": "title"
}
```

**AI generation instructions:** Use the workshop name from the brief as the title. The brand template renders the business name and tagline automatically. If the brief mentions a facilitator name, duration, or location, append as a subtitle string to the title (e.g., "React Hooks Workshop | Maria Garcia | 3 hours").

---

#### Slide 2 — Objectives
**Purpose:** Outcome-driven expectations. Participants know what they will be able to DO.
**SlideSpec type:** `content`

```json
{
  "title": "By the End of This Workshop",
  "type": "content",
  "bullets": [
    "You will be able to: {{skill_1}}",
    "You will be able to: {{skill_2}}",
    "You will be able to: {{skill_3}}",
    "You will be able to: {{skill_4}}"
  ]
}
```

**AI generation instructions:** Extract 3-4 concrete skills from the brief. Each must be observable and measurable (use Bloom's taxonomy action verbs: create, analyze, evaluate, apply). Avoid "understand" or "know" -- those are not observable. Prefix every bullet with "You will be able to:" for consistent structure.

---

#### Slide 3 — Agenda with Time Blocks
**Purpose:** Structured schedule so participants can pace themselves.
**SlideSpec type:** `content`

```json
{
  "title": "Today's Agenda",
  "type": "content",
  "bullets": [
    "{{time_1}} — Welcome & Framework",
    "{{time_2}} — Concept 1 + Exercise",
    "{{time_3}} — Break",
    "{{time_4}} — Concept 2 + Exercise",
    "{{time_5}} — Concept 3 + Exercise",
    "{{time_6}} — Synthesis & Action Plan"
  ]
}
```

**AI generation instructions:** Create a realistic time-blocked schedule based on the workshop duration in the brief (default to 3 hours if unspecified). Allocate roughly: 15 min welcome/framework, 3x 35-40 min teach/do/reflect cycles, 10-15 min breaks, 15 min synthesis. Include at least one break. Use 24h or 12h time format matching the brief's language.

---

#### Slide 4 — Framework Introduction
**Purpose:** Present the overarching model or framework that ties the three concepts together.
**SlideSpec type:** `comparison`

```json
{
  "title": "The {{framework_name}} Framework",
  "type": "comparison",
  "leftColumn": [
    "{{pillar_1}}",
    "{{pillar_2}}",
    "{{pillar_3}}"
  ],
  "rightColumn": [
    "{{pillar_1_description}}",
    "{{pillar_2_description}}",
    "{{pillar_3_description}}"
  ]
}
```

**AI generation instructions:** Identify or construct a framework that organizes the workshop's three main concepts. The left column contains the pillar/component names, the right column contains one-sentence descriptions. If the brief does not name a framework, create one with an appropriate acronym or metaphor. The framework must directly map to the three concept/exercise cycles that follow.

---

#### Slide 5 — Concept 1 (Teach)
**Purpose:** Teach the first concept or skill.
**SlideSpec type:** `content`

```json
{
  "title": "{{concept_1_name}}",
  "type": "content",
  "bullets": [
    "{{what_it_is}}",
    "{{why_it_matters_here}}",
    "{{key_principle_or_rule}}",
    "{{quick_example}}"
  ]
}
```

**AI generation instructions:** Present the first pillar of the framework. Keep it focused on one idea. Bullet 4 should be a brief, concrete example that previews the exercise. Each bullet under 18 words.

---

#### Slide 6 — Exercise 1 (Do)
**Purpose:** Hands-on activity applying Concept 1.
**SlideSpec type:** `content`

```json
{
  "title": "Exercise: {{exercise_1_name}}",
  "type": "content",
  "bullets": [
    "Step 1: {{instruction_1}}",
    "Step 2: {{instruction_2}}",
    "Step 3: {{instruction_3}}",
    "Time: {{duration}} minutes | Format: {{individual_pair_group}}"
  ]
}
```

**AI generation instructions:** Design a concrete exercise that directly applies Concept 1. Instructions must be sequential and specific (not "think about X" but "write down 3 examples of X"). Include exact time limit (5-15 minutes) and format (individual, pair, or small group). The deliverable must be tangible: a list, a sketch, a short document, a prototype.

---

#### Slide 7 — Debrief 1 (Reflect)
**Purpose:** Process what was learned in Exercise 1.
**SlideSpec type:** `content`

```json
{
  "title": "Reflect",
  "type": "content",
  "bullets": [
    "{{reflection_question_1}}",
    "{{reflection_question_2}}",
    "{{connection_to_next_concept}}"
  ]
}
```

**AI generation instructions:** Write 2 open-ended reflection questions (start with "What", "How", or "Why" -- never yes/no). The third bullet should bridge to the next concept ("This leads us to..."). Keep questions simple enough to discuss in 3-5 minutes.

---

#### Slide 8 — Concept 2 (Teach)
**Purpose:** Teach the second concept or skill.
**SlideSpec type:** `content`

```json
{
  "title": "{{concept_2_name}}",
  "type": "content",
  "bullets": [
    "{{what_it_is}}",
    "{{how_it_builds_on_concept_1}}",
    "{{key_principle_or_rule}}",
    "{{quick_example}}"
  ]
}
```

**AI generation instructions:** Present the second pillar. Bullet 2 must explicitly connect back to Concept 1 to show progression. Otherwise follows the same pattern as Slide 5.

---

#### Slide 9 — Exercise 2 (Do)
**Purpose:** Hands-on activity applying Concept 2, ideally building on Exercise 1 output.
**SlideSpec type:** `content`

```json
{
  "title": "Exercise: {{exercise_2_name}}",
  "type": "content",
  "bullets": [
    "Step 1: {{instruction_1}}",
    "Step 2: {{instruction_2}}",
    "Step 3: {{instruction_3}}",
    "Time: {{duration}} minutes | Format: {{individual_pair_group}}"
  ]
}
```

**AI generation instructions:** Increase complexity compared to Exercise 1. Ideally, participants build on their Exercise 1 output. If the brief suggests collaboration, make this a pair exercise. Same structure as Slide 6.

---

#### Slide 10 — Debrief 2 (Reflect)
**Purpose:** Process what was learned in Exercise 2.
**SlideSpec type:** `content`

```json
{
  "title": "Reflect",
  "type": "content",
  "bullets": [
    "{{reflection_question_1}}",
    "{{reflection_question_2}}",
    "{{connection_to_next_concept}}"
  ]
}
```

**AI generation instructions:** Same structure as Slide 7. Questions should probe deeper than Debrief 1, since participants have more context. Bridge to Concept 3.

---

#### Slide 11 — Concept 3 (Teach)
**Purpose:** Teach the third and most advanced concept.
**SlideSpec type:** `content`

```json
{
  "title": "{{concept_3_name}}",
  "type": "content",
  "bullets": [
    "{{what_it_is}}",
    "{{how_it_integrates_concepts_1_and_2}}",
    "{{key_principle_or_rule}}",
    "{{quick_example}}"
  ]
}
```

**AI generation instructions:** This is the capstone concept. Bullet 2 must show how Concepts 1 and 2 combine or are transformed by Concept 3. This slide should feel like the "aha moment" of the workshop.

---

#### Slide 12 — Exercise 3 (Do)
**Purpose:** Culminating activity that integrates all three concepts.
**SlideSpec type:** `content`

```json
{
  "title": "Exercise: {{exercise_3_name}}",
  "type": "content",
  "bullets": [
    "Step 1: {{instruction_1}}",
    "Step 2: {{instruction_2}}",
    "Step 3: {{instruction_3}}",
    "Step 4: {{instruction_4}}",
    "Time: {{duration}} minutes | Format: {{individual_pair_group}}"
  ]
}
```

**AI generation instructions:** This is the most ambitious exercise. It should integrate all three concepts into one deliverable. Allow more time (10-20 minutes). Consider group format for this one. Add a Step 4 if needed. The output should be something participants can take home.

---

#### Slide 13 — Debrief 3 (Reflect)
**Purpose:** Final reflection on the full learning arc.
**SlideSpec type:** `content`

```json
{
  "title": "Reflect",
  "type": "content",
  "bullets": [
    "{{big_picture_question}}",
    "{{application_question}}",
    "{{share_prompt}}"
  ]
}
```

**AI generation instructions:** Final reflection should be meta-level: "How has your understanding changed?" type questions. The share prompt should ask one participant to present their Exercise 3 result briefly.

---

#### Slide 14 — Synthesis
**Purpose:** Show how all three concepts connect into a coherent whole.
**SlideSpec type:** `comparison`

```json
{
  "title": "Putting It All Together",
  "type": "comparison",
  "leftColumn": [
    "Before This Workshop",
    "{{misconception_1}}",
    "{{misconception_2}}",
    "{{misconception_3}}"
  ],
  "rightColumn": [
    "After This Workshop",
    "{{new_understanding_1}}",
    "{{new_understanding_2}}",
    "{{new_understanding_3}}"
  ]
}
```

**AI generation instructions:** Use a before/after structure. The left column shows common misconceptions or starting-state thinking. The right column shows the new understanding gained through the workshop. Each row should map to one of the three concepts.

---

#### Slide 15 — Action Plan
**Purpose:** Bridge from workshop to real-world application.
**SlideSpec type:** `cta`

```json
{
  "title": "Your Action Plan",
  "type": "cta",
  "ctaText": "{{primary_action}}"
}
```

**AI generation instructions:** The `ctaText` should be a single, specific next step participants can take within 48 hours (e.g., "Apply the framework to one real project this week"). If the brief mentions follow-up resources, include them. The brand contact info is rendered automatically by the template.

---

### Template Array (for `DECK_TEMPLATES`)

```typescript
'workshop': [
  { title: 'Workshop Name', type: 'title' },
  { title: 'By the End of This Workshop', type: 'content', bullets: ['You will be able to: Skill 1', 'You will be able to: Skill 2', 'You will be able to: Skill 3', 'You will be able to: Skill 4'] },
  { title: "Today's Agenda", type: 'content', bullets: ['0:00 — Welcome & Framework', '0:15 — Concept 1 + Exercise', '1:00 — Break', '1:10 — Concept 2 + Exercise', '1:50 — Concept 3 + Exercise', '2:30 — Synthesis & Action Plan'] },
  { title: 'The Framework', type: 'comparison', leftColumn: ['Pillar 1', 'Pillar 2', 'Pillar 3'], rightColumn: ['Description 1', 'Description 2', 'Description 3'] },
  { title: 'Concept 1', type: 'content', bullets: ['What it is', 'Why it matters', 'Key principle', 'Quick example'] },
  { title: 'Exercise: Activity 1', type: 'content', bullets: ['Step 1: Instruction', 'Step 2: Instruction', 'Step 3: Instruction', 'Time: 10 minutes | Format: Individual'] },
  { title: 'Reflect', type: 'content', bullets: ['Reflection question 1', 'Reflection question 2', 'This leads us to...'] },
  { title: 'Concept 2', type: 'content', bullets: ['What it is', 'How it builds on Concept 1', 'Key principle', 'Quick example'] },
  { title: 'Exercise: Activity 2', type: 'content', bullets: ['Step 1: Instruction', 'Step 2: Instruction', 'Step 3: Instruction', 'Time: 10 minutes | Format: Pairs'] },
  { title: 'Reflect', type: 'content', bullets: ['Reflection question 1', 'Reflection question 2', 'This leads us to...'] },
  { title: 'Concept 3', type: 'content', bullets: ['What it is', 'How it integrates Concepts 1 & 2', 'Key principle', 'Quick example'] },
  { title: 'Exercise: Activity 3', type: 'content', bullets: ['Step 1: Instruction', 'Step 2: Instruction', 'Step 3: Instruction', 'Step 4: Instruction', 'Time: 15 minutes | Format: Groups'] },
  { title: 'Reflect', type: 'content', bullets: ['Big picture question', 'Application question', 'Share your result'] },
  { title: 'Putting It All Together', type: 'comparison', leftColumn: ['Before This Workshop', 'Old thinking 1', 'Old thinking 2', 'Old thinking 3'], rightColumn: ['After This Workshop', 'New understanding 1', 'New understanding 2', 'New understanding 3'] },
  { title: 'Your Action Plan', type: 'cta', ctaText: 'Apply the framework to one real project this week' },
]
```

---

## Template 3: Internal Strategy Deck

**Template key:** `internal-strategy`
**Slide count:** 10
**Use case:** Team alignment, quarterly planning, strategy update
**Audience:** Internal team, leadership, board
**Narrative arc:** Context -> Analysis -> Strategy -> Execution -> Metrics

### Tone Guide

- **Register:** Formal and concise. Every word earns its place. This is a decision-making document.
- **Voice:** First person plural ("we", "our position", "our recommendation"). Objective and data-driven.
- **Energy:** Measured and deliberate. No hype. Confidence comes from evidence, not enthusiasm.
- **Language quirks:** Use "the recommendation is" not "we think". Quantify wherever possible. Avoid adjectives without data to back them up.

### Color Emphasis

- **Primary** (`--brand-primary`): Slide titles, recommended option highlight, KPI target values.
- **Secondary** (`--brand-secondary`): Analysis labels, comparison table headers, timeline phase markers.
- **Accent** (`--brand-accent`): Alert/attention items (risks, resource gaps, decisions needed), executive summary highlights.
- **Weight distribution:** 50% primary, 30% secondary, 20% accent.

### Slide Density Rules

| Slide | Word Target | Notes |
|---|---|---|
| Title (1) | 8-15 words | Strategy topic + date + "CONFIDENTIAL" marker. |
| Executive Summary (2) | 40-60 words | 3-4 key points. Every word counts. |
| Current State (3) | 40-55 words | Metrics-heavy. Use stats type. 3-4 KPIs. |
| Market Analysis (4) | 45-65 words | Comparison table with 4-5 factors. |
| Strategic Options (5) | 50-70 words | 2-3 options with brief pros/cons. |
| Recommended Strategy (6) | 40-55 words | One clear recommendation with rationale. |
| Execution Roadmap (7) | 45-60 words | 4-6 milestones with owners. |
| Resource Requirements (8) | 35-50 words | Budget, team, tools. Use stats type. |
| Success Metrics (9) | 35-50 words | 3-5 KPIs with targets. Stats type. |
| Next Steps (10) | 25-40 words | Immediate actions + decisions needed. |

### Slide-by-Slide Structure

#### Slide 1 — Title
**Purpose:** Identify the strategy topic, date, and confidentiality.
**SlideSpec type:** `title`

```json
{
  "title": "{{strategy_topic}} | {{date}} | CONFIDENTIAL",
  "type": "title"
}
```

**AI generation instructions:** Title format: "{{Strategy Topic}} | {{Quarter/Date}} | CONFIDENTIAL". Always include the confidential marker for internal strategy decks. Use the current quarter and year if the brief does not specify a date.

---

#### Slide 2 — Executive Summary
**Purpose:** The "newspaper headline." If someone only reads one slide, this is it.
**SlideSpec type:** `content`

```json
{
  "title": "Executive Summary",
  "type": "content",
  "bullets": [
    "{{headline_finding_1}}",
    "{{headline_finding_2}}",
    "{{headline_recommendation}}",
    "{{headline_ask}}"
  ]
}
```

**AI generation instructions:** Distill the entire deck into 3-4 bullet points. Bullet 1-2: key findings or situation. Bullet 3: the recommendation. Bullet 4: what is being asked of the audience (approval, budget, decision). Each bullet must be self-contained and under 18 words. Write this slide LAST after generating all other slides, then reorder it to position 2.

---

#### Slide 3 — Current State
**Purpose:** Where we are now, grounded in data.
**SlideSpec type:** `stats`

```json
{
  "title": "Current State",
  "type": "stats",
  "stats": [
    { "label": "{{metric_1_name}}", "value": "{{metric_1_current}}" },
    { "label": "{{metric_2_name}}", "value": "{{metric_2_current}}" },
    { "label": "{{metric_3_name}}", "value": "{{metric_3_current}}" },
    { "label": "{{metric_4_name}}", "value": "{{metric_4_current}}" }
  ]
}
```

**AI generation instructions:** Extract 3-4 key performance indicators from the brief that describe the current situation. Use the most relevant metrics for the strategy domain (revenue, churn, market share, NPS, burn rate, etc.). Values should include units and direction indicators where possible (e.g., "$2.3M", "4.2% MoM", "NPS 42").

---

#### Slide 4 — Market / Competitive Analysis
**Purpose:** External factors that inform the strategy.
**SlideSpec type:** `comparison`

```json
{
  "title": "Market & Competitive Landscape",
  "type": "comparison",
  "leftColumn": [
    "{{factor_1}}",
    "{{factor_2}}",
    "{{factor_3}}",
    "{{factor_4}}"
  ],
  "rightColumn": [
    "{{our_position_1}}",
    "{{our_position_2}}",
    "{{our_position_3}}",
    "{{our_position_4}}"
  ]
}
```

**AI generation instructions:** Left column: market factors, competitor strengths, or industry trends. Right column: our current position or response to each factor. If the brief focuses on internal strategy (no competitors), reframe as "Challenges" vs. "Our Strengths" or "Risks" vs. "Mitigations". Keep each cell under 10 words.

---

#### Slide 5 — Strategic Options
**Purpose:** Present 2-3 options the team could pursue with trade-offs.
**SlideSpec type:** `comparison`

```json
{
  "title": "Strategic Options",
  "type": "comparison",
  "leftColumn": [
    "Option A: {{name}}",
    "Pro: {{advantage}}",
    "Con: {{disadvantage}}",
    "Option B: {{name}}",
    "Pro: {{advantage}}",
    "Con: {{disadvantage}}"
  ],
  "rightColumn": [
    "Option C: {{name}}",
    "Pro: {{advantage}}",
    "Con: {{disadvantage}}",
    "Recommendation:",
    "{{recommended_option}}",
    "{{one_line_rationale}}"
  ]
}
```

**AI generation instructions:** Present 2-3 genuine strategic options, not strawmen. Each option needs at least one pro and one con. Use the comparison layout to create visual structure. The recommendation preview in the right column bottom foreshadows slide 6. If the brief clearly favors one direction, still present alternatives to show rigor.

---

#### Slide 6 — Recommended Strategy
**Purpose:** Clear articulation of the chosen direction.
**SlideSpec type:** `content`

```json
{
  "title": "Recommended: {{strategy_name}}",
  "type": "content",
  "bullets": [
    "What: {{one_sentence_description}}",
    "Why: {{primary_rationale}}",
    "Why now: {{urgency_factor}}",
    "Expected impact: {{projected_outcome}}"
  ]
}
```

**AI generation instructions:** Structure as What/Why/Why Now/Impact. Each bullet is a single declarative sentence. "Why now" is critical -- it should answer why this cannot wait. Expected impact should be quantified if the brief provides data. This is the most important slide in the deck; it must be unambiguous.

---

#### Slide 7 — Execution Roadmap
**Purpose:** How the strategy translates into action.
**SlideSpec type:** `content`

```json
{
  "title": "Execution Roadmap",
  "type": "content",
  "bullets": [
    "{{phase_1_timeframe}}: {{milestone_1}} — Owner: {{owner_1}}",
    "{{phase_2_timeframe}}: {{milestone_2}} — Owner: {{owner_2}}",
    "{{phase_3_timeframe}}: {{milestone_3}} — Owner: {{owner_3}}",
    "{{phase_4_timeframe}}: {{milestone_4}} — Owner: {{owner_4}}"
  ]
}
```

**AI generation instructions:** Break the strategy into 4-6 time-phased milestones. Each milestone has a timeframe (e.g., "Week 1-2", "Q2", "Month 1"), a deliverable, and an owner. If the brief does not specify owners, use role titles (e.g., "Product Lead", "Engineering"). Milestones should be concrete and verifiable.

---

#### Slide 8 — Resource Requirements
**Purpose:** What is needed to execute the strategy.
**SlideSpec type:** `stats`

```json
{
  "title": "Resource Requirements",
  "type": "stats",
  "stats": [
    { "label": "Budget", "value": "{{budget_amount}}" },
    { "label": "Team", "value": "{{headcount_or_roles}}" },
    { "label": "Tools", "value": "{{key_tools_or_systems}}" },
    { "label": "Timeline", "value": "{{total_duration}}" }
  ]
}
```

**AI generation instructions:** Quantify resource needs across 3-4 dimensions. Always include budget (even if estimated as a range). Team can be headcount or specific roles needed. Tools should name specific platforms or systems. Timeline is the total execution duration. If the brief lacks specifics, use reasonable estimates and mark them as "est." in the value.

---

#### Slide 9 — Success Metrics
**Purpose:** How we will know if the strategy is working.
**SlideSpec type:** `stats`

```json
{
  "title": "Success Metrics",
  "type": "stats",
  "stats": [
    { "label": "{{kpi_1_name}}", "value": "Target: {{kpi_1_target}}" },
    { "label": "{{kpi_2_name}}", "value": "Target: {{kpi_2_target}}" },
    { "label": "{{kpi_3_name}}", "value": "Target: {{kpi_3_target}}" }
  ]
}
```

**AI generation instructions:** Define 3-5 KPIs that directly measure the strategy's success. Each must have a specific target value and implied measurement timeframe. Metrics should connect back to the "Expected impact" from slide 6. Prefer leading indicators (actions) over lagging indicators (results) for at least one metric.

---

#### Slide 10 — Next Steps & Asks
**Purpose:** Immediate actions and decisions needed from the audience.
**SlideSpec type:** `cta`

```json
{
  "title": "Next Steps & Decisions Needed",
  "type": "cta",
  "ctaText": "{{primary_ask}}"
}
```

**AI generation instructions:** The `ctaText` should be the single most important ask (e.g., "Approve $50K budget for Q2 pilot", "Greenlight hiring 2 engineers"). Be specific and actionable. Do not use vague CTAs like "Let's discuss." The title should signal that a decision is being requested, not just information shared.

---

### Template Array (for `DECK_TEMPLATES`)

```typescript
'internal-strategy': [
  { title: 'Strategy Topic | Q1 2026 | CONFIDENTIAL', type: 'title' },
  { title: 'Executive Summary', type: 'content', bullets: ['Key finding 1', 'Key finding 2', 'Recommendation summary', 'The ask'] },
  { title: 'Current State', type: 'stats', stats: [{ label: 'Metric 1', value: 'Current' }, { label: 'Metric 2', value: 'Current' }, { label: 'Metric 3', value: 'Current' }, { label: 'Metric 4', value: 'Current' }] },
  { title: 'Market & Competitive Landscape', type: 'comparison', leftColumn: ['Market factor 1', 'Market factor 2', 'Market factor 3', 'Market factor 4'], rightColumn: ['Our position 1', 'Our position 2', 'Our position 3', 'Our position 4'] },
  { title: 'Strategic Options', type: 'comparison', leftColumn: ['Option A: Name', 'Pro: Advantage', 'Con: Disadvantage', 'Option B: Name', 'Pro: Advantage', 'Con: Disadvantage'], rightColumn: ['Option C: Name', 'Pro: Advantage', 'Con: Disadvantage', 'Recommendation:', 'Chosen option', 'Rationale'] },
  { title: 'Recommended: Strategy Name', type: 'content', bullets: ['What: Description', 'Why: Rationale', 'Why now: Urgency', 'Expected impact: Outcome'] },
  { title: 'Execution Roadmap', type: 'content', bullets: ['Phase 1: Milestone — Owner', 'Phase 2: Milestone — Owner', 'Phase 3: Milestone — Owner', 'Phase 4: Milestone — Owner'] },
  { title: 'Resource Requirements', type: 'stats', stats: [{ label: 'Budget', value: '$X' }, { label: 'Team', value: 'X people' }, { label: 'Tools', value: 'Key systems' }, { label: 'Timeline', value: 'X months' }] },
  { title: 'Success Metrics', type: 'stats', stats: [{ label: 'KPI 1', value: 'Target: X' }, { label: 'KPI 2', value: 'Target: X' }, { label: 'KPI 3', value: 'Target: X' }] },
  { title: 'Next Steps & Decisions Needed', type: 'cta', ctaText: 'Approve budget and timeline for execution' },
]
```

---

## Template 4: Client Presentation

**Template key:** `client-presentation`
**Slide count:** 12
**Use case:** Client pitch, project proposal, partnership proposal
**Audience:** Potential or existing clients/partners
**Narrative arc:** Empathy -> Credibility -> Solution -> Value -> Commitment

### Tone Guide

- **Register:** Professional but warm. Confident without being aggressive. This is a conversation, not a sales pitch.
- **Voice:** Second person focused on the client ("your challenges", "your team", "your results"). Use "we" only when describing your approach or team.
- **Energy:** Builds steadily. Opens with empathy (low pressure), builds through credibility and solution, peaks at investment/value, and closes with clear next steps.
- **Language quirks:** Mirror the client's industry terminology (extract from brief). Never say "buy" or "cost" -- use "invest" and "investment". Frame everything as outcomes, not features.

### Color Emphasis

- **Primary** (`--brand-primary`): Slide titles, your brand elements, solution headings, CTA button.
- **Secondary** (`--brand-secondary`): Client-focused slide accents (slides 2-4), team credentials, timeline markers.
- **Accent** (`--brand-accent`): Key stats in case study, investment highlights, differentiator emphasis.
- **Weight distribution:** 50% primary, 30% secondary, 20% accent.

### Slide Density Rules

| Slide | Word Target | Notes |
|---|---|---|
| Title (1) | 6-12 words | Clean. Client name optional. No clutter. |
| Their World (2) | 35-50 words | Show you did your homework. 3-4 industry insights. |
| The Problem (3) | 35-50 words | Use their language. 3-4 specific pain points. |
| Impact of Inaction (4) | 25-40 words | Stark. 2-3 consequences. Let numbers speak. |
| Our Approach (5) | 35-50 words | Methodology, not features. 3-4 steps. |
| Solution Overview (6) | 40-55 words | Specific deliverables. 4-5 items. |
| Case Study (7) | 30-45 words | Stats-driven. 3-4 metrics. Similar client. |
| Your Investment (8) | 30-45 words | Value framing. 3 tiers or components. |
| Timeline (9) | 35-50 words | 3-5 phases with deliverables. |
| The Team (10) | 30-45 words | 2-3 team members with credentials. |
| Why Us (11) | 35-50 words | Competitive comparison. 4-5 differentiators. |
| Next Steps (12) | 15-25 words | One clear CTA. Make it easy to say yes. |

### Slide-by-Slide Structure

#### Slide 1 — Title
**Purpose:** Clean, professional first impression.
**SlideSpec type:** `title`

```json
{
  "title": "{{presentation_title}}",
  "type": "title"
}
```

**AI generation instructions:** Keep the title client-focused if possible (e.g., "Growth Partnership Proposal for {{client_name}}" or "{{project_name}}: A Proposal"). Do not front-load your company name; the brand template handles that. If the brief mentions a client name, include it. If not, use a benefit-driven title.

---

#### Slide 2 — Their World
**Purpose:** Demonstrate empathy and research. Show you understand their industry.
**SlideSpec type:** `content`

```json
{
  "title": "Understanding {{client_industry_or_name}}",
  "type": "content",
  "bullets": [
    "{{industry_trend_or_insight_1}}",
    "{{industry_trend_or_insight_2}}",
    "{{industry_trend_or_insight_3}}",
    "{{how_this_affects_them}}"
  ]
}
```

**AI generation instructions:** Research or infer industry context from the brief. Bullet 1-3: objective industry trends, market shifts, or regulatory changes relevant to the client. Bullet 4: how these trends specifically affect the client or their segment. Use language that shows insight, not just surface research. Avoid anything the client would consider obvious.

---

#### Slide 3 — The Problem
**Purpose:** Name the specific pain points. Show you understand their struggle.
**SlideSpec type:** `content`

```json
{
  "title": "The Challenges You're Facing",
  "type": "content",
  "bullets": [
    "{{pain_point_1}}",
    "{{pain_point_2}}",
    "{{pain_point_3}}",
    "{{underlying_root_cause}}"
  ]
}
```

**AI generation instructions:** Frame 3-4 challenges from the client's perspective. Use "you" language. Bullet 1-3: specific, observable symptoms. Bullet 4: the root cause that connects them. Pain points should come directly from the brief or be logically inferred from the industry context. Use the client's terminology, not your internal jargon.

---

#### Slide 4 — Impact of Inaction
**Purpose:** Create urgency without being manipulative. Quantify the cost of the status quo.
**SlideSpec type:** `stats`

```json
{
  "title": "The Cost of Waiting",
  "type": "stats",
  "stats": [
    { "label": "{{impact_area_1}}", "value": "{{quantified_cost_1}}" },
    { "label": "{{impact_area_2}}", "value": "{{quantified_cost_2}}" },
    { "label": "{{impact_area_3}}", "value": "{{quantified_cost_3}}" }
  ]
}
```

**AI generation instructions:** Quantify what the problems from slide 3 cost in time, money, or opportunity. Use credible estimates. If the brief does not provide data, use industry benchmarks or logical projections. Frame as losses or missed opportunities (e.g., "$120K/year in manual processing", "15 hours/week of engineering time", "3-month delay to market"). Keep to 2-3 stats for maximum impact.

---

#### Slide 5 — Our Approach
**Purpose:** Present your methodology. Show HOW you work, not just what you deliver.
**SlideSpec type:** `content`

```json
{
  "title": "Our Approach",
  "type": "content",
  "bullets": [
    "Phase 1: {{methodology_step_1}}",
    "Phase 2: {{methodology_step_2}}",
    "Phase 3: {{methodology_step_3}}",
    "Phase 4: {{methodology_step_4}}"
  ]
}
```

**AI generation instructions:** Outline 3-4 phases of your engagement methodology. Each phase should be a clear step with an implied deliverable. Use verbs that show rigor (Discover, Architect, Build, Optimize) rather than generic terms (Plan, Do, Check). If the brief describes a specific methodology, use it. Otherwise, construct a logical phased approach for the project type.

---

#### Slide 6 — Solution Overview
**Purpose:** Specific deliverables and features the client will receive.
**SlideSpec type:** `content`

```json
{
  "title": "What You'll Get",
  "type": "content",
  "bullets": [
    "{{deliverable_1}}",
    "{{deliverable_2}}",
    "{{deliverable_3}}",
    "{{deliverable_4}}",
    "{{deliverable_5}}"
  ]
}
```

**AI generation instructions:** List 4-5 concrete deliverables or solution components. Each must be tangible and verifiable ("Custom analytics dashboard" not "Better insights"). Map deliverables back to the pain points from slide 3 -- every pain point should have a corresponding solution element. Frame as outcomes where possible ("Automated monthly reports" not "Report generation module").

---

#### Slide 7 — Case Study / Social Proof
**Purpose:** Show that you have done this before successfully. Build trust with evidence.
**SlideSpec type:** `stats`

```json
{
  "title": "Case Study: {{similar_client_or_project}}",
  "type": "stats",
  "stats": [
    { "label": "{{result_metric_1}}", "value": "{{result_value_1}}" },
    { "label": "{{result_metric_2}}", "value": "{{result_value_2}}" },
    { "label": "{{result_metric_3}}", "value": "{{result_value_3}}" }
  ]
}
```

**AI generation instructions:** Choose a case study from the brief that is most similar to the client's situation (same industry, similar size, analogous problem). If no case study is in the brief, construct a realistic composite example and label it as a representative engagement. Show 3 quantified results that directly relate to the metrics from slide 4 (impact of inaction). The case study should implicitly answer: "if they could do it, so can you."

---

#### Slide 8 — Your Investment
**Purpose:** Frame pricing as value, not cost.
**SlideSpec type:** `stats`

```json
{
  "title": "Your Investment",
  "type": "stats",
  "stats": [
    { "label": "{{tier_or_component_1}}", "value": "{{price_1}}" },
    { "label": "{{tier_or_component_2}}", "value": "{{price_2}}" },
    { "label": "{{tier_or_component_3}}", "value": "{{price_3}}" }
  ]
}
```

**AI generation instructions:** Present pricing in 2-3 tiers or components. Use value-oriented labels (not "Basic/Pro/Enterprise" but names that reflect outcomes). If the brief provides specific pricing, use it. If not, use placeholder structure with clear labels. Always position the recommended tier in the middle. Never use the word "cost" -- use "investment." Consider adding ROI context by referencing the Impact of Inaction numbers from slide 4.

---

#### Slide 9 — Timeline
**Purpose:** Show the project cadence with clear deliverables per phase.
**SlideSpec type:** `content`

```json
{
  "title": "Project Timeline",
  "type": "content",
  "bullets": [
    "{{phase_1_timeframe}}: {{deliverable_1}}",
    "{{phase_2_timeframe}}: {{deliverable_2}}",
    "{{phase_3_timeframe}}: {{deliverable_3}}",
    "{{phase_4_timeframe}}: {{deliverable_4}}",
    "{{phase_5_timeframe}}: {{deliverable_5}}"
  ]
}
```

**AI generation instructions:** Align phases with the methodology from slide 5. Each timeline entry has a timeframe and a deliverable. Include a kickoff milestone and a launch/handoff milestone. If the brief specifies a total duration, work backward to create realistic phases. Default to a 6-12 week project timeline unless the brief indicates otherwise. Include a checkpoint or review moment in the middle.

---

#### Slide 10 — The Team
**Purpose:** Humanize your company. Show who the client will work with.
**SlideSpec type:** `content`

```json
{
  "title": "Your Team",
  "type": "content",
  "bullets": [
    "{{name_1}} — {{role_1}}: {{credential_1}}",
    "{{name_2}} — {{role_2}}: {{credential_2}}",
    "{{name_3}} — {{role_3}}: {{credential_3}}"
  ]
}
```

**AI generation instructions:** List 2-4 team members who will be directly involved. For each: name, role on this project, and one relevant credential (years of experience, past client, certification). If the brief names team members, use them. If not, use role-based placeholders with realistic credentials. Lead with the primary point of contact.

---

#### Slide 11 — Why Us
**Purpose:** Differentiate from competitors with a structured comparison.
**SlideSpec type:** `comparison`

```json
{
  "title": "Why {{company_name}}",
  "type": "comparison",
  "leftColumn": [
    "{{differentiator_1}}",
    "{{differentiator_2}}",
    "{{differentiator_3}}",
    "{{differentiator_4}}"
  ],
  "rightColumn": [
    "{{evidence_or_proof_1}}",
    "{{evidence_or_proof_2}}",
    "{{evidence_or_proof_3}}",
    "{{evidence_or_proof_4}}"
  ]
}
```

**AI generation instructions:** Left column: differentiators (what makes you unique). Right column: evidence or proof for each claim. Differentiators should be specific and verifiable, not vague ("24/7 support with <2hr response time" not "Great customer service"). If the brief mentions competitors, subtly contrast without naming them. Focus on 3-5 differentiators that are most relevant to THIS client's priorities.

---

#### Slide 12 — Next Steps
**Purpose:** Make it easy for the client to say yes. One clear action.
**SlideSpec type:** `cta`

```json
{
  "title": "Let's Get Started",
  "type": "cta",
  "ctaText": "{{clear_next_action}}"
}
```

**AI generation instructions:** The `ctaText` should be a single, low-friction next step (e.g., "Schedule a 30-minute kickoff call", "Reply to confirm the proposal scope"). Avoid high-commitment CTAs ("Sign the contract today"). The brand template renders contact info automatically. Make the path forward obvious and easy.

---

### Template Array (for `DECK_TEMPLATES`)

```typescript
'client-presentation': [
  { title: 'Proposal Title', type: 'title' },
  { title: 'Understanding Your World', type: 'content', bullets: ['Industry trend 1', 'Industry trend 2', 'Industry trend 3', 'How this affects you'] },
  { title: 'The Challenges You\'re Facing', type: 'content', bullets: ['Pain point 1', 'Pain point 2', 'Pain point 3', 'Root cause'] },
  { title: 'The Cost of Waiting', type: 'stats', stats: [{ label: 'Impact area 1', value: 'Cost 1' }, { label: 'Impact area 2', value: 'Cost 2' }, { label: 'Impact area 3', value: 'Cost 3' }] },
  { title: 'Our Approach', type: 'content', bullets: ['Phase 1: Discovery', 'Phase 2: Architecture', 'Phase 3: Build', 'Phase 4: Optimize'] },
  { title: 'What You\'ll Get', type: 'content', bullets: ['Deliverable 1', 'Deliverable 2', 'Deliverable 3', 'Deliverable 4', 'Deliverable 5'] },
  { title: 'Case Study: Similar Client', type: 'stats', stats: [{ label: 'Result 1', value: 'Metric 1' }, { label: 'Result 2', value: 'Metric 2' }, { label: 'Result 3', value: 'Metric 3' }] },
  { title: 'Your Investment', type: 'stats', stats: [{ label: 'Tier 1', value: '$X' }, { label: 'Tier 2', value: '$X' }, { label: 'Tier 3', value: '$X' }] },
  { title: 'Project Timeline', type: 'content', bullets: ['Week 1-2: Discovery', 'Week 3-4: Architecture', 'Week 5-8: Build', 'Week 9-10: Testing', 'Week 11-12: Launch'] },
  { title: 'Your Team', type: 'content', bullets: ['Name — Role: Credential', 'Name — Role: Credential', 'Name — Role: Credential'] },
  { title: 'Why Us', type: 'comparison', leftColumn: ['Differentiator 1', 'Differentiator 2', 'Differentiator 3', 'Differentiator 4'], rightColumn: ['Evidence 1', 'Evidence 2', 'Evidence 3', 'Evidence 4'] },
  { title: "Let's Get Started", type: 'cta', ctaText: 'Schedule a 30-minute kickoff call' },
]
```

---

## Slide Density Rules (Global)

These rules apply across all templates. Template-specific tables above may override for specific slides.

| SlideSpec Type | Max Words | Max Items | Guidance |
|---|---|---|---|
| `title` | 15 | n/a | Topic only. Let white space dominate. |
| `content` | 60 | 5 bullets | Each bullet: 8-18 words. No paragraphs in bullets. |
| `stats` | 40 | 4 stats | Label: 1-3 words. Value: 1-5 characters ideally. |
| `comparison` | 70 | 6 per column | Each cell: 3-10 words. Columns must be balanced in length. |
| `quote` | 35 | 1 quote | Quote: max 25 words. Attribution: max 10 words. |
| `cta` | 20 | 1 action | CTA text: single sentence, max 12 words. |

**General rules:**
- If a slide exceeds its word target by more than 20%, split it into two slides or cut ruthlessly.
- Bullet points must never be full sentences with semicolons or conjunctions chaining multiple ideas.
- Numbers are more powerful than words. Prefer "37% increase" over "significant increase."
- Every slide must be comprehensible in under 8 seconds of reading.

---

## Color Emphasis Guide

The brand kit provides five color variables. Here is how they should be weighted for presentations:

| CSS Variable | Typical Use | Presentation Role |
|---|---|---|
| `--brand-primary` | Main brand color | Slide titles, key headings, CTA buttons, stat card backgrounds |
| `--brand-secondary` | Supporting brand color | Sub-headings, secondary labels, comparison headers, timeline markers |
| `--brand-accent` | Highlight/attention | Highlight stats, key terms within bullets, alert items, "hook" elements |
| `--brand-bg` | Background | Slide background. Keep white or very light for readability. |
| `--brand-text` | Body text | All body copy, bullet text, descriptions |

**Template-specific weighting:**

| Template | Primary | Secondary | Accent | Mood |
|---|---|---|---|---|
| Educational | 60% | 25% | 15% | Authoritative, structured |
| Workshop | 40% | 35% | 25% | Energetic, action-oriented |
| Internal Strategy | 50% | 30% | 20% | Measured, data-driven |
| Client Presentation | 50% | 30% | 20% | Professional, empathetic |

---

## AI Generation Notes

These guidelines are for the Claude Sonnet agent that fills template content from a brief via `deck_create`.

### Brief Parsing Priority

1. **Explicit content** -- If the brief states specific metrics, names, or facts, use them verbatim.
2. **Implied content** -- If the brief describes a situation, infer reasonable details (industry benchmarks, common challenges).
3. **Structural defaults** -- If the brief is vague, fill with clearly labeled placeholder content that the user can edit via `content_edit`.

### Language Handling

- If the brief is in Spanish, generate all slide content in Spanish. The existing templates default to Spanish (`lang="es"` in `deck_export`).
- If the brief is in English, generate in English.
- Do not mix languages within a single deck.

### Content Quality Checklist

Before returning the filled slides JSON, the AI agent should verify:

- [ ] Every `title` field is filled (no empty strings).
- [ ] Bullet arrays have 3-5 items (within the template's specified range).
- [ ] Stats have 2-4 items with non-placeholder values where the brief provides data.
- [ ] Comparison columns are equal length.
- [ ] `quoteText` is present for quote-type slides.
- [ ] `ctaText` is present for cta-type slides.
- [ ] No slide exceeds its word density target by more than 20%.
- [ ] The narrative arc is preserved (slides build on each other logically).

### Fallback Behavior

If the AI cannot generate content for a specific slide (insufficient information in the brief):

1. Use the template's placeholder values as-is.
2. Prefix placeholder titles with "[DRAFT]" so the user knows to edit them.
3. Never fabricate statistics or attribute quotes to real people without brief support.

### Template Selection Heuristic

When `deck_create` is called without an explicit template, use these signals to auto-select:

| Brief Signal | Suggested Template |
|---|---|
| Contains "teach", "learn", "training", "class", "course" | `educational` |
| Contains "workshop", "hands-on", "exercise", "bootcamp" | `workshop` |
| Contains "strategy", "roadmap", "quarterly", "OKR", "alignment" | `internal-strategy` |
| Contains "client", "proposal", "pitch", "partnership", "prospect" | `client-presentation` |
| Contains "investor", "funding", "raise", "seed", "series" | `investor-pitch` (existing) |
| Contains "sales", "pricing", "deal", "quotation" | `sales-proposal` (existing) |
| Default / unclear | `business-overview` (existing) |

# Video Creation Intelligence for LatAm SMBs

**Document type:** Strategic Intelligence Brief
**Last updated:** 2026-02-24
**Audience:** Kitz platform — content engine, AI agents, and SMB owners

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [AI Video Generation Tools](#2-ai-video-generation-tools)
3. [Programmatic Video Creation APIs](#3-programmatic-video-creation-apis)
4. [Video Editing & Post-Production AI](#4-video-editing--post-production-ai)
5. [Video Types for SMBs](#5-video-types-for-smbs)
6. [Video Specifications by Platform](#6-video-specifications-by-platform)
7. [Auto-Captioning & Subtitles](#7-auto-captioning--subtitles)
8. [Video for WhatsApp (Critical for LatAm)](#8-video-for-whatsapp-critical-for-latam)
9. [Video Content-to-Ads Loop Integration](#9-video-content-to-ads-loop-integration)
10. [Kitz Video Engine Architecture](#10-kitz-video-engine-architecture)
11. [Video SEO & Discovery](#11-video-seo--discovery)
12. [Video Performance Analytics](#12-video-performance-analytics)
13. [UGC-Style Video Creation](#13-ugc-style-video-creation)
14. [Video Ad Creation Automation](#14-video-ad-creation-automation)
15. [Video Template Platforms](#15-video-template-platforms)
16. [Cost Analysis](#16-cost-analysis)
17. [Implementation Roadmap](#17-implementation-roadmap)
18. [LatAm Video Consumption Data](#18-latam-video-consumption-data)

---

## 1. Executive Summary

### Video is THE Dominant Content Format

Video has become the single most important content format for reaching consumers in Latin America. The numbers are unambiguous:

- **91% of businesses** now use video marketing; 93% consider it essential to their strategy
- **89% of consumers** say watching a video has convinced them to buy a product
- **87% of businesses** report positive ROI from video marketing
- **Video delivers ROI 49% faster** than text-based content
- **Short-form videos (30-60 seconds)** deliver the strongest ROI, with 39% of marketers confirming this
- **66% of video marketers** say product videos produce the strongest ROI of any video type

### LatAm Is a Video-First Market

Latin America is uniquely positioned as a mobile-first, video-first region:

- **356 million TikTok users** across the region (22% of global TikTok usage)
- **34% year-over-year user growth** on TikTok in LatAm — the fastest-growing region globally
- **90%+ smartphone penetration** in Brazil, Mexico, and Argentina
- **75%+ of all video** is consumed on mobile devices
- **70% of LatAm consumers** discover new products through social media (vs. 45% via search engines)
- **82% of Latin Americans** have purchased a product via social media
- **46% of LatAm digital buyers** have used livestream commerce

### SMBs Cannot Afford Traditional Video Production

A single professionally produced 30-second video costs $1,000-$5,000+ in traditional production. For a restaurant owner in Bogota or a beauty salon in Guadalajara, this is prohibitive. AI changes the equation completely:

- AI-generated product videos: **$0.10-$2.00 per video**
- AI avatar explainer videos: **$0.50-$5.00 per minute**
- Template-based promotional videos: **$0.11-$0.25 per minute** via API
- AI voiceover (Spanish): **$0.01-$0.05 per minute** of audio

### The Kitz Opportunity

Kitz can integrate AI-powered video creation directly into the content engine, allowing any SMB owner to:

1. Generate product showcase videos from their catalog (zero filming required)
2. Create promotional videos with dynamic pricing and seasonal themes
3. Produce AI avatar FAQ and welcome videos in Latin American Spanish
4. Auto-caption and optimize videos for WhatsApp, Reels, TikTok, and Shorts
5. Measure performance and automatically promote top-performing videos as ads
6. Send personalized video messages to customers via WhatsApp

**Key insight:** Short-form vertical video (15-60 seconds, 9:16 aspect ratio) is the sweet spot for SMBs. It is the format that performs best on TikTok (5.3-6.8% engagement rate), costs the least to produce, and is native to how LatAm consumers discover and purchase products.

---

## 2. AI Video Generation Tools

### 2.1 Text-to-Video AI

#### Sora 2 (OpenAI)

- **Released:** September 2025
- **Capabilities:** Cinematic-quality video with realistic physics, synchronized audio, remarkable prompt adherence
- **Max Duration:** 35 seconds (Pro tier)
- **Resolution:** Up to 1080p
- **API:** Available via OpenAI API
- **Pricing:** Usage-based via OpenAI credits; ChatGPT Pro ($200/month) includes video generation
- **Strengths:** Best-in-class physics simulation, cinematic quality, strong prompt understanding
- **Weaknesses:** Short max duration, expensive for high volume, availability constraints
- **LatAm Relevance:** Excellent for creating aspirational ad creative, but overkill for most SMB use cases

#### Runway Gen-4.5

- **Released:** Early 2026 (Gen-4.5 is latest iteration)
- **Capabilities:** Text-to-video, image-to-video, motion brushes, scene consistency, video editing
- **Max Duration:** ~25 seconds on Standard plan (625 credits)
- **Resolution:** Up to 4K
- **API:** Available (Runway API)
- **Pricing:** From $12/month (Standard); higher tiers for more credits
- **Strengths:** Highest benchmark scores, excellent motion quality, robust editing tools, established API
- **Weaknesses:** Short duration per generation, credit consumption is fast at higher quality
- **LatAm Relevance:** Good for hero content and ad creative; API enables automation

#### Kling AI (Kuaishou)

- **Released:** Kling 2.6 (December 2025), Kling O1 (first unified multimodal video model)
- **Capabilities:** Simultaneous audio-visual generation (visuals + voiceover + sound effects + ambient atmosphere in one pass), 18+ video tasks in unified model
- **Max Duration:** Up to 3 minutes (significantly longer than competitors)
- **Resolution:** Up to 1080p
- **API:** Available with prepaid resource packages; enterprise tiers for scale
- **Pricing:** Free tier available; $6.99/month (Standard) to $180/month
- **Strengths:** Longest generation duration (3 min vs 35-40s for competitors), unified audio-visual output, lowest entry price
- **Weaknesses:** Newer ecosystem, potential quality gap on complex scenes vs Sora/Runway
- **LatAm Relevance:** Best value for longer product demo videos; 3-minute generation is ideal for tutorials

#### Pika 2.5

- **Released:** 2025
- **Capabilities:** Pikaswaps (swap elements in video), Pikaffects (apply effects), stylized generation
- **Max Duration:** ~10 seconds per generation
- **Resolution:** Up to 1080p
- **API:** Limited availability
- **Pricing:** From $8/month
- **Render Speed:** ~42 seconds per video
- **Strengths:** Fast iteration, creative style effects, accessible pricing
- **Weaknesses:** Short duration, more stylized than realistic
- **LatAm Relevance:** Good for creative social content; quick A/B testing of visual styles

#### Luma Dream Machine (Ray3)

- **Released:** Ongoing updates through 2025-2026
- **Capabilities:** Text-to-video, image-to-video, fast generation
- **Max Duration:** 5 seconds (170 credits) or 10 seconds (340 credits)
- **Resolution:** Up to 1080p
- **API:** Separate API credits (not included in web subscription)
- **Pricing:** Free tier; Unlimited plan at $29.99/month; API pricing separate
- **Strengths:** Fast generation, good visual quality, unlimited plan available
- **Weaknesses:** Very short max duration (5-10s), API costs separate from subscription
- **LatAm Relevance:** Good for quick product animation clips; unlimited plan useful for testing

#### Veo 3.1 (Google DeepMind)

- **Released:** Veo 3 (mid-2025), Veo 3.1 (October 2025)
- **Capabilities:** Rich native audio, image-to-video, enhanced realism, vertical format support (9:16)
- **Max Duration:** ~8 seconds per generation
- **Resolution:** Up to 1080p HD
- **API:** Available via Gemini API (AI Studio and Vertex AI)
- **Pricing:** $0.40/second (Veo 3), $0.15/second (Veo 3 Fast); Google AI Pro $19.99/month, Ultra $249.99/month
- **Strengths:** Deep Google ecosystem integration, vertical format native support, production-ready API, multiple speed tiers
- **Weaknesses:** Short generation duration, per-second pricing can add up
- **LatAm Relevance:** Excellent API for integration; vertical format support aligns perfectly with Reels/TikTok needs

#### MiniMax / Hailuo AI

- **Released:** Hailuo 2.3 (October 2025)
- **Capabilities:** Enhanced motion rendering, near-photorealistic lighting/shadows/color, natural character movements
- **Max Duration:** 10 seconds
- **Resolution:** Up to 1080p
- **API:** Available
- **Pricing:** $14.99/month
- **Strengths:** Excellent physical realism at moderate price, strong character animation
- **Weaknesses:** Limited ecosystem, shorter max duration
- **LatAm Relevance:** Competitive option for realistic product videos

#### Stable Video Diffusion (Open Source)

- **Released:** Ongoing open-source development
- **Capabilities:** Image-to-video, text-to-video, 14-25 frames at customizable frame rates (3-30 fps)
- **Max Duration:** ~4 seconds (25 frames at typical rates)
- **Resolution:** 576x1024
- **API:** Self-hosted (GitHub + Hugging Face weights)
- **Pricing:** Free (compute costs only; requires GPU)
- **Strengths:** Fully open source, can be fine-tuned, no per-generation fees, full control
- **Weaknesses:** Short clips, high GPU requirements, inconsistent motion, no commercial support, limited temporal coherence
- **LatAm Relevance:** Good for experimentation and custom fine-tuning; not production-ready for SMB use without significant engineering

### Text-to-Video Comparison Matrix

| Tool | Price/Mo | Max Duration | Resolution | API | Quality | Best For |
|---|---|---|---|---|---|---|
| Sora 2 | $200+ | 35s | 1080p | Yes | Excellent | Cinematic ad creative |
| Runway Gen-4.5 | $12+ | 25s | 4K | Yes | Excellent | High-quality + editing |
| Kling AI | $6.99+ | 3 min | 1080p | Yes | Very Good | Long-form, best value |
| Pika 2.5 | $8+ | 10s | 1080p | Limited | Good | Quick creative iteration |
| Luma Dream Machine | $29.99 | 10s | 1080p | Yes (separate) | Very Good | Fast unlimited generation |
| Veo 3.1 | $0.15-0.40/s | 8s | 1080p | Yes (Gemini) | Excellent | API integration, vertical |
| MiniMax/Hailuo | $14.99 | 10s | 1080p | Yes | Very Good | Realistic character videos |
| Stable Video Diffusion | Free | 4s | 576x1024 | Self-host | Fair | Experimentation only |

**Kitz Recommendation:** For the content engine, **Kling AI** offers the best value for SMB video generation (3-minute videos at $6.99/month), while **Veo 3.1 via Gemini API** provides the best programmatic integration with vertical format support. Use **Runway** for premium ad creative only.

---

### 2.2 AI Avatar / Digital Spokesperson

AI avatars allow SMBs to create professional spokesperson videos without ever appearing on camera. This is transformative for business owners who are camera-shy, time-constrained, or want multilingual content.

#### HeyGen

- **Pricing (2026):**
  - Creator Plan: $29/month — unlimited avatar videos, 1080p, voice cloning
  - Pro Plan: $99/month — 100 Premium Credits, higher quality, more AI capacity
  - Scale Plan: $330/month — 660 Premium Credits ($0.50/credit)
  - Enterprise: Custom pricing
- **API:** Available; separate API pricing from web plans
- **Avatars:** 1,100+ ready-made avatars across industries
- **Languages:** 175+ languages and dialects
- **Key Features:**
  - Custom AI avatar from photo or text description
  - Real-time translation with lip sync
  - Voice cloning
  - UGC-style avatars for authentic-looking content
  - Audio dubbing unlimited on all paid plans (non-lip-sync translation)
- **Spanish Support:** Strong — multiple Latin American accents, lip-sync translation
- **LatAm Relevance:** Best value for unlimited avatar videos at $29/month; UGC avatar feature perfect for authentic SMB content

#### Synthesia

- **Pricing:**
  - Free: $0/month — 3 minutes/month, 9 avatars
  - Starter: $29/month ($18/month annual) — 10 min/month, 125+ avatars, 3 personal avatars
  - Creator: $89/month ($64/month annual) — 30 min/month, 180+ avatars, 5 personal avatars, API access
  - Enterprise: Custom pricing — unlimited minutes, SSO, dedicated support
- **API:** Available on Creator and Enterprise plans
- **Avatars:** 180+ stock avatars; custom avatar creation
- **Languages:** 140+ languages
- **Key Features:**
  - Enterprise-grade quality and security
  - Personal avatar creation (your face + voice)
  - API for automated video generation at scale
  - Template-based generation
- **Spanish Support:** Good — multiple Spanish variants
- **LatAm Relevance:** Best for enterprise clients; Creator plan at $89/month includes API access for Kitz integration

#### D-ID

- **Pricing:** Tiered plans (visit d-id.com/pricing/api/ for current rates)
- **API:** Full REST API for programmatic video generation
- **Avatars:** Digital human creation from any photo
- **Languages:** 120+ languages and accents
- **Key Features:**
  - Generate video from image + audio synchronization
  - Real-time streaming API for dynamic communication
  - Integration with chatbots and virtual assistants
  - Expression, voice, and pitch control on higher tiers
- **Spanish Support:** Good — 120+ languages including Spanish variants
- **LatAm Relevance:** Strong API for embedding avatar videos into Kitz workflows; chatbot integration potential

#### Colossyan

- **Pricing:**
  - Free: 3 min/month, 20+ avatars
  - Starter: $19/month ($27/month monthly) — 15 min/month, 70+ avatars, 3 custom avatars, 1 voice clone
  - Business: $70/month ($88/month monthly) — unlimited minutes, 170+ avatars, 10 custom avatars, 2 voice clones, interactive videos, 10 auto translations/month
  - Enterprise: Custom — SOC 2, white-labeling, API
- **API:** Enterprise plan only
- **Avatars:** 170+ AI avatars
- **Languages:** Multiple language support with auto-translation
- **Key Features:**
  - Interactive video capability (choose-your-own-adventure style)
  - Strongest in learning/training video space
  - Actor-based avatars (filmed from real actors)
- **Spanish Support:** Multiple languages including Spanish
- **LatAm Relevance:** Business plan with unlimited minutes at $70/month is competitive; interactive videos good for onboarding/training

#### Tavus

- **Pricing:**
  - Free: 25 live minutes
  - Starter: $59/month
  - Growth/Enterprise: Usage-based with custom SLAs
- **API:** White-labeled, API-first with robust SDKs
- **Key Features:**
  - Personalized video at scale (insert customer name, details dynamically)
  - Real-time conversational AI video
  - White-label capabilities
- **Spanish Support:** Multilingual support
- **LatAm Relevance:** Best for personalized outreach (e.g., personalized welcome videos with customer name)

### AI Avatar Comparison Matrix

| Tool | Price/Mo | Minutes | Avatars | API | Spanish | Best For |
|---|---|---|---|---|---|---|
| HeyGen | $29+ | Unlimited | 1,100+ | Yes | Strong | Volume SMB content |
| Synthesia | $18-89+ | 3-30 | 180+ | Creator+ | Good | Enterprise quality |
| D-ID | Varies | Varies | Any photo | Yes | Good | Chatbot integration |
| Colossyan | $19-70+ | 15-Unlimited | 170+ | Enterprise | Good | Training/interactive |
| Tavus | $59+ | Usage-based | Custom | Yes (first) | Yes | Personalized outreach |

**Kitz Recommendation:** **HeyGen** at $29/month for unlimited avatar videos is the clear winner for SMB use cases. For API integration into the Kitz content engine, **D-ID** or **Synthesia Creator** provide the best programmatic access. Use **Tavus** for personalized customer videos at scale.

---

### 2.3 AI Voice Generation

Voice is the audio layer that makes video content feel professional. For LatAm SMBs, the quality of Latin American Spanish (not Spain/Castilian Spanish) is the critical differentiator.

#### ElevenLabs

- **Quality:** Industry-leading realistic voices with emotional depth
- **Languages:** 32 languages, 74 languages in voice library with regional accents
- **Spanish Support:** Mexican Spanish accents specifically available; multiple LatAm variants
- **Voice Cloning:** Professional voice cloning available; SMB owners can clone their own voice
- **API:** Full REST API with per-character billing
- **Pricing:**
  - Free: Limited characters
  - Starter: ~$5/month (annual $50/year)
  - Creator: ~$22/month
  - Pro: ~$99/month
  - Scale: ~$330/month
  - Business: $1,320/month (11 million characters)
  - Turbo models: 50% cost reduction
- **Key Features:** Voice cloning, voice design, speech-to-speech, dubbing, audio isolation
- **LatAm Relevance:** Best quality for Mexican/LatAm Spanish; voice cloning lets SMB owners create consistent brand voice

#### Play.ht

- **Quality:** Very good; large voice library
- **Languages:** 60+ languages
- **Spanish Support:** Multiple Spanish variants available
- **Voice Cloning:** Available
- **API:** Full API integration
- **Pricing:** Plans from $14.25/month
- **Key Features:** Largest voice library, API-first approach, good for content at scale
- **LatAm Relevance:** Good alternative to ElevenLabs with larger voice library

#### Murf AI

- **Quality:** Studio-quality voices
- **Languages:** 20+ languages including Spanish
- **API:** Available
- **Pricing:** From $19/month (Premium)
- **Key Features:** Studio environment for voice editing, voice changer, emphasis/pause control
- **LatAm Relevance:** Good quality at accessible price point

#### Google Cloud Text-to-Speech

- **Quality:** Good; natural-sounding
- **Languages:** 40+ languages with 220+ voices
- **Spanish Support:** Excellent LatAm variants — es-MX (Mexico), es-CO (Colombia), es-AR (Argentina), es-CL (Chile), es-PE (Peru)
- **API:** Full Cloud API
- **Pricing:** Standard voices: $4/million characters; WaveNet: $16/million characters; Neural2: $16/million characters
- **Key Features:** SSML support, multiple voice models, reliable uptime, deep Google integration
- **LatAm Relevance:** Best country-specific Spanish variants (Mexico, Colombia, Argentina, Chile, Peru); extremely cost-effective at scale

#### Amazon Polly

- **Quality:** Good; reliable
- **Languages:** 30+ languages
- **Spanish Support:** es-MX (Mexico), es-ES (Spain), es-US (US Spanish)
- **API:** AWS SDK integration
- **Pricing:** Standard: $4/million characters; Neural: $16/million characters
- **Key Features:** Low latency, SSML, speech marks, reliable AWS infrastructure
- **LatAm Relevance:** Cost-effective; fewer LatAm variants than Google Cloud TTS

#### Microsoft Azure Speech

- **Quality:** Very good; enterprise-grade
- **Languages:** 140+ languages
- **Spanish Support:** Multiple LatAm variants including Mexico, Argentina, Colombia, Chile, Cuba, Dominican Republic, Ecuador, and more
- **API:** Azure Cognitive Services API
- **Pricing:** Standard: $1/audio hour; Custom Neural: $2/audio hour
- **Key Features:** Custom Neural Voice, pronunciation assessment, speech translation
- **LatAm Relevance:** Widest range of LatAm Spanish variants; excellent for country-specific localization

### Voice Generation Comparison Matrix

| Tool | Price | LatAm Spanish Quality | Voice Cloning | API | Best For |
|---|---|---|---|---|---|
| ElevenLabs | $5-1,320/mo | Excellent (Mexican) | Yes | Yes | Premium quality |
| Play.ht | $14.25+/mo | Good | Yes | Yes | Large voice library |
| Murf AI | $19+/mo | Good | No | Yes | Studio editing |
| Google Cloud TTS | $4-16/M chars | Excellent (5 LatAm) | No | Yes | Scale + LatAm variants |
| Amazon Polly | $4-16/M chars | Good (Mexico, US) | No | Yes | Cost-effective at scale |
| Microsoft Azure | $1-2/audio hr | Excellent (8+ LatAm) | Yes (Custom) | Yes | Most LatAm variants |

**Kitz Recommendation:** Use **ElevenLabs** for premium brand voices and voice cloning (SMB owner's voice). Use **Google Cloud TTS** or **Microsoft Azure Speech** for high-volume, country-specific LatAm Spanish at scale. The combination provides quality where it matters and cost efficiency for volume.

---

## 3. Programmatic Video Creation APIs

These tools are the **most relevant for Kitz integration** because they enable template-based video creation at scale via API. Instead of generating video from scratch with AI (expensive, slow, unpredictable), these APIs render pre-designed templates with dynamic data (product names, prices, images, customer names).

### 3.1 Creatomate

The cloud video editing API purpose-built for automated video generation.

- **API Type:** REST API with JSON-driven templates
- **Capabilities:**
  - Dynamic text, images, video overlays
  - Batch rendering
  - 100+ pre-built templates
  - Custom template designer
  - Webhooks for render completion
  - Multiple output formats and resolutions
- **Pricing:**
  - Starter: $49/month — 200 minutes at 720p ($0.25/min)
  - Professional: $99/month — 500 minutes ($0.20/min)
  - Business: $199/month — 1,500 minutes ($0.13/min)
  - Enterprise: $499+/month — 5,000+ minutes ($0.11/min)
- **SDK:** TypeScript/JavaScript, Python, Ruby, PHP
- **Strengths:** Purpose-built for video automation, excellent template system, reliable batch rendering
- **Weaknesses:** No AI generation (template-based only)

```typescript
// Creatomate integration example for Kitz
import Creatomate from 'creatomate';

const client = new Creatomate.Client('YOUR_API_KEY');

interface ProductVideoParams {
  productName: string;
  productImage: string;
  price: string;
  currency: string;
  ctaText: string;
  brandLogo: string;
  backgroundColor: string;
}

async function generateProductVideo(params: ProductVideoParams): Promise<string> {
  const renders = await client.render({
    templateId: 'product-showcase-9x16', // Pre-designed Reels/TikTok template
    modifications: {
      'product-name': params.productName,
      'product-image': params.productImage,
      'price-text': `${params.currency}${params.price}`,
      'cta-text': params.ctaText,
      'brand-logo': params.brandLogo,
      'background-color': params.backgroundColor,
    },
    outputFormat: 'mp4',
    width: 1080,
    height: 1920,
  });

  return renders[0].url; // URL to rendered video
}

// Batch generation example - multiple products
async function generateCatalogVideos(
  products: ProductVideoParams[]
): Promise<string[]> {
  const renderPromises = products.map(product =>
    generateProductVideo(product)
  );
  return Promise.all(renderPromises);
}
```

### 3.2 Shotstack

Video editing API with JSON timeline-based editing.

- **API Type:** REST API with JSON timeline definitions
- **Capabilities:**
  - Timeline-based video composition
  - Text overlays, transitions, effects
  - Media asset management
  - Audio mixing
  - Webhooks for render status
  - Merge fields for personalization
- **Pricing:**
  - Free: 5 minutes/month (watermarked)
  - Starter: $49/month — 200 minutes at 720p ($0.25/min)
  - Professional: $99/month — 500 minutes ($0.20/min)
  - Business: $299/month — 2,000 minutes ($0.15/min)
  - Enterprise: Custom pricing
  - Pay-as-you-go: $0.40/min (no subscription)
- **SDK:** TypeScript/JavaScript, Python, PHP, Ruby, .NET
- **Strengths:** Flexible timeline API, good documentation, pay-as-you-go option
- **Weaknesses:** More complex API than Creatomate for simple use cases

```typescript
// Shotstack integration example for Kitz
import Shotstack from 'shotstack-sdk';

const apiClient = new Shotstack.ApiClient();
apiClient.basePath = 'https://api.shotstack.io/v1';
apiClient.authentications['DeveloperKey'].apiKey = 'YOUR_API_KEY';

const api = new Shotstack.EditApi(apiClient);

interface PromoVideoConfig {
  headline: string;
  subheadline: string;
  productImageUrl: string;
  discountPercentage: number;
  brandColor: string;
  voiceoverUrl?: string;
}

async function createPromoVideo(config: PromoVideoConfig): Promise<string> {
  const timeline = {
    soundtrack: {
      src: 'https://assets.kitz.app/music/upbeat-latin.mp3',
      effect: 'fadeOut',
    },
    tracks: [
      {
        clips: [
          {
            asset: {
              type: 'title',
              text: config.headline,
              style: 'blockbuster',
              color: '#ffffff',
              size: 'large',
            },
            start: 0,
            length: 3,
            transition: { in: 'slideUp', out: 'slideDown' },
          },
          {
            asset: {
              type: 'image',
              src: config.productImageUrl,
            },
            start: 3,
            length: 4,
            fit: 'contain',
            transition: { in: 'zoom', out: 'fade' },
          },
          {
            asset: {
              type: 'title',
              text: `${config.discountPercentage}% OFF`,
              style: 'chunk',
              color: config.brandColor,
              size: 'x-large',
            },
            start: 7,
            length: 3,
            transition: { in: 'slideRight' },
          },
        ],
      },
    ],
  };

  const output = {
    format: 'mp4',
    resolution: 'hd',    // 1080p
    aspectRatio: '9:16',  // Vertical for Reels/TikTok
  };

  const edit = { timeline, output };
  const response = await api.postRender({ edit });
  return response.response.id; // Poll for completion
}
```

### 3.3 Remotion

React-based video creation — write videos as React components.

- **Type:** Open-source framework (not a cloud API)
- **Capabilities:**
  - Create videos with React, CSS, Canvas, SVG, WebGL
  - Parametric video templates as React components
  - Server-side rendering with Remotion Lambda (AWS)
  - Full TypeScript support
  - Infinite customization
- **Pricing:**
  - Free: Individuals and companies up to 3 people
  - Company License: Required for companies with 4+ people (contact for pricing)
  - Lambda costs: ~$0.001 per render (warm Lambda); actual AWS Lambda charges
- **Strengths:** Maximum flexibility, TypeScript-native, open source core, extremely low per-render cost
- **Weaknesses:** Requires React development skill, self-hosted infrastructure, no template marketplace
- **LatAm Relevance:** Perfect for Kitz engineering team to build custom video templates as React components

```typescript
// Remotion video template example for Kitz
import { AbsoluteFill, Img, useCurrentFrame, interpolate, Sequence, Audio } from 'remotion';

interface ProductShowcaseProps {
  productName: string;
  productImageUrl: string;
  price: string;
  currency: string;
  brandColor: string;
  brandLogoUrl: string;
  ctaText: string;
  backgroundMusicUrl: string;
}

export const ProductShowcase: React.FC<ProductShowcaseProps> = ({
  productName,
  productImageUrl,
  price,
  currency,
  brandColor,
  brandLogoUrl,
  ctaText,
  backgroundMusicUrl,
}) => {
  const frame = useCurrentFrame();

  // Animate product name entrance (frames 0-30)
  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Animate product image scale (frames 20-50)
  const imageScale = interpolate(frame, [20, 50], [0.5, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Animate price entrance (frames 50-70)
  const priceSlide = interpolate(frame, [50, 70], [100, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#ffffff' }}>
      <Audio src={backgroundMusicUrl} volume={0.3} />

      {/* Brand Logo */}
      <Sequence from={0}>
        <div style={{ position: 'absolute', top: 40, left: 40 }}>
          <Img src={brandLogoUrl} style={{ height: 60 }} />
        </div>
      </Sequence>

      {/* Product Name */}
      <Sequence from={0} durationInFrames={90}>
        <div
          style={{
            position: 'absolute',
            top: 140,
            width: '100%',
            textAlign: 'center',
            opacity: titleOpacity,
          }}
        >
          <h1 style={{ fontSize: 64, color: '#1a1a1a', fontWeight: 800 }}>
            {productName}
          </h1>
        </div>
      </Sequence>

      {/* Product Image */}
      <Sequence from={20} durationInFrames={70}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            transform: `scale(${imageScale})`,
          }}
        >
          <Img
            src={productImageUrl}
            style={{ maxWidth: '80%', maxHeight: '60%', borderRadius: 20 }}
          />
        </div>
      </Sequence>

      {/* Price Tag */}
      <Sequence from={50}>
        <div
          style={{
            position: 'absolute',
            bottom: 300,
            width: '100%',
            textAlign: 'center',
            transform: `translateX(${priceSlide}%)`,
          }}
        >
          <span
            style={{
              fontSize: 80,
              fontWeight: 900,
              color: brandColor,
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            {currency}{price}
          </span>
        </div>
      </Sequence>

      {/* CTA Button */}
      <Sequence from={70}>
        <div
          style={{
            position: 'absolute',
            bottom: 160,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              backgroundColor: brandColor,
              padding: '20px 60px',
              borderRadius: 50,
            }}
          >
            <span style={{ color: '#ffffff', fontSize: 36, fontWeight: 700 }}>
              {ctaText}
            </span>
          </div>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
```

### 3.4 Bannerbear

Image and video generation API focused on social media content at scale.

- **API Type:** REST API with template-based generation
- **Capabilities:**
  - Image and video generation from templates
  - Watermarks, logos, subtitles overlay
  - CDN delivery of assets
  - Multi-team collaboration
  - Integrations with Zapier, Make, n8n
- **Pricing:**
  - Free: 30 images via API
  - Automate: $49/month — 1,000 API credits
  - Higher tiers for more credits and team features
  - 1 image = 1 credit; videos use more credits
- **Strengths:** Simple API, CDN delivery included, good for social media templates
- **Weaknesses:** Less video-specific than Creatomate/Shotstack; more image-focused
- **LatAm Relevance:** Good for generating social media graphics + short video clips from product data

### 3.5 FFmpeg (Open Source)

The foundational open-source tool for video processing and manipulation.

- **Type:** Command-line video processing tool
- **Cost:** Free and open source
- **Capabilities:**
  - Video compression, transcoding, resizing
  - Format conversion (any to any)
  - Audio extraction and mixing
  - Subtitle burning
  - Concatenation and trimming
  - Filter effects
- **Key Commands for Kitz:**

```bash
# WhatsApp-optimized compression (target: <16MB)
ffmpeg -i input.mp4 \
  -vf "scale=-2:720" \
  -c:v libx264 \
  -preset slow \
  -crf 28 \
  -profile:v baseline \
  -level 3.0 \
  -pix_fmt yuv420p \
  -r 25 \
  -c:a aac \
  -b:a 128k \
  -r:a 44100 \
  -movflags +faststart \
  -f mp4 output_whatsapp.mp4

# Resize for Instagram Reels (9:16, 1080x1920)
ffmpeg -i input.mp4 \
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:-1:-1:color=black" \
  -c:v libx264 -crf 23 -preset medium \
  -c:a aac -b:a 192k \
  -movflags +faststart \
  output_reels.mp4

# Burn-in Spanish subtitles
ffmpeg -i input.mp4 \
  -vf "subtitles=subtitles_es.srt:force_style='FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2'" \
  -c:v libx264 -crf 23 \
  -c:a copy \
  output_subtitled.mp4

# Concatenate multiple clips into one video
ffmpeg -f concat -safe 0 -i filelist.txt \
  -c:v libx264 -crf 23 \
  -c:a aac \
  output_combined.mp4

# Extract thumbnail at 3 seconds
ffmpeg -i input.mp4 -ss 00:00:03 -vframes 1 thumbnail.jpg
```

- **Integration:** Can be automated in n8n/Temporal workflows, Docker containers, or Node.js via fluent-ffmpeg
- **LatAm Relevance:** Essential for WhatsApp video compression (16MB limit is a hard constraint in LatAm)

### Programmatic Video API Comparison Matrix

| Tool | Type | API | Templates | Batch | Per-Min Cost | Best For |
|---|---|---|---|---|---|---|
| Creatomate | Cloud API | REST | Yes (100+) | Yes | $0.11-0.25 | Template-based at scale |
| Shotstack | Cloud API | REST | Yes | Yes | $0.15-0.40 | Timeline-based editing |
| Remotion | Framework | Self-host | React components | Yes (Lambda) | ~$0.001 | Maximum flexibility |
| Bannerbear | Cloud API | REST | Yes | Yes | Credit-based | Social media graphics + video |
| FFmpeg | CLI tool | N/A | N/A | Script | Free | Compression, conversion |

**Kitz Recommendation:** Build the core video engine on **Remotion** (React components for templates, Lambda for rendering, near-zero per-render cost). Use **Creatomate** as fallback/complement for quick template iteration. Use **FFmpeg** for all post-processing (compression, resizing, subtitle burning, WhatsApp optimization).

---

## 4. Video Editing & Post-Production AI

### 4.1 Descript

- **Pricing:** Hobbyist $16/month; Creator $24/month; Business $50/month; Enterprise custom
- **Core Innovation:** Edit video by editing text — transcript-based editing paradigm
- **Key Features:**
  - AI transcription with high accuracy
  - Overdub (voice synthesis from your own voice)
  - Filler word removal (um, uh, etc.)
  - Eye contact correction
  - Studio Sound (AI noise removal and audio enhancement)
  - Green screen removal
- **API:** No public API currently available
- **Spanish Support:** Transcription supports Spanish
- **LatAm Relevance:** Excellent for SMBs who record raw video (phone footage from restaurant, salon, etc.) — AI cleanup makes amateur footage look professional. No API limits integration with Kitz.

### 4.2 CapCut (ByteDance)

- **Pricing:** Free (1080p, basic features); Pro $9.99/month (4K, full AI features, no watermark)
- **Key Features:**
  - Auto-captions (excellent Spanish support)
  - Trending effects optimized for TikTok, Reels, Shorts
  - Templates and preset styles
  - AI-powered editing suggestions
  - Background removal
  - Speed ramping
- **API:** No public API (CapCut for Business exists but is not API-driven)
- **Spanish Support:** Excellent auto-captions in Spanish
- **LatAm Relevance:** Hugely popular with LatAm creators already; SMBs likely already familiar. Limitation: no API means no Kitz integration, but can be recommended as manual editing tool.

### 4.3 Opus Clip

- **Pricing:** Starter $15/month (150 minutes); higher tiers available
- **Key Features:**
  - AI finds best clips from long-form video
  - Auto-generates short-form clips for Reels/TikTok/Shorts
  - Virality score prediction
  - Auto-captioning
  - B-roll suggestions
  - Multi-platform resizing
- **API:** Not publicly documented
- **LatAm Relevance:** Perfect for SMBs who create long-form content (live cooking sessions, salon demonstrations, workshop tutorials) — AI automatically extracts the best 30-60 second moments

### 4.4 Vizard AI

- **Pricing:** Starter $14.50/month (600 minutes)
- **Key Features:**
  - Long-form to short-form AI repurposing
  - Auto-captions and auto-resizing
  - Speaker boundary detection (clean cuts around speaker transitions)
  - Batch processing
- **API:** Not publicly documented
- **Best For:** Podcast/interview/demo video repurposing into social clips
- **LatAm Relevance:** Good value (600 minutes at $14.50/month); speaker detection useful for interview-style content

### 4.5 Pictory

- **Pricing:** Standard $23/month (30 videos/month, 10 hours transcription)
- **Key Features:**
  - Blog/article to video conversion
  - Script to video with stock footage
  - Auto-summarization of long videos
  - B-roll library
  - Auto-captioning
- **API:** Not publicly available
- **LatAm Relevance:** Converts Kitz blog posts / social media captions into video format; useful as a content multiplication strategy

---

## 5. Video Types for SMBs

Each video type below includes a template specification, recommended tools, and the Kitz workflow for automated generation.

### 5.1 Product Showcase Videos

**Purpose:** Display products with professional presentation — replaces product photography
**Template Structure:** Product image/video + text overlay + price + CTA
**Duration:** 15-30 seconds
**Format:** 9:16 vertical (1080x1920)
**Platforms:** Instagram Reels, TikTok, WhatsApp Status

```typescript
interface ProductShowcaseConfig {
  product: {
    name: string;
    images: string[];       // Product catalog images
    price: number;
    currency: 'MXN' | 'COP' | 'BRL' | 'ARS' | 'PEN' | 'CLP';
    description: string;
    category: string;
  };
  brand: {
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
  };
  style: 'elegant' | 'bold' | 'minimal' | 'playful' | 'luxury';
  music: 'upbeat' | 'chill' | 'dramatic' | 'acoustic' | 'latin-pop';
  language: 'es-MX' | 'es-CO' | 'es-AR' | 'pt-BR';
  includeVoiceover: boolean;
  ctaText: string; // e.g., "Compra ahora", "Pide el tuyo", "Link en bio"
}
```

**Kitz Workflow:**
1. SMB adds product to Kitz catalog (name, images, price)
2. Kitz AI selects best template based on product category
3. Remotion/Creatomate renders video with dynamic data
4. FFmpeg optimizes for target platform (Reels vs WhatsApp)
5. Auto-caption in Spanish
6. Schedule publish or send directly

### 5.2 Testimonial/Review Videos

**Purpose:** Social proof — customer reviews presented as video
**Sources:** Customer video reviews collected via WhatsApp, Google reviews converted to video
**Duration:** 15-45 seconds
**Format:** 9:16 vertical

```typescript
interface TestimonialVideoConfig {
  customer: {
    name: string;
    videoUrl?: string;      // Raw video from WhatsApp
    reviewText?: string;    // Text review (Google, Kitz CRM)
    rating: number;         // 1-5 stars
    avatarUrl?: string;
  };
  business: {
    name: string;
    logoUrl: string;
    brandColor: string;
  };
  style: 'authentic' | 'polished' | 'minimal';
  addCaptions: boolean;
  addBranding: boolean;
  addStarRating: boolean;
}
```

**Kitz Workflow:**
1. Customer sends video review via WhatsApp to business
2. Kitz receives video, transcribes with AssemblyAI/Deepgram
3. AI trims to best 15-45 second segment
4. Adds branding overlay, captions, star rating, music
5. Publishes to social media or shares with prospects via WhatsApp

### 5.3 Behind-the-Scenes Content

**Purpose:** Build trust and authenticity — show the human side of the business
**Examples:** Restaurant kitchen, beauty salon, auto workshop, bakery preparation
**Duration:** 15-60 seconds
**Format:** 9:16 vertical
**Style:** Raw, authentic, minimal editing (performs best on TikTok/Reels)

**Kitz Workflow:**
1. SMB records raw video on phone (guided by Kitz prompts/suggestions)
2. Upload to Kitz via WhatsApp or app
3. AI applies light editing: trim, auto-caption, background music, color correction
4. Maintain authentic feel (no heavy effects)
5. Auto-publish to TikTok/Reels with trending hashtags

### 5.4 How-To / Tutorial Videos

**Purpose:** Educate customers, demonstrate expertise, SEO value
**Examples:** "How to style this outfit", "How to care for your nails", "How to assemble this furniture"
**Duration:** 30-120 seconds
**Format:** 9:16 vertical for Shorts/Reels; 16:9 for YouTube long-form

```typescript
interface TutorialVideoConfig {
  title: string;
  steps: Array<{
    stepNumber: number;
    instruction: string;
    imageUrl?: string;
    videoClipUrl?: string;
    duration: number;       // seconds per step
  }>;
  voiceover: {
    enabled: boolean;
    voice: string;          // ElevenLabs voice ID
    language: 'es-MX' | 'es-CO' | 'pt-BR';
  };
  avatar?: {
    enabled: boolean;
    avatarId: string;       // HeyGen/D-ID avatar
  };
  brand: BrandConfig;
}
```

**Kitz Workflow:**
1. SMB provides topic or Kitz AI suggests based on common customer questions (from CRM FAQ data)
2. AI generates script in Spanish
3. If avatar enabled: HeyGen/D-ID renders avatar narrating tutorial
4. If screen recording: overlay step-by-step text + images
5. Add captions, music, branding
6. Publish to YouTube (long-form), Reels/TikTok (short clips)

### 5.5 Promotional / Sale Videos

**Purpose:** Drive immediate action — flash sales, seasonal promotions, new arrivals
**Duration:** 15-30 seconds
**Format:** 9:16 vertical

```typescript
interface PromoVideoConfig {
  promoType: 'flash-sale' | 'seasonal' | 'new-arrival' | 'clearance' | 'bundle' | 'anniversary';
  headline: string;             // "50% OFF TODO"
  subheadline?: string;         // "Solo este fin de semana"
  products: ProductSummary[];   // Featured products
  countdown?: {
    enabled: boolean;
    endDate: Date;
  };
  beforeAfter?: {
    beforeImage: string;
    afterImage: string;
  };
  discountCode?: string;
  urgency: 'low' | 'medium' | 'high';
  seasonalTheme?: 'christmas' | 'valentines' | 'mothers-day' | 'black-friday' | 'back-to-school' | 'dia-de-muertos';
}
```

### 5.6 FAQ Videos

**Purpose:** Answer common questions proactively — reduce support load
**Duration:** 30-90 seconds per question
**Format:** 9:16 for social, square for WhatsApp direct

```typescript
interface FAQVideoConfig {
  question: string;
  answer: string;
  avatar: {
    id: string;
    provider: 'heygen' | 'synthesia' | 'd-id';
  };
  voice: {
    id: string;
    provider: 'elevenlabs' | 'google-tts' | 'azure-tts';
    language: string;
  };
  brand: BrandConfig;
  distribution: ('whatsapp' | 'instagram' | 'tiktok' | 'youtube' | 'website')[];
}
```

**Kitz Workflow:**
1. Kitz CRM identifies most-asked questions (from WhatsApp conversations, support tickets)
2. AI generates answer scripts in conversational LatAm Spanish
3. HeyGen/D-ID renders avatar speaking the answer
4. Auto-caption and brand
5. Organize into FAQ video library
6. Auto-send relevant FAQ video when customer asks similar question via WhatsApp

### 5.7 Welcome/Onboarding Videos

**Purpose:** Personalized welcome after first purchase — delight and retention
**Duration:** 15-30 seconds
**Format:** Vertical for WhatsApp delivery

**Kitz Workflow:**
1. Customer makes first purchase
2. Kitz triggers welcome video generation (via Tavus or HeyGen API)
3. Personalize: customer name, product purchased, next steps
4. Deliver via WhatsApp within 1 hour of purchase
5. Track: open rate, watch completion, repeat purchase rate

### 5.8 Ad Creative Videos

**Purpose:** Paid advertising on Meta, TikTok, Google
**Duration:** 15-30 seconds (hook in first 3 seconds)
**Format:** Multiple variants per campaign

```typescript
interface AdCreativeConfig {
  campaign: {
    objective: 'awareness' | 'consideration' | 'conversion';
    platform: 'meta' | 'tiktok' | 'google';
    budget: number;
  };
  structure: {
    hook: string;           // First 3 seconds — must stop the scroll
    problem: string;        // Pain point
    solution: string;       // Your product/service
    proof?: string;         // Social proof / testimonial
    cta: string;            // Call to action
  };
  variants: number;         // Generate 3-5 variants for A/B testing
  styles: ('ugc' | 'polished' | 'testimonial' | 'product-demo' | 'before-after')[];
  targetAudience: {
    ageRange: [number, number];
    gender?: 'male' | 'female' | 'all';
    interests: string[];
    location: string;       // Country or city
  };
}
```

**Hook structures that work for LatAm SMBs:**
- "No vas a creer lo que pasó..." (You won't believe what happened...)
- "El secreto que nadie te dice sobre..." (The secret nobody tells you about...)
- "Antes vs Después" (Before vs After)
- "POV: cuando descubres [product]" (POV: when you discover [product])
- "3 razones por las que necesitas..." (3 reasons why you need...)

---

## 6. Video Specifications by Platform

### Current Platform Specs (2026)

| Platform | Format | Aspect Ratio | Optimal Duration | Max Duration | Max File Size | Resolution | Captions |
|---|---|---|---|---|---|---|---|
| **Instagram Reels** | MP4, MOV | 9:16 | 15-45s | 20 min | 4GB | 1080x1920 | Auto + burned-in |
| **TikTok** | MP4, MOV | 9:16 | 15-30s | 10 min (in-app), 60 min (upload) | 500MB (web), 287MB (mobile) | 1080x1920 | Auto + burned-in |
| **YouTube Shorts** | MP4 | 9:16 | 15-35s | 3 min | — | 1080x1920 | Auto |
| **YouTube Long** | MP4, MOV | 16:9 | 8-15 min | 12 hours | 256GB | 3840x2160 | Auto + SRT/VTT |
| **Facebook Reels** | MP4 | 9:16 | 15-30s | 90s | 4GB | 1080x1920 | Auto + burned-in |
| **Facebook Feed** | MP4 | 1:1 or 16:9 | 15-60s | 240 min | 10GB | 1080p | Recommended |
| **WhatsApp Status** | MP4 | 9:16 | 15-30s | 30s | 16MB | 720p | Burned-in only |
| **WhatsApp Message** | MP4 | Any | 15-60s | ~3 min (16MB) | 16MB | 720p | Burned-in only |
| **WhatsApp Document** | MP4 | Any | Any | Any | 2GB | Original | None |
| **LinkedIn** | MP4 | 1:1 or 16:9 | 30-90s | 10 min | 5GB | 1080p | SRT recommended |
| **Twitter/X** | MP4 | 16:9 or 1:1 | 15-45s | 2 min 20s | 512MB | 1080p | SRT |
| **Pinterest** | MP4 | 2:3 or 9:16 | 6-15s | 15 min | 2GB | 1080p | — |
| **Google Ads** | MP4 | 16:9, 1:1, 9:16 | 15-30s | Varies | — | 1080p | Recommended |
| **Meta Ads** | MP4 | 9:16, 1:1, 4:5 | 15-30s | 240s | 4GB | 1080p | Strongly recommended |

### Kitz Multi-Platform Export Configuration

```typescript
interface PlatformExportConfig {
  platform: string;
  aspectRatio: string;
  width: number;
  height: number;
  maxDuration: number;      // seconds
  maxFileSize: number;      // bytes
  codec: string;
  audioBitrate: string;
  captionStyle: 'none' | 'burned-in' | 'srt' | 'both';
  recommendedBitrate: string;
}

const PLATFORM_CONFIGS: Record<string, PlatformExportConfig> = {
  'instagram-reels': {
    platform: 'Instagram Reels',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    maxDuration: 90,
    maxFileSize: 4_000_000_000,
    codec: 'h264',
    audioBitrate: '192k',
    captionStyle: 'burned-in',
    recommendedBitrate: '6000k',
  },
  'tiktok': {
    platform: 'TikTok',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    maxDuration: 600,
    maxFileSize: 500_000_000,
    codec: 'h264',
    audioBitrate: '192k',
    captionStyle: 'burned-in',
    recommendedBitrate: '6000k',
  },
  'youtube-shorts': {
    platform: 'YouTube Shorts',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    maxDuration: 180,
    maxFileSize: 500_000_000,
    codec: 'h264',
    audioBitrate: '192k',
    captionStyle: 'burned-in',
    recommendedBitrate: '6000k',
  },
  'whatsapp-status': {
    platform: 'WhatsApp Status',
    aspectRatio: '9:16',
    width: 720,
    height: 1280,
    maxDuration: 30,
    maxFileSize: 16_000_000,
    codec: 'h264',
    audioBitrate: '128k',
    captionStyle: 'burned-in',
    recommendedBitrate: '1500k',
  },
  'whatsapp-message': {
    platform: 'WhatsApp Message',
    aspectRatio: '9:16',
    width: 720,
    height: 1280,
    maxDuration: 180,
    maxFileSize: 16_000_000,
    codec: 'h264',
    audioBitrate: '128k',
    captionStyle: 'burned-in',
    recommendedBitrate: '1200k',
  },
  'facebook-feed': {
    platform: 'Facebook Feed',
    aspectRatio: '1:1',
    width: 1080,
    height: 1080,
    maxDuration: 120,
    maxFileSize: 10_000_000_000,
    codec: 'h264',
    audioBitrate: '192k',
    captionStyle: 'burned-in',
    recommendedBitrate: '5000k',
  },
  'linkedin': {
    platform: 'LinkedIn',
    aspectRatio: '1:1',
    width: 1080,
    height: 1080,
    maxDuration: 600,
    maxFileSize: 5_000_000_000,
    codec: 'h264',
    audioBitrate: '192k',
    captionStyle: 'srt',
    recommendedBitrate: '5000k',
  },
};

// Multi-platform export function
async function exportForAllPlatforms(
  sourceVideo: Buffer,
  platforms: string[],
  captions?: SubtitleTrack
): Promise<Map<string, Buffer>> {
  const exports = new Map<string, Buffer>();

  for (const platform of platforms) {
    const config = PLATFORM_CONFIGS[platform];
    if (!config) continue;

    const exported = await processVideoForPlatform(sourceVideo, config, captions);
    exports.set(platform, exported);
  }

  return exports;
}
```

---

## 7. Auto-Captioning & Subtitles

### Why Captions Are CRITICAL

- **85% of social media video** is watched without sound
- **80% of viewers** are more likely to watch a video to completion when captions are available
- Captions improve accessibility for hearing-impaired users
- Captions boost SEO (search engines can index the text)
- Animated word-by-word captions are a dominant trend on TikTok/Reels
- For LatAm specifically: bilingual captions (Spanish + English) expand audience to US Hispanic market

### Speech-to-Text API Comparison

| Provider | Base Price | Spanish Accuracy | Real-Time | Features | Best For |
|---|---|---|---|---|---|
| **AssemblyAI Universal-2** | $0.15/hr ($0.0025/min) | Very Good (8.4% WER overall) | Yes | Sentiment, topics, PII redaction, summarization | Intelligence-rich captioning |
| **Deepgram Nova-3** | $0.46/hr ($0.0077/min) | Good | Yes (fastest) | Low latency, WebVTT/SRT output, custom vocabulary | Real-time captioning |
| **OpenAI Whisper** | Free (self-hosted) / $0.006/min (API) | Excellent (50+ languages) | No (batch) | Gold standard accuracy, handles accents and noise | Batch transcription |
| **Google Cloud STT** | $0.006-$0.024/min | Excellent (LatAm variants) | Yes | Speaker diarization, word timestamps, auto-punctuation | Multi-variant Spanish |
| **Rev.ai** | $0.02/min | Good | Yes | Human-level accuracy claims | High accuracy needs |

### Caption Styling Strategies

For maximum engagement on TikTok/Reels, animated word-by-word captions outperform static subtitles by 2-3x in watch time. The dominant styles:

1. **Word-by-word highlight:** Each word highlights as it's spoken (TikTok style)
2. **Karaoke style:** Words appear one at a time with animation
3. **Block subtitles:** 2-3 word chunks appear in sequence
4. **Full-sentence static:** Traditional subtitle at bottom of screen

```typescript
interface CaptionConfig {
  provider: 'assemblyai' | 'deepgram' | 'whisper' | 'google-cloud';
  language: string;
  style: 'word-highlight' | 'karaoke' | 'block' | 'static';
  position: 'top' | 'center' | 'bottom';
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  highlightColor: string;
  backgroundColor?: string;
  outlineColor?: string;
  outlineWidth?: number;
  maxWordsPerLine: number;
  animation: 'fade' | 'pop' | 'slide' | 'none';
}

// Caption generation workflow
async function generateCaptions(
  videoUrl: string,
  config: CaptionConfig
): Promise<{ srt: string; vtt: string; wordTimestamps: WordTimestamp[] }> {
  // Step 1: Transcribe audio
  const transcription = await transcribeAudio(videoUrl, config.provider, config.language);

  // Step 2: Generate word-level timestamps
  const wordTimestamps = transcription.words.map(word => ({
    text: word.text,
    start: word.start,
    end: word.end,
    confidence: word.confidence,
  }));

  // Step 3: Generate SRT/VTT files
  const srt = generateSRT(wordTimestamps, config.maxWordsPerLine);
  const vtt = generateVTT(wordTimestamps, config.maxWordsPerLine);

  return { srt, vtt, wordTimestamps };
}

// Bilingual caption generation (Spanish + English)
async function generateBilingualCaptions(
  videoUrl: string,
  primaryLanguage: string,
  secondaryLanguage: string
): Promise<{ primary: string; secondary: string; combined: string }> {
  const primaryCaptions = await transcribeAudio(videoUrl, 'whisper', primaryLanguage);
  const translatedCaptions = await translateCaptions(primaryCaptions, secondaryLanguage);

  // Combine: primary on top, secondary on bottom
  const combined = mergeBilingualSRT(primaryCaptions, translatedCaptions);
  return {
    primary: generateSRT(primaryCaptions.words, 6),
    secondary: generateSRT(translatedCaptions.words, 6),
    combined,
  };
}
```

### Spanish Auto-Caption Quality Notes

- **OpenAI Whisper** provides the highest accuracy for Spanish overall, handling LatAm accents, background noise, and regional vocabulary well
- **Google Cloud STT** offers the most LatAm-specific variants (Mexico, Colombia, Argentina, Chile, Peru) with tuned models
- **AssemblyAI Universal-2** works well for Spanish without needing to manually select the dialect — automatic language detection
- **Key issue:** Slang, regional expressions, and code-switching (Spanish-English mix common in US Hispanic communities) can reduce accuracy. Custom vocabulary / prompt engineering helps.

---

## 8. Video for WhatsApp (Critical for LatAm)

### Why WhatsApp Video Matters

WhatsApp is the operating system of LatAm business communication:

- **90%+ penetration** in Brazil, Mexico, Argentina
- **148 million WhatsApp users** in Brazil alone (98% of smartphone users)
- **74 million** in Mexico
- **400 million+ monthly active users** of WhatsApp Business globally (fastest growth in LatAm)
- **2.2 billion messages** exchanged daily between businesses and customers
- **91% customer satisfaction** for WhatsApp-based service (higher than email or SMS)
- **35%+ business account growth** year-over-year in LatAm

### WhatsApp Video Constraints

The 16MB file size limit is the single biggest technical constraint for video in LatAm. This limit determines every technical decision.

```typescript
interface WhatsAppVideoConfig {
  // Hard constraints
  maxFileSize: 16_000_000;          // 16MB — NON-NEGOTIABLE
  statusMaxDuration: 30;            // seconds for WhatsApp Status
  documentMaxFileSize: 2_000_000_000; // 2GB as document (preserves quality)

  // Recommended settings for direct message video
  recommendedResolution: '720p';    // 1280x720 or 720x1280 (vertical)
  recommendedBitrate: '1200kbps';   // Video bitrate
  recommendedAudioBitrate: '128kbps';
  recommendedFormat: 'mp4';
  recommendedCodec: 'H.264';
  recommendedProfile: 'baseline';   // Widest device compatibility
  recommendedLevel: '3.0';          // Compatible with older Android devices
  recommendedFrameRate: 25;         // fps
  pixelFormat: 'yuv420p';           // Universal compatibility

  // Duration estimates within 16MB at recommended settings
  estimatedMaxDuration: {
    '720p_1200kbps': 90,    // ~90 seconds
    '720p_1500kbps': 75,    // ~75 seconds
    '480p_800kbps': 140,    // ~140 seconds
    '720p_900kbps': 120,    // ~120 seconds
  };
}
```

### WhatsApp Video Optimization Pipeline

```typescript
import ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';

const WHATSAPP_MAX_SIZE = 16 * 1024 * 1024; // 16MB

interface WhatsAppOptimizationResult {
  buffer: Buffer;
  fileSize: number;
  duration: number;
  resolution: string;
  bitrate: number;
  compressionRatio: number;
  deliveryMethod: 'direct' | 'document' | 'link';
}

async function optimizeVideoForWhatsApp(
  inputPath: string,
  targetDuration?: number
): Promise<WhatsAppOptimizationResult> {
  // Step 1: Analyze source video
  const sourceInfo = await getVideoInfo(inputPath);
  const sourceSizeBytes = sourceInfo.fileSize;

  // Step 2: If already under 16MB and good format, return as-is
  if (sourceSizeBytes < WHATSAPP_MAX_SIZE && sourceInfo.codec === 'h264') {
    return {
      buffer: await readFileAsBuffer(inputPath),
      fileSize: sourceSizeBytes,
      duration: sourceInfo.duration,
      resolution: `${sourceInfo.width}x${sourceInfo.height}`,
      bitrate: sourceInfo.bitrate,
      compressionRatio: 1,
      deliveryMethod: 'direct',
    };
  }

  // Step 3: Calculate target bitrate for 16MB constraint
  const duration = targetDuration || sourceInfo.duration;
  const audioBitrateKbps = 128;
  const targetTotalBitrateKbps = Math.floor(
    (WHATSAPP_MAX_SIZE * 8) / (duration * 1000) * 0.9 // 90% safety margin
  );
  const videoBitrateKbps = Math.max(
    targetTotalBitrateKbps - audioBitrateKbps,
    400 // Minimum acceptable video bitrate
  );

  // Step 4: Determine resolution based on available bitrate
  let scale: string;
  if (videoBitrateKbps >= 1200) {
    scale = 'scale=-2:720';        // 720p
  } else if (videoBitrateKbps >= 600) {
    scale = 'scale=-2:480';        // 480p
  } else {
    scale = 'scale=-2:360';        // 360p (last resort)
  }

  // Step 5: Two-pass encoding for optimal quality at target size
  const outputPath = `/tmp/whatsapp_${Date.now()}.mp4`;

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .videoBitrate(`${videoBitrateKbps}k`)
      .audioCodec('aac')
      .audioBitrate(`${audioBitrateKbps}k`)
      .audioFrequency(44100)
      .outputOptions([
        `-vf ${scale}`,
        '-profile:v baseline',
        '-level 3.0',
        '-pix_fmt yuv420p',
        '-r 25',
        '-movflags +faststart',    // Enable progressive download
        '-preset slow',             // Better compression
        '-crf 28',                  // Quality factor
      ])
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });

  const outputBuffer = await readFileAsBuffer(outputPath);
  const outputSize = outputBuffer.length;

  // Step 6: Verify size constraint
  if (outputSize > WHATSAPP_MAX_SIZE) {
    // Re-encode with lower bitrate or suggest document/link delivery
    if (videoBitrateKbps <= 400) {
      return {
        buffer: outputBuffer,
        fileSize: outputSize,
        duration,
        resolution: scale,
        bitrate: videoBitrateKbps,
        compressionRatio: sourceSizeBytes / outputSize,
        deliveryMethod: 'document', // Send as document to preserve quality
      };
    }
    // Recursive with lower bitrate
    return optimizeVideoForWhatsApp(inputPath, targetDuration);
  }

  return {
    buffer: outputBuffer,
    fileSize: outputSize,
    duration,
    resolution: scale,
    bitrate: videoBitrateKbps,
    compressionRatio: sourceSizeBytes / outputSize,
    deliveryMethod: 'direct',
  };
}
```

### WhatsApp Video Use Cases for SMBs

| Use Case | Description | Duration | Trigger |
|---|---|---|---|
| **Product Demo** | Show product in action, send to leads | 30-60s | Lead inquires about product |
| **Video Receipt** | Branded thank-you with order summary | 15s | After purchase |
| **Personalized Welcome** | AI avatar greets by name | 15-20s | First purchase / signup |
| **Before/After** | Transformation results (beauty, construction, fitness) | 15-30s | Service completion |
| **Video Testimonial** | Customer review as shareable video | 30-45s | Customer submits review |
| **FAQ Answer** | AI avatar answers common question | 30-60s | Customer asks common question |
| **Appointment Reminder** | Branded reminder with directions | 10-15s | 24h before appointment |
| **Seasonal Greeting** | Holiday/event greeting with branding | 10-15s | Calendar events |
| **Flash Sale Alert** | Urgent promo with countdown feel | 10-20s | Sale launch |
| **Tutorial/How-To** | Product usage guide | 45-90s | Post-purchase follow-up |

### WhatsApp Video Quality Preservation Strategies

1. **Send as Document:** WhatsApp allows sending files up to 2GB as documents, preserving original quality. For high-quality videos (product demos), instruct users to "open as document."

2. **Cloud Link Approach:** Upload video to CDN (Cloudflare R2, AWS S3), send clickable link via WhatsApp. Video plays in browser at full quality.

3. **Hybrid Approach (Recommended for Kitz):**
   - Generate video at 1080p (master)
   - Auto-compress to WhatsApp-optimized version (<16MB)
   - Send compressed version via WhatsApp with text: "Video en HD: [link]"
   - Customer gets instant preview + option for full quality

---

## 9. Video Content-to-Ads Loop Integration

This is the core growth engine for Kitz — an automated feedback loop that turns organic video content into paid ads based on performance data.

### The Loop

```
GENERATE -> PUBLISH -> MEASURE -> PROMOTE -> LEARN -> GENERATE (improved)
```

### Detailed Workflow

```typescript
interface VideoContentLoop {
  // Phase 1: GENERATE
  generate: {
    input: ContentBrief;
    variantsPerTopic: number;     // 3-5 variants
    variations: {
      hooks: string[];            // Different opening hooks
      styles: VideoStyle[];       // UGC, polished, testimonial, etc.
      durations: number[];        // 15s, 30s, 60s
      musicTracks: string[];      // Different background music
    };
    output: Video[];
  };

  // Phase 2: PUBLISH
  publish: {
    platforms: Platform[];         // Reels, TikTok, Shorts
    schedule: PublishSchedule;     // Optimal posting times per platform
    hashtags: string[];            // Auto-generated relevant hashtags
    captions: string[];            // Platform-specific captions
  };

  // Phase 3: MEASURE (48-72 hours after publish)
  measure: {
    metrics: {
      views: number;
      completionRate: number;      // % who watched to end
      avgWatchTime: number;        // seconds
      engagementRate: number;      // likes + comments + shares / views
      shares: number;
      saves: number;
      clickThroughRate: number;
      profileVisits: number;
      followerGain: number;
    };
    benchmarks: {
      industryAvgEngagement: number;
      accountAvgEngagement: number;
      platformAvgCompletion: number;
    };
  };

  // Phase 4: PROMOTE (if performance exceeds threshold)
  promote: {
    threshold: {
      minViews: number;            // e.g., 1000+
      minEngagementRate: number;   // e.g., 5%+
      minCompletionRate: number;   // e.g., 40%+
    };
    adConfig: {
      platform: 'meta-spark-ads' | 'tiktok-spark-ads' | 'youtube-promote';
      budget: number;
      duration: number;            // days
      targeting: AudienceTargeting;
    };
    adTypes: {
      sparkAds: boolean;           // Boost organic post as ad (TikTok/Meta)
      customAd: boolean;           // Create new ad from video
    };
  };

  // Phase 5: LEARN
  learn: {
    winningAttributes: {
      bestHookStyle: string;
      bestDuration: number;
      bestMusicType: string;
      bestPostingTime: string;
      bestVisualStyle: string;
      bestCTAType: string;
    };
    contentScore: number;          // 0-100 predictive performance score
    recommendations: string[];     // AI suggestions for next batch
  };
}

// Scoring function for promotion decisions
function scoreForPromotion(metrics: VideoMetrics, benchmarks: Benchmarks): number {
  const viewsScore = Math.min(metrics.views / benchmarks.minViews, 1) * 25;
  const engagementScore = Math.min(
    metrics.engagementRate / benchmarks.industryAvgEngagement, 1
  ) * 30;
  const completionScore = Math.min(
    metrics.completionRate / benchmarks.platformAvgCompletion, 1
  ) * 25;
  const shareScore = Math.min(metrics.shares / (metrics.views * 0.02), 1) * 20;

  return viewsScore + engagementScore + completionScore + shareScore;
  // Score > 70 = promote as ad
  // Score > 50 = boost organically
  // Score < 50 = learn and iterate
}
```

### TikTok Spark Ads Integration

Spark Ads allow businesses to boost their organic posts (or creator posts with permission) as paid ads. This is the most cost-effective ad format because:

- Uses already-validated organic content (proven engagement)
- Maintains social proof (likes, comments, shares carry over)
- Lower CPM than traditional ad creative ($4.82-$10.00 TikTok vs $8.19-$12.00 Reels)
- Feels native to the platform (not "ad-like")

**Kitz auto-promotion workflow:**
1. Video scores > 70 on promotion score
2. Kitz notifies SMB: "Tu video sobre [topic] esta funcionando muy bien! Quieres promocionarlo?"
3. SMB approves via WhatsApp (one-tap response)
4. Kitz activates Spark Ad with recommended budget and targeting
5. Reports performance daily via WhatsApp

---

## 10. Kitz Video Engine Architecture

### Complete TypeScript Interface

```typescript
// ============================================
// KITZ VIDEO ENGINE — Core Architecture
// ============================================

// --- Core Types ---

interface Video {
  id: string;
  url: string;
  thumbnailUrl: string;
  duration: number;           // seconds
  width: number;
  height: number;
  aspectRatio: string;
  fileSize: number;           // bytes
  codec: string;
  format: string;
  createdAt: Date;
  metadata: VideoMetadata;
}

interface VideoMetadata {
  type: VideoType;
  language: string;
  hasCaptions: boolean;
  captionLanguages: string[];
  hasVoiceover: boolean;
  voiceProvider?: string;
  generationMethod: 'template' | 'ai-generated' | 'user-uploaded' | 'avatar';
  templateId?: string;
  renderProvider?: 'remotion' | 'creatomate' | 'shotstack';
  cost: number;               // USD cost to generate
}

type VideoType =
  | 'product-showcase'
  | 'testimonial'
  | 'behind-the-scenes'
  | 'tutorial'
  | 'promotion'
  | 'faq'
  | 'welcome'
  | 'ad-creative'
  | 'ugc-style'
  | 'before-after';

type Platform =
  | 'instagram-reels'
  | 'tiktok'
  | 'youtube-shorts'
  | 'youtube-long'
  | 'facebook-reels'
  | 'facebook-feed'
  | 'whatsapp-status'
  | 'whatsapp-message'
  | 'linkedin'
  | 'twitter'
  | 'pinterest'
  | 'google-ads'
  | 'meta-ads';

interface Avatar {
  id: string;
  provider: 'heygen' | 'synthesia' | 'd-id' | 'colossyan' | 'tavus';
  name: string;
  gender: 'male' | 'female';
  style: 'professional' | 'casual' | 'ugc';
  languages: string[];
  previewUrl: string;
}

interface Voice {
  id: string;
  provider: 'elevenlabs' | 'google-tts' | 'azure-tts' | 'amazon-polly' | 'play-ht';
  name: string;
  language: string;
  accent: string;            // e.g., 'es-MX', 'es-CO', 'pt-BR'
  gender: 'male' | 'female';
  isCloned: boolean;         // Is this the SMB owner's cloned voice?
  sampleUrl: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  category: string;
  tags: string[];
}

interface CustomerReview {
  id: string;
  customerName: string;
  rating: number;
  text?: string;
  videoUrl?: string;
  audioUrl?: string;
  date: Date;
  product?: Product;
  verified: boolean;
}

interface AdCampaign {
  id: string;
  objective: 'awareness' | 'traffic' | 'conversion';
  platform: Platform;
  budget: number;
  targeting: AudienceTargeting;
  startDate: Date;
  endDate: Date;
}

interface AudienceTargeting {
  locations: string[];
  ageRange: [number, number];
  gender?: 'male' | 'female' | 'all';
  interests: string[];
  lookalikes?: string[];
}

interface Contact {
  id: string;
  name: string;
  phone: string;           // WhatsApp number
  email?: string;
  tags: string[];
  lastPurchaseDate?: Date;
}

interface VideoMetrics {
  videoId: string;
  postId: string;
  platform: Platform;
  views: number;
  uniqueViews: number;
  avgWatchTime: number;
  completionRate: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clickThroughRate: number;
  engagementRate: number;
  reachTotal: number;
  impressions: number;
  followerGain: number;
  measuredAt: Date;
}

// --- Core Engine Interface ---

interface KitzVideoEngine {
  // ============================
  // CONTENT GENERATION
  // ============================

  /**
   * Generate a product showcase video from catalog data.
   * Uses template-based rendering (Remotion/Creatomate).
   * Auto-selects template based on product category.
   */
  generateProductVideo(
    product: Product,
    options?: {
      template?: string;
      style?: 'elegant' | 'bold' | 'minimal' | 'playful';
      music?: string;
      duration?: number;
      includeVoiceover?: boolean;
      voiceId?: string;
    }
  ): Promise<Video>;

  /**
   * Generate multiple product videos for catalog marketing.
   * Batch renders all products in parallel.
   */
  generateCatalogVideos(
    products: Product[],
    template: string,
    batchSize?: number
  ): Promise<Video[]>;

  /**
   * Process a customer review into a branded testimonial video.
   * If video review: trim, add branding, captions, music.
   * If text review: create video with animated text + AI voice.
   */
  generateTestimonialVideo(
    review: CustomerReview,
    options?: {
      style?: 'authentic' | 'polished' | 'minimal';
      addBranding?: boolean;
      addCaptions?: boolean;
      addStarRating?: boolean;
    }
  ): Promise<Video>;

  /**
   * Generate ad creative videos with multiple variants for A/B testing.
   * Returns array of variants with different hooks, styles, and durations.
   */
  generateAdVideo(
    campaign: AdCampaign,
    variants: number,
    options?: {
      hooks: string[];
      styles: ('ugc' | 'polished' | 'testimonial' | 'demo')[];
      durations: number[];
    }
  ): Promise<Video[]>;

  /**
   * Generate an AI avatar spokesperson video.
   * Avatar speaks the provided script in the specified voice.
   */
  generateAvatarVideo(
    script: string,
    avatar: Avatar,
    voice: Voice,
    options?: {
      background?: string;
      overlay?: string;
      duration?: number;
    }
  ): Promise<Video>;

  /**
   * Generate a personalized video for a specific contact.
   * Inserts customer name and personalized details.
   */
  generatePersonalizedVideo(
    template: string,
    contact: Contact,
    personalization: Record<string, string>
  ): Promise<Video>;

  /**
   * Generate a promotional video for a sale/event.
   */
  generatePromoVideo(
    promo: {
      headline: string;
      discount?: number;
      products?: Product[];
      endDate?: Date;
      theme?: string;
    },
    template: string
  ): Promise<Video>;

  // ============================
  // PROCESSING
  // ============================

  /**
   * Add auto-generated captions to a video.
   * Transcribes audio, generates word-level timestamps,
   * renders animated captions in specified style.
   */
  addCaptions(
    video: Video,
    options: {
      language: string;
      style: 'word-highlight' | 'karaoke' | 'block' | 'static';
      position: 'top' | 'center' | 'bottom';
      fontConfig?: CaptionFontConfig;
      secondaryLanguage?: string;   // For bilingual captions
    }
  ): Promise<Video>;

  /**
   * Resize and reformat video for a specific platform.
   * Handles aspect ratio conversion, resolution, file size limits.
   */
  resizeForPlatform(
    video: Video,
    platform: Platform
  ): Promise<Video>;

  /**
   * Export video to multiple platforms simultaneously.
   * Returns a map of platform -> optimized video.
   */
  exportMultiPlatform(
    video: Video,
    platforms: Platform[]
  ): Promise<Map<Platform, Video>>;

  /**
   * Compress and optimize video for WhatsApp delivery.
   * Enforces 16MB limit, H.264 baseline profile, optimal bitrate.
   */
  compressForWhatsApp(
    video: Video,
    type: 'message' | 'status'
  ): Promise<Video>;

  /**
   * Add voiceover to a video.
   * Generates TTS audio and mixes with video.
   */
  addVoiceover(
    video: Video,
    script: string,
    voice: Voice,
    options?: {
      volume: number;         // 0-1
      backgroundMusicVolume: number;
      timing: 'auto' | 'manual';
    }
  ): Promise<Video>;

  /**
   * Apply branding to a video (logo, colors, intro/outro).
   */
  applyBranding(
    video: Video,
    branding: {
      logoUrl: string;
      logoPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
      primaryColor: string;
      introTemplate?: string;
      outroTemplate?: string;
    }
  ): Promise<Video>;

  // ============================
  // DISTRIBUTION
  // ============================

  /**
   * Publish video to a social media platform.
   * Handles platform-specific formatting, captions, hashtags.
   */
  publishToPlatform(
    video: Video,
    platform: Platform,
    options: {
      caption: string;
      hashtags: string[];
      schedule?: Date;
      location?: string;
      coverImage?: string;
    }
  ): Promise<string>;  // Returns post ID

  /**
   * Send video via WhatsApp to a specific contact.
   * Auto-compresses if needed, handles delivery confirmation.
   */
  sendViaWhatsApp(
    video: Video,
    contact: Contact,
    options?: {
      message?: string;
      type: 'message' | 'status';
      includeHDLink?: boolean;  // Include link to full-quality version
    }
  ): Promise<string>;  // Returns message ID

  /**
   * Broadcast video to multiple WhatsApp contacts.
   * Personalizes for each contact if template supports it.
   */
  broadcastViaWhatsApp(
    video: Video,
    contacts: Contact[],
    options?: {
      message?: string;
      personalize?: boolean;
    }
  ): Promise<Map<string, string>>;  // Contact ID -> Message ID

  // ============================
  // ANALYTICS
  // ============================

  /**
   * Get performance metrics for a published video.
   */
  getVideoPerformance(
    postId: string,
    platform: Platform
  ): Promise<VideoMetrics>;

  /**
   * Score a video's performance to determine if it should be promoted as an ad.
   * Returns 0-100 score. >70 = auto-promote, >50 = suggest promotion.
   */
  scoreForPromotion(
    metrics: VideoMetrics
  ): number;

  /**
   * Get aggregate analytics across all videos.
   */
  getVideoAnalyticsDashboard(
    dateRange: { start: Date; end: Date },
    platforms?: Platform[]
  ): Promise<VideoAnalyticsDashboard>;

  /**
   * Get AI-powered content recommendations based on performance history.
   */
  getContentRecommendations(
    businessId: string
  ): Promise<ContentRecommendation[]>;
}

interface VideoAnalyticsDashboard {
  totalVideos: number;
  totalViews: number;
  avgEngagementRate: number;
  avgCompletionRate: number;
  topPerformingVideos: VideoMetrics[];
  performanceByPlatform: Map<Platform, PlatformSummary>;
  performanceByType: Map<VideoType, TypeSummary>;
  bestPostingTimes: Map<Platform, string[]>;
  audienceGrowth: { date: Date; followers: number }[];
  estimatedROI: {
    totalSpent: number;
    estimatedRevenue: number;
    roi: number;
  };
}

interface ContentRecommendation {
  type: VideoType;
  topic: string;
  reasoning: string;
  predictedEngagement: number;
  suggestedHook: string;
  suggestedStyle: string;
  suggestedDuration: number;
  suggestedPlatforms: Platform[];
  priority: 'high' | 'medium' | 'low';
}
```

---

## 11. Video SEO & Discovery

### How Video SEO Works in 2025-2026

Video SEO has evolved significantly. Key principles:

1. **25%+ of Google search results** now include a video snippet
2. **YouTube algorithm** emphasizes viewer retention over raw watch time
3. **YouTube Shorts** rank differently than long-form — based on audio, hashtags, and hashtag-search combinations rather than traditional titles/descriptions
4. **AI Search (Google SGE, Perplexity)** increasingly surfaces well-structured video content

### SEO Optimization Checklist for Each Video

```typescript
interface VideoSEOConfig {
  // Metadata
  title: string;               // Primary keyword early, compelling, <70 chars
  description: string;         // Primary keyword in first 125 characters
  tags: string[];              // Relevant keywords and phrases
  hashtags: string[];          // 3-5 relevant hashtags
  category: string;

  // Accessibility & Discoverability
  captions: {
    srt: string;              // Clean SRT file with keywords naturally spoken
    language: string;
  };
  transcript: string;          // Full text transcript for indexing
  timestamps: Array<{          // Chapter markers for long-form
    time: string;
    label: string;
  }>;

  // Visual
  thumbnail: {
    url: string;               // Custom thumbnail with text overlay
    altText: string;           // Descriptive alt text
  };

  // Schema Markup (for website embeds)
  schema: {
    '@type': 'VideoObject';
    name: string;
    description: string;
    thumbnailUrl: string;
    uploadDate: string;
    duration: string;          // ISO 8601 format
    contentUrl: string;
    embedUrl: string;
    interactionStatistic: {
      '@type': 'InteractionCounter';
      interactionType: string;
      userInteractionCount: number;
    };
  };
}
```

### Short-Form Video SEO Strategies for LatAm SMBs

1. **Hook in First 3 Seconds:** Algorithm measures whether viewers swipe away — bold question, surprising stat, or eye-catching visual must lead
2. **Use Spanish Keywords Naturally:** Speak target keywords within the first 10 seconds (algorithms analyze audio)
3. **Add #Shorts / #Reels hashtags** to tap into discovery shelves
4. **Create Series Content:** "Dia 1 de...", "Parte 2", numbered series boost follow-through
5. **Answer Common Questions:** Structure videos around "como", "que es", "por que" queries
6. **Localize Keywords:** Use city/country-specific terms (e.g., "restaurantes en CDMX" not generic "restaurantes")
7. **Post Consistency:** Algorithm rewards consistent posting cadence (daily or every other day for short-form)
8. **Cross-Post Strategically:** Same content, platform-specific captions and hashtags

---

## 12. Video Performance Analytics

### Key Metrics Framework

| Metric | What It Measures | Good Benchmark | Why It Matters |
|---|---|---|---|
| **View Count** | Reach / distribution | 500+ per video (SMB) | Algorithm signal |
| **Avg Watch Time** | Content quality | >15s for short-form | Primary ranking factor |
| **Completion Rate** | Content quality | 40-60% (short-form) | Algorithmic boost |
| **Engagement Rate** | Audience connection | 3-7% (TikTok), 1-5% (Reels) | Community building |
| **Share Rate** | Virality potential | >1% of views | Organic amplification |
| **Save Rate** | Content value | >2% of views | High-intent signal |
| **Click-Through Rate** | Conversion intent | 1-3% | Business impact |
| **Follower Gain/Video** | Growth rate | 5-50 per video | Long-term value |
| **Profile Visits** | Brand interest | 3-10% of viewers | Consideration signal |

### Analytics Integration for Kitz

```typescript
interface VideoAnalyticsService {
  // Collect metrics from all platforms
  collectMetrics(
    postIds: Map<Platform, string>,
    dateRange: { start: Date; end: Date }
  ): Promise<VideoMetrics[]>;

  // Compare video performance against account averages
  benchmarkVideo(
    metrics: VideoMetrics,
    accountHistory: VideoMetrics[]
  ): {
    performance: 'top-10%' | 'above-average' | 'average' | 'below-average';
    insights: string[];
    recommendations: string[];
  };

  // Identify winning patterns across all content
  identifyWinningPatterns(
    allMetrics: VideoMetrics[],
    allVideos: Video[]
  ): {
    bestVideoTypes: VideoType[];
    bestDurations: number[];
    bestPostingTimes: Map<Platform, string[]>;
    bestHookStyles: string[];
    bestMusicTypes: string[];
    bestCaptionStyles: string[];
  };

  // Generate weekly report for SMB owner (delivered via WhatsApp)
  generateWeeklyReport(
    businessId: string,
    week: { start: Date; end: Date }
  ): Promise<{
    summary: string;          // Natural language summary in Spanish
    topVideo: VideoMetrics;
    totalReach: number;
    totalEngagement: number;
    growthVsLastWeek: number; // percentage
    recommendations: string[];
    reportVideoUrl?: string;  // Optional: report as video itself
  }>;
}
```

### Completion Rate Benchmarks by Format

| Video Length | Expected Completion Rate | Notes |
|---|---|---|
| 0-15 seconds | 70-90% | Highest completion; TikTok sweet spot |
| 15-30 seconds | 50-70% | Ideal for most SMB content |
| 30-60 seconds | 35-55% | Requires strong hook and pacing |
| 1-3 minutes | 25-40% | Tutorial/demo format works best |
| 3-10 minutes | 15-30% | YouTube long-form territory |
| 10+ minutes | 10-20% | Only for highly engaged audiences |

---

## 13. UGC-Style Video Creation

### What is UGC-Style Video?

User-Generated Content (UGC) style videos are designed to look like they were created by a real customer or everyday person, rather than a brand. They feel authentic, raw, and trustworthy. In 2025-2026, UGC-style content consistently outperforms polished brand content on engagement metrics.

### AI UGC Tools

| Tool | Pricing | Key Feature | Avatars | Languages | Best For |
|---|---|---|---|---|---|
| **MakeUGC** | From $39/month | UGC-specific AI platform | 200+ | 40+ | Dedicated UGC creation |
| **Creatify** | From $29/month | Product URL to UGC ads | 900+ | 40+ | E-commerce UGC ads |
| **HeyGen UGC** | Included in $29/month | UGC-style avatar selection | 1,100+ | 175+ | Volume UGC at lowest cost |
| **SendShort** | From $19/month | TikTok/Reels-optimized UGC | Multiple | 20+ | Social-first UGC |
| **Argil** | From $29/month | Custom AI clone for UGC | Custom | Multiple | Personal brand UGC |

### UGC-Style Video Structures

**1. The Product Review (30s)**
```
[0-3s]  Hook: "I've been using [product] for 2 weeks and..."
[3-10s] Setup: Show product naturally (kitchen counter, desk, bathroom)
[10-20s] Experience: "Here's what happened..."
[20-27s] Result: Show results / transformation
[27-30s] CTA: "Link in bio" / "Worth every peso"
```

**2. The Unboxing (30-45s)**
```
[0-3s]  Hook: "My [product] finally arrived!"
[3-15s] Unboxing: Open package, show contents, react
[15-30s] First impression: Try/use product for first time
[30-45s] Verdict: Genuine reaction + recommendation
```

**3. The Day-in-My-Life (45-60s)**
```
[0-3s]  Hook: "A day in my life as a [profession/customer]"
[3-20s] Morning routine featuring product/service
[20-40s] Usage context: Show how product fits into real life
[40-55s] Subtle CTA embedded in narrative
[55-60s] End with genuine recommendation
```

### UGC Best Practices for LatAm SMBs

1. **Phone camera only:** Never use professional cameras — the imperfection IS the appeal
2. **Natural lighting:** Daylight, no studio lights
3. **Conversational tone:** Speak like talking to a friend, not presenting
4. **Local language:** Use regional slang and expressions (chilango, parcero, mano, etc.)
5. **Real locations:** Film in actual homes, streets, shops — not studios
6. **Imperfect framing:** Slightly off-center, natural angles
7. **Authentic reactions:** Real expressions, not rehearsed

---

## 14. Video Ad Creation Automation

### AI Ad Creative Platforms

| Tool | Pricing | Input | Output | Platforms | Languages |
|---|---|---|---|---|---|
| **Creatify** | $29+/month | Product URL | UGC-style video ads | TikTok, Meta, YouTube | 40+ |
| **Predis.ai** | $29+/month | Product/prompt | Ad creative + copy | All major | 20+ |
| **Zeely** | $29+/month | Product info | Platform-ready ads | FB, IG, TikTok | 20+ |
| **AdGPT** | $39+/month | Product URL/prompt | Complete ad creative | Meta, TikTok, Google | Multiple |
| **Canva Grow** | Part of Canva Pro | Design prompts | Static + video ads | All major | 100+ |
| **Nextify** | $19+/month | Product info | UGC + avatar ads | TikTok, Meta | 40+ |

### TikTok Native AI Ad Generation

TikTok Ads Manager includes a built-in "Generate with AI" feature that:
- Analyzes your product URL or ID
- Generates creative assets (video + images)
- Writes AI scripts and voiceovers
- Creates multiple variants automatically
- Optimizes based on performance data

### Ad Creative Structure (Hook-Problem-Solution-CTA)

```typescript
interface AdCreativeFramework {
  hook: {
    duration: 3;                    // seconds — MUST capture attention
    types: [
      'question',                   // "Sabias que...?"
      'shocking-stat',              // "El 80% de las personas..."
      'transformation',             // Before/after reveal
      'pov',                        // "POV: cuando descubres..."
      'controversy',                // "Unpopular opinion..."
      'curiosity-gap',              // "This changed everything..."
    ];
    requirements: [
      'Must work with sound OFF (visual hook)',
      'Text overlay in first frame',
      'Movement in first 0.5 seconds',
    ];
  };

  problem: {
    duration: 5;                    // seconds
    approach: 'Show the pain point visually, not just verbally';
  };

  solution: {
    duration: 10;                   // seconds
    approach: 'Demonstrate product solving the problem';
    elements: ['product-in-use', 'results', 'social-proof'];
  };

  cta: {
    duration: 5;                    // seconds
    types: [
      'Compra ahora',
      'Link en bio',
      'Agenda tu cita',
      'Escribe al WhatsApp',
      'Usa el codigo [X] para descuento',
    ];
    urgency: 'Add time pressure or scarcity when authentic';
  };

  totalDuration: '15-30 seconds';
  variants: '3-5 per campaign';
  testing: 'Run all variants for 48-72 hours, then kill losers and scale winners';
}
```

### Ad Variant Generation Strategy

For each ad campaign, Kitz should generate 3-5 variants:

| Variant | Hook Style | Visual Style | Duration | Rationale |
|---|---|---|---|---|
| A | Question | UGC phone footage | 15s | Test quick conversion |
| B | Before/After | Split screen | 30s | Test transformation proof |
| C | Testimonial | Customer speaking | 20s | Test social proof |
| D | POV | First-person camera | 15s | Test immersive format |
| E | Stat/Fact | Text + B-roll | 25s | Test educational approach |

---

## 15. Video Template Platforms

For SMBs who prefer to manually create or customize videos before Kitz full automation is available.

### Platform Comparison

| Platform | Free Plan | Pro Price | Templates | AI Features | API | Best For |
|---|---|---|---|---|---|---|
| **Canva Video** | Yes (limited) | $15/month | 1000+ | Magic Media, AI editing | Limited | Design-first creators |
| **InVideo** | Yes (watermark) | $15+/month | 5000+ | AI script, text-to-video | No | Template variety |
| **FlexClip** | Yes (limited) | $9.99/month | 1000+ | AI tools, text-to-video | No | Budget-friendly |
| **Kapwing** | Yes (generous) | $16/month | 100+ | AI editing, auto-resize | Limited | Quick editing |
| **CapCut** | Yes (1080p) | $9.99/month | 500+ | Auto-captions, effects | No | TikTok creators |
| **Veed.io** | Yes (limited) | $18/month | 100+ | AI avatars, subtitles | Yes (paid) | Subtitle-focused |

### Recommendation for Kitz SMBs

**Phase 1 (Now):** Recommend **CapCut** (free) for manual editing and **Canva** (familiar to most SMBs) for template-based videos.

**Phase 2 (Kitz integration):** Replace manual tools with Kitz-native video creation using Remotion templates + AI. SMB owners should not need to leave the Kitz app/WhatsApp to create videos.

---

## 16. Cost Analysis

### Per-Video Cost Estimates

| Approach | Cost/Video | Quality | Speed | Scalability | Kitz Integration |
|---|---|---|---|---|---|
| **DIY (Phone + CapCut)** | $0 (time cost only) | Variable | Slow (30-60 min) | Low | None |
| **Template API (Remotion)** | $0.001-$0.01 | Consistent | Fast (10-30s render) | Excellent | Native |
| **Template API (Creatomate)** | $0.11-$0.25/min | Consistent | Fast (30-60s render) | Excellent | REST API |
| **AI Avatar (HeyGen)** | $0.50-$2.00/min | Good | Medium (2-5 min) | Good | API |
| **AI Avatar (Synthesia)** | $1.00-$5.00/min | Excellent | Medium (3-10 min) | Good | API (Creator+) |
| **AI Generated (Kling)** | $0.10-$1.00 | Good-Excellent | Slow (1-5 min) | Limited | API |
| **AI Generated (Veo 3.1)** | $0.15-$0.40/sec | Excellent | Medium | Good | Gemini API |
| **AI Voiceover (ElevenLabs)** | $0.01-$0.05/min | Excellent | Instant | Excellent | API |
| **AI Voiceover (Google TTS)** | $0.004-$0.016/1K chars | Good | Instant | Excellent | API |
| **Auto-Caption (Whisper)** | Free (self-hosted) | Excellent | Fast | Excellent | Self-host |
| **Auto-Caption (AssemblyAI)** | $0.0025/min | Very Good | Fast | Excellent | API |
| **Professional Production** | $500-$5,000+ | Premium | Days-weeks | None | None |

### Monthly Budget Recommendations for SMBs

| Business Size | Monthly Budget | Approach | Videos/Month |
|---|---|---|---|
| **Micro** (1-2 people) | $0-$30 | CapCut + Canva free + phone | 8-12 |
| **Small** (3-10 people) | $30-$100 | Kitz templates + HeyGen Creator | 20-40 |
| **Medium** (10-50 people) | $100-$300 | Full Kitz engine + AI avatars + ads | 40-100 |
| **Growth** (50+ people) | $300-$1,000 | Enterprise Kitz + all AI tools + ad automation | 100-500 |

### ROI Calculation

Based on industry benchmarks:
- **Video content generates 49% faster ROI** than text content
- **93% conversion rate match** with other content formats
- **66% strongest ROI** from product videos specifically

**Example ROI for a restaurant in Mexico City:**
- Monthly video investment: $50 (Kitz Small plan)
- Videos produced: 30 (product, promo, behind-scenes)
- Average reach per video: 500 views (organic)
- Total monthly reach: 15,000
- Conversion to customer: 1% = 150 new visits
- Average ticket: $200 MXN = $30,000 MXN incremental revenue
- ROI: 30,000 MXN / 1,000 MXN investment = **30x ROI**

---

## 17. Implementation Roadmap

### Phase 1: Template-Based Video (Months 1-3)

**Goal:** Product showcases and promotional videos from catalog data

**Stack:**
- Remotion (React video templates) + Remotion Lambda (serverless rendering)
- FFmpeg (post-processing: compression, format conversion)
- 5-10 pre-built templates (product showcase, promo sale, new arrival, seasonal)

**Deliverables:**
- SMB uploads product images + price → Kitz generates 15-30s product video
- One-tap export to Reels, TikTok, WhatsApp
- Template customization (colors, fonts, logo)

**Cost:** ~$0.01 per video (Lambda compute only)

**Success Metric:** 80% of active SMBs generate at least 1 video/week

### Phase 2: AI Captions + WhatsApp Optimization (Months 3-5)

**Goal:** Auto-caption all video content in Spanish; optimize for WhatsApp delivery

**Stack:**
- OpenAI Whisper (self-hosted) or AssemblyAI for transcription
- FFmpeg for subtitle burning and WhatsApp compression
- Animated caption renderer (word-highlight style)

**Deliverables:**
- Auto-caption for any uploaded video (Spanish, Portuguese)
- One-tap WhatsApp optimization (<16MB, H.264 baseline)
- Caption style selector (animated, static, bilingual)

**Cost:** ~$0.01-$0.05 per video (transcription + rendering)

**Success Metric:** 90% of videos include captions; WhatsApp video delivery success rate >95%

### Phase 3: AI Avatar Videos (Months 5-8)

**Goal:** FAQ, welcome, and explainer videos with AI spokespersons

**Stack:**
- HeyGen API (primary) or D-ID API (alternative)
- ElevenLabs (premium voices) + Google Cloud TTS (volume voices)
- Kitz CRM integration (FAQ data, customer data for personalization)

**Deliverables:**
- FAQ video library auto-generated from CRM data
- Personalized welcome videos for new customers
- AI avatar product explainers
- Voice cloning for SMB owner's voice

**Cost:** $0.50-$2.00 per avatar video minute

**Success Metric:** 50% of SMBs have at least 5 FAQ videos; welcome video open rate >60%

### Phase 4: AI-Generated Video (Months 8-12)

**Goal:** Fully AI-generated creative video content

**Stack:**
- Kling AI API or Veo 3.1 (Gemini API) for generation
- AI script generation (via Kitz content AI)
- Automated A/B variant generation

**Deliverables:**
- AI generates 3-5 video variants per content brief
- Automated style/hook testing
- AI-generated B-roll and transitions
- Product videos from just a text description (no images needed)

**Cost:** $0.10-$1.00 per AI-generated video

**Success Metric:** AI-generated videos achieve comparable or better engagement than template videos

### Phase 5: Video Ads Loop (Months 10-14)

**Goal:** Automated organic-to-paid video pipeline

**Stack:**
- Platform APIs (Meta Marketing API, TikTok Marketing API)
- Performance scoring algorithm
- WhatsApp notification system for SMB approval
- Budget management and reporting

**Deliverables:**
- Automatic identification of top-performing organic videos
- One-tap promotion via WhatsApp notification
- Spark Ads (TikTok) and Boost (Meta) automation
- Weekly ROI reports via WhatsApp
- AI learns and improves content recommendations

**Cost:** Ad spend determined by SMB budget; Kitz management fee TBD

**Success Metric:** 20% of organic videos qualify for promotion; promoted videos achieve 3x+ ROAS

---

## 18. LatAm Video Consumption Data

### Regional Overview

| Metric | Value | Source Year |
|---|---|---|
| TikTok users in LatAm | 356 million (22% of global) | 2025 |
| YoY TikTok growth in LatAm | 34% (fastest globally) | 2025 |
| WhatsApp penetration (Brazil) | 98% of smartphone users (148M) | 2024 |
| WhatsApp penetration (Mexico) | 74 million users | 2024 |
| WhatsApp Business MAU (global) | 400 million+ | Q1 2025 |
| Smartphone penetration (LatAm) | 80% (2023), projected 90%+ by 2030 | 2023-2030 |
| Mobile video as % of all video | 75%+ | 2025 |
| Social commerce as % of e-commerce | 25% by 2026 | 2026 proj |
| Consumers discovering products via social | 70% | 2025 |
| Consumers who purchased via social media | 82% | 2025 |
| Livestream commerce adoption | 46% of digital buyers | 2025 |
| E-commerce market (LatAm) | $509B (2023) → $923B by 2026 | 2023/2026 |
| Mobile data traffic (LatAm) | 7.8 EB (2023) → 30 EB by 2030 | 2023/2030 |
| TikTok engagement rate | 5.3-6.8% | 2025 |
| Instagram Reels engagement rate | 0.5-5.2% | 2025 |
| TikTok CPM | $4.82-$10.00 | 2025 |
| Instagram Reels CPM | $8.19-$12.00 | 2025 |
| Short-form video ad spending | $1.04 trillion (2026 global) | 2026 proj |
| Brazil ad spend YoY growth | 9.1% | 2025 |

### Platform Preference by Country

| Country | #1 Platform | #2 Platform | #3 Platform | WhatsApp Usage | Key Notes |
|---|---|---|---|---|---|
| **Brazil** | YouTube | Instagram | TikTok | 98% penetration | Largest LatAm market; Portuguese content |
| **Mexico** | Facebook | YouTube | TikTok | 85%+ penetration | Second largest; strong TikTok growth |
| **Colombia** | Instagram | YouTube | TikTok | 90%+ penetration | High engagement rates |
| **Argentina** | Instagram | YouTube | TikTok | 90%+ penetration | Strong meme/content culture |
| **Chile** | Instagram | YouTube | TikTok | 85%+ penetration | Higher income, quality-conscious |
| **Peru** | Facebook | YouTube | TikTok | 80%+ penetration | Growing digital adoption |

### Content Preferences by Demographic

| Demographic | Preferred Video Length | Preferred Platform | Content Preference |
|---|---|---|---|
| Gen Z (18-24) | 15-30s | TikTok | UGC, memes, trends, authenticity |
| Millennials (25-34) | 30-60s | Instagram Reels | Product reviews, how-to, lifestyle |
| Gen X (35-44) | 60-180s | YouTube/Facebook | Tutorials, comparisons, testimonials |
| Boomers (45+) | 2-10 min | YouTube/Facebook | News, education, long-form reviews |

### Video Commerce Trends in LatAm (2025-2026)

1. **Livestream Commerce Explosion:** 46% of LatAm digital buyers have used livestream commerce; live events attract 100,000+ viewers. The funnel is being replaced by real-time conversational commerce.

2. **Social Commerce Integration:** 82% of Latin Americans have purchased via social media; 63% purchased directly on the social platform without leaving the app.

3. **WhatsApp Commerce:** WhatsApp Business growing 35%+ YoY in LatAm; businesses using video in WhatsApp see higher conversion rates than text-only messages.

4. **Micro-Drama Format:** Influenced by Chinese market trends, short drama-style branded content (1-3 minutes per episode) is emerging as a new format.

5. **AI Authenticity Demand:** As AI content proliferates, consumers increasingly demand authenticity markers. Genuine UGC and behind-the-scenes content outperform over-produced AI content.

6. **Hyperlocal Content:** Country-specific and even city-specific content performs better than generic "LatAm" content. A restaurant in Medellin needs content that feels Colombian, not generically Latin American.

---

## Appendix A: Glossary

| Term | Definition |
|---|---|
| **CTA** | Call to Action — what you want the viewer to do after watching |
| **CPM** | Cost Per Mille — cost per 1,000 impressions in advertising |
| **CRF** | Constant Rate Factor — FFmpeg quality parameter (lower = higher quality) |
| **ROAS** | Return on Ad Spend — revenue generated per dollar spent on ads |
| **Spark Ads** | TikTok ad format that boosts organic posts as paid ads |
| **UGC** | User Generated Content — content that looks like it was made by a real person, not a brand |
| **SRT/VTT** | Subtitle file formats (SubRip Text / WebVTT) |
| **WER** | Word Error Rate — accuracy metric for speech-to-text (lower is better) |
| **TTS** | Text-to-Speech — converting written text to spoken audio |
| **STT** | Speech-to-Text — converting spoken audio to written text |
| **9:16** | Vertical video aspect ratio (portrait mode) — standard for TikTok, Reels, Shorts |
| **16:9** | Horizontal video aspect ratio (landscape mode) — standard for YouTube, TV |

## Appendix B: Quick Reference — "I Need a Video For..."

| I Need... | Best Tool | Cost | Time | Output |
|---|---|---|---|---|
| Product showcase from catalog | Remotion template | $0.01 | 30 seconds | 15-30s vertical video |
| AI spokesperson FAQ video | HeyGen | $0.50-$2.00 | 2-5 minutes | 30-90s avatar video |
| Customer testimonial (from text) | Remotion + ElevenLabs | $0.05 | 1 minute | 15-30s testimonial |
| Customer testimonial (from video) | FFmpeg + Whisper | $0.02 | 1 minute | 15-45s branded video |
| Promotional sale video | Creatomate template | $0.15-$0.25 | 30 seconds | 15-30s promo video |
| Welcome video (personalized) | Tavus or HeyGen API | $1.00-$3.00 | 2-5 minutes | 15-20s personalized |
| Ad creative (3 variants) | Creatify or Kitz engine | $1.00-$5.00 | 5-10 minutes | 3x 15-30s ad videos |
| Long-form tutorial | Synthesia or HeyGen | $3.00-$10.00 | 10-20 minutes | 2-5 min tutorial |
| WhatsApp-optimized any video | FFmpeg pipeline | $0.001 | 10 seconds | <16MB compressed MP4 |
| Auto-captioned any video | Whisper + FFmpeg | $0.01-$0.05 | 30-60 seconds | Video with burned-in captions |

## Appendix C: Seasonal Video Calendar for LatAm SMBs

| Month | Events | Video Themes | Priority |
|---|---|---|---|
| **January** | New Year, Back to School | New year resolutions, new arrivals, fresh start | Medium |
| **February** | Valentine's Day, Carnival (BR) | Gift guides, couples content, Carnival specials | High |
| **March** | Women's Day (Mar 8) | Empowerment content, women-led business stories | Medium |
| **April** | Easter, Semana Santa | Holiday specials, family content | Medium |
| **May** | Mother's Day (varies by country) | Gift guides, tribute content, promotions | High |
| **June** | Father's Day (varies), Festas Juninas (BR) | Gift guides, seasonal specials | High |
| **July** | Mid-year sales | Clearance, half-year reviews, summer content | Medium |
| **August** | Back to school (some countries) | School supplies, routines, preparation | Medium |
| **September** | Independence days (MX, CL, etc.) | Patriotic themes, national pride, special editions | High |
| **October** | Day of the Dead / Halloween | Themed content, seasonal products, costumes | High |
| **November** | Buen Fin (MX), Black Friday | BIGGEST sale event — max video production | Critical |
| **December** | Christmas, Año Nuevo | Gift guides, year in review, gratitude, celebrations | Critical |

---

*This document should be reviewed and updated quarterly as the AI video landscape evolves rapidly. Tool pricing, capabilities, and API availability change frequently. Last verified: February 2026.*

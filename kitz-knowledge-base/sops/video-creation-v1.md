# SOP: Video Creation (Remotion)

## Purpose
Generate programmatic video specs and Remotion component code for SMB marketing videos.

## Trigger
- User requests video content ("haz un video de mi producto")
- Product launch → auto-generate promo video spec
- Weekly sales report → animated dashboard video

## Flow
1. **Receive request** → Classify purpose + platform
2. **Generate spec** → `brain/skills/videoCreation.ts` (Sonnet tier)
3. **Review** → Present video spec + preview description (draft-first)
4. **Render** → Remotion renders spec to MP4 (future: cloud rendering)
5. **Deliver** → Return video file via WhatsApp or download link

## Platform Specs
| Platform | Dimensions | Max Duration |
|----------|-----------|--------------|
| WhatsApp | 1080x1920 | 30s |
| Instagram Reel | 1080x1920 | 60s |
| Instagram Story | 1080x1920 | 15s |
| TikTok | 1080x1920 | 60s |
| YouTube | 1920x1080 | 60s |

## AI Battery Cost
- Spec generation: ~2.0 credits
- Rendering: infrastructure cost (no AI battery)

## Dependencies
- Remotion (remotion.dev) — React video framework
- Remotion Skills — AI agent integration layer
- FFmpeg — for post-processing

## Reference Repos
- remotion-dev/remotion — core framework (25k+ GitHub stars)
- AI-Content-Studio — full video pipeline
- Open-Sora — open-source AI video generation

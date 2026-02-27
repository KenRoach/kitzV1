# SOP: Content Creation Pipeline

## Purpose
Generate marketing content across platforms (WhatsApp, Instagram, Facebook, TikTok) for SMB owners.

## Trigger
- User requests content via WhatsApp ("crea un post para Instagram")
- Scheduled content calendar generation (weekly)
- New product added → auto-generate promo content
- CMO agent demand gen cycle

## Flow
1. **Receive request** → Classify platform(s) + content type
2. **Generate** → `brain/skills/contentCreation.ts` (Sonnet tier)
3. **Review** → Present draft to user (draft-first, never auto-post)
4. **Approve** → User confirms or edits
5. **Deliver** → Return formatted content for copy-paste or scheduled posting

## Content Types
| Type | Platforms | Length |
|------|-----------|--------|
| Promo | WhatsApp, Instagram | WA: 5-15 words, IG: 150-300 chars |
| Product | Instagram, Website | 200-500 chars + image prompt |
| Announcement | All | Platform-specific |
| Testimonial | Instagram, Facebook | 100-250 chars |
| Story | Instagram, TikTok | 50-100 chars + visual direction |

## AI Battery Cost
- Content generation: ~1.0 credits per platform set
- Calendar generation: ~1.5 credits

## Quality Checks
- [ ] Hashtags included for Instagram (5-10 relevant)
- [ ] CTA present in every piece
- [ ] Image prompt/direction included
- [ ] Character count within platform limits
- [ ] Language matches user preference (default: Spanish)

# Social Commerce — KITZ Knowledge Base Intelligence

> Module: Social Commerce | Sources: 6 | Auto-generated from KITZ Knowledge Base

> Ingestion: Enriched with live web content + WebSearch intelligence

---


## Meta Business


### Meta for Business `[Critical]`

- **ID:** PKB-143
- **Type:** Platform
- **URL:** https://business.meta.com/
- **Why KITZ Needs It:** Central hub for FB + IG + WA business tools & ads
- **Fetch Status:** FAILED (HTTP 400)

**Intelligence (Enriched):**

Central platform for managing FB/IG/WA business presence. Products: Meta Business Suite (unified dashboard for Pages + Instagram), Ads Manager (create/manage/optimize campaigns across FB/IG/Messenger/WA), Commerce Manager (Shops on FB/IG, catalogs, orders), WhatsApp Business Platform, Meta Business Portfolio (asset management). Ad formats: image, video, carousel, collection, Stories, Reels, lead forms, dynamic product ads. Targeting: demographics, interests, behaviors, custom audiences, lookalikes, geo. LATAM ad costs 3-5x cheaper than US/EU. Free to use for Business Suite/Commerce. Facebook has 450M+ MAU in LATAM; Instagram 200M+. WhatsApp Click-to-Message ads fastest-growing format in LATAM. Critical integration point -- KITZ target users live on Meta platforms.


---


## Meta Developers


### Meta for Developers `[High]`

- **ID:** PKB-144
- **Type:** Portal
- **URL:** https://developers.facebook.com/
- **Why KITZ Needs It:** Graph API, Marketing API, app creation
- **Fetch Status:** FAILED (HTTP 400)

**Intelligence (Enriched):**

Developer portal for Meta platform integrations. Core APIs: Graph API (v19.0, base URL graph.facebook.com, OAuth2 tokens for pages/posts/comments/photos), Marketing API (campaigns/adsets/ads/audiences/insights programmatic control), Instagram Graph API, WhatsApp Business Platform API, Messenger Platform, Conversions API (server-side event tracking). App Dashboard for creation/configuration, App Review for permissions, Webhooks for real-time notifications, Test Users, Access Tokens (page/user/app). SDKs: JavaScript, PHP, Python, iOS, Android, C#. Rate limits: 200 calls/hr per user token, 4800/hr per app, batch requests up to 50 operations. Essential for KITZ's social commerce features. Conversions API critical for ad tracking (iOS 14+). App Review process requires careful permission planning. Business verification needs local documents (RFC Mexico, RUT Colombia, CNPJ Brazil).


---


## Instagram API


### Instagram Graph API Docs `[High]`

- **ID:** PKB-145
- **Type:** Docs
- **URL:** https://developers.facebook.com/docs/instagram-api/
- **Why KITZ Needs It:** Publish content, read insights, manage comments
- **Fetch Status:** FAILED (HTTP 400)

**Intelligence (Enriched):**

Official API for Instagram Business/Creator accounts. Publishing: POST /{ig-user-id}/media + /media_publish for images, videos, carousels, reels, stories (JPEG, MP4 up to 90s, carousels up to 10 items). Insights: account-level (impressions, reach, profile views, followers, demographics) and post-level (engagement, saves, shares). Time periods: day/week/days_28/lifetime. Comments: list, reply, delete, reply to specific comments. Content Discovery: hashtag search, top/recent media per hashtag (30 unique hashtags per 7-day window). Stories: publish and read insights (exits, replies, taps). Mentions/Tags: tagged posts and @mentions. Permissions: instagram_basic, instagram_content_publish, instagram_manage_comments, instagram_manage_insights, instagram_shopping_tag_products. Rate limits: 25 posts/24h per account, 200 API calls/user/hour. Core KITZ integration -- most LATAM SMBs sell on Instagram. Enables programmatic publishing from AI content generation, insights analytics, automated comment responses, hashtag recommendations, product tagging.


---


## Facebook Pages API


### Facebook Pages API Docs `[High]`

- **ID:** PKB-146
- **Type:** Docs
- **URL:** https://developers.facebook.com/docs/pages-api/
- **Why KITZ Needs It:** Manage FB pages, posts, messaging programmatically
- **Fetch Status:** FAILED (HTTP 400)

**Intelligence (Enriched):**

API for managing Facebook Business Pages. Posts: create/read/update/delete via /{page-id}/feed. Photos/Videos: upload to pages including Reels. Comments: list and reply on posts. Messaging (Conversations API): list conversations, send messages with text/images/templates/quick replies. Page Insights: page views, likes, reach, engagement, demographics. Events: create/list page events. Permissions: pages_manage_posts, pages_read_engagement, pages_messaging, pages_read_user_content, pages_manage_metadata, read_insights. Facebook Pages remain important for LATAM business presence. Facebook Marketplace is #1 P2P selling platform in many LATAM countries. Groups are community-building tools. Many LATAM SMBs manage their entire business through Facebook Page + WhatsApp.


---


## Marketing API


### Meta Marketing API `[Medium]`

- **ID:** PKB-147
- **Type:** Docs
- **URL:** https://developers.facebook.com/docs/marketing-apis/
- **Why KITZ Needs It:** Ad creation, audience targeting, campaign management
- **Fetch Status:** FAILED (HTTP 400)

**Intelligence (Enriched):**

Programmatic interface for ad campaigns across Meta's network. Campaign hierarchy: Campaign (objective) > Ad Set (targeting, budget, schedule) > Ad (creative + CTA). Key endpoints: campaigns, adsets, ads, adcreatives, customaudiences, insights at /act_{id}/. Targeting: location (all LATAM countries), demographics, interests, behaviors, custom audiences (email/phone lists, min 100 matches), lookalike audiences (1-10% of country), Advantage+ AI-powered targeting. Pricing: auction-based (CPM/CPC/CPA), LATAM CPC $0.10-$0.80, CPM $1.50-$8.00, minimum $1/day. Enables KITZ to programmatically create/manage ads for users. AI could analyze products, generate creatives, set targeting, launch campaigns. Insights feed into ROI tracking. Custom Audiences from KITZ CRM for retargeting. Meta ads are #1 digital ad channel for LATAM SMBs. WhatsApp Click-to-Message ads fastest growing.


---


## Business SDK


### Meta Business SDK (Python) `[Medium]`

- **ID:** PKB-148
- **Type:** Code
- **URL:** https://github.com/facebook/facebook-python-business-sdk
- **Why KITZ Needs It:** Python SDK for all Meta business APIs
- **Fetch Status:** PARTIAL (GitHub repo page)

**Intelligence (Enriched):**

Official Python SDK for all Meta Business APIs. Package: facebook-business on PyPI, pip install facebook-business, Python 3.7+, actively maintained. Modules: adobjects/ (Campaign, AdSet, Ad, AdCreative, CustomAudience, Page), api.py (core client), session.py, exceptions.py. Features: full CRUD for Marketing API objects, cursor-based pagination, batch API (up to 50 calls), file upload, async batch processing, type hints. KITZ is TypeScript but Python SDK useful for AI/ML pipelines and batch operations. JavaScript alternative: facebook-nodejs-business-sdk (npm install facebook-nodejs-business-sdk) -- more directly useful for KITZ's Node.js services. SDK supports all LATAM markets, currencies (BRL, MXN, COP, ARS, PEN, CLP), and locales.


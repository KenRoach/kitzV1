# KITZ Social DM Setup — 15 Minute Guide

## Step 1: Meta (Instagram DMs + Facebook Messenger) — 8 min

### 1A. Create Meta Developer App
1. Go to https://developers.facebook.com/apps/
2. Click "Create App" → Choose "Business" type
3. App name: **KITZ** → Create
4. In the app dashboard, add these products:
   - **Messenger** (click "Set Up")
   - **Instagram** (click "Set Up")

### 1B. Connect Your Facebook Page
1. In Messenger settings → "Access Tokens" section
2. Click "Add or Remove Pages" → select your KITZ Facebook Page
3. Generate a **Page Access Token** → copy it
4. This is your `META_PAGE_ACCESS_TOKEN`

### 1C. Set Up Webhooks
1. In Messenger settings → "Webhooks" section
2. Click "Add Callback URL"
3. **Callback URL:** `https://kitz-social-connector-production.up.railway.app/webhooks/meta`
4. **Verify Token:** `kitz-verify-2024`
5. Subscribe to these fields:
   - `messages`
   - `messaging_postbacks`
   - `messaging_optins`

### 1D. Instagram DMs
1. In Instagram settings → "Webhooks"
2. Same callback URL: `https://kitz-social-connector-production.up.railway.app/webhooks/meta`
3. Same verify token: `kitz-verify-2024`
4. Subscribe to: `messages`

### 1E. Get App Secret
1. Go to Settings → Basic
2. Copy the **App Secret** → this is your `META_APP_SECRET`

### Env vars to set on Railway:
```
META_PAGE_ACCESS_TOKEN=<the page token from step 1B>
META_APP_SECRET=<the app secret from step 1E>
META_VERIFY_TOKEN=kitz-verify-2024
```

---

## Step 2: X / Twitter DMs — 5 min

### 2A. Create X Developer Account
1. Go to https://developer.x.com/en/portal/dashboard
2. Sign in with your X account
3. Create a **Project** → name it "KITZ"
4. Create an **App** inside the project → name it "KITZ Bot"

### 2B. Get API Keys
1. In your app settings → "Keys and Tokens"
2. Generate and copy:
   - **API Key** → `X_API_KEY`
   - **API Key Secret** → `X_API_SECRET`
   - **Bearer Token** → `X_BEARER_TOKEN`
   - **Access Token** → `X_ACCESS_TOKEN`
   - **Access Token Secret** → `X_ACCESS_SECRET`

### 2C. Enable DM Permissions
1. In app settings → "User authentication settings" → Edit
2. App permissions: **Read and write and Direct message**
3. Save

### 2D. Set Up Account Activity API (for receiving DMs)
After deploying, call this endpoint to register the webhook:
```bash
curl -X POST https://kitz-social-connector-production.up.railway.app/twitter/register-webhook \
  -H "Content-Type: application/json" \
  -H "x-dev-secret: <your DEV_TOKEN_SECRET>" \
  -d '{"webhook_url": "https://kitz-social-connector-production.up.railway.app/webhooks/twitter", "env_name": "production"}'
```

Then subscribe:
```bash
curl -X POST https://kitz-social-connector-production.up.railway.app/twitter/subscribe \
  -H "Content-Type: application/json" \
  -H "x-dev-secret: <your DEV_TOKEN_SECRET>" \
  -d '{"env_name": "production"}'
```

### Env vars to set on Railway:
```
X_API_KEY=<api key>
X_API_SECRET=<api key secret>
X_BEARER_TOKEN=<bearer token>
X_ACCESS_TOKEN=<access token>
X_ACCESS_SECRET=<access token secret>
```

---

## Step 3: Deploy Social Connector on Railway — 2 min

1. In Railway dashboard → KITZ project
2. Add new service → "GitHub Repo" → select `kitzV1`
3. Set root directory: `kitz-social-connector`
4. Set start command: `npx tsx src/index.ts`
5. Add all env vars from steps 1 and 2 above
6. Also set:
   ```
   PORT=3016
   KITZ_OS_URL=https://kitz-os-production.up.railway.app
   DEV_TOKEN_SECRET=<same as other services>
   SERVICE_SECRET=<same as other services>
   ```
7. Deploy

## Verification

Once deployed, test:
```bash
# Meta webhook verification
curl "https://<your-domain>/webhooks/meta?hub.mode=subscribe&hub.verify_token=kitz-verify-2024&hub.challenge=test123"
# Should return: test123

# Health check
curl https://<your-domain>/health
# Should return: {"status":"ok","service":"kitz-social-connector",...}

# Platform status
curl https://<your-domain>/status
```

Then DM your KITZ Instagram/Facebook/X account — you should get an AI response!

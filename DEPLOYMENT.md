# Deployment Notes

The active backend entrypoint is:

```bash
node backend/index.perfect.js
```

Required deployment environment variables:

```bash
PERFECT_API_KEY=PASTE_IN_HOST_SECRET_MANAGER
PERFECT_API_BASE_URL=https://yce-api-01.makeupar.com
PERFECT_V1_API_BASE_URL=https://yce-api-01.makeupar.com
PERFECT_DEMO_MODE=false
PERFECT_API_POLL_INTERVAL_MS=2000
PERFECT_API_MAX_ATTEMPTS=45
```

Optional if Perfect Corp v1 image-generation/background-removal APIs require them:

```bash
PERFECT_V1_ACCESS_TOKEN=PASTE_IF_REQUIRED
PERFECT_V1_CLIENT_ID=PASTE_IF_REQUIRED
PERFECT_V1_CLIENT_SECRET=PASTE_IF_REQUIRED
PERFECT_TEXT_STYLE_GROUP_ID=PASTE_IF_REQUIRED
PERFECT_TEXT_STYLE_ID=PASTE_IF_REQUIRED
```

Do not deploy local `.env` files or commit credentials.

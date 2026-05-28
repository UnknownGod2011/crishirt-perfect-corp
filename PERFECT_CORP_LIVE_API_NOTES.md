# Perfect Corp Live API Notes

This repo is now wired for Perfect Corp as the primary AI provider. Do not commit real credentials.

## Official Docs Consulted

- Perfect Corp AI API docs: https://app-cdn-01.perfectcorp.com/console/common/doc/ai-api/index.html
- Perfect Corp developer docs portal: https://docs.perfectcorp.com/develop/introduction
- AI Clothes Changer / fashion API overview: https://yce.perfectcorp.com/features/ai-clothes-changer-api
- Skin Analysis API overview: https://yce.perfectcorp.com/features/skin-analysis-api
- Devpost challenge page: https://devnetwork-ai-ml-hack-2026.devpost.com/

## Authentication

The implemented backend keeps all credentials server-side in `backend/.env`.

Required for v2 fashion / analysis APIs:

```bash
PERFECT_API_KEY=PASTE_YOUR_PERFECT_API_KEY_HERE
PERFECT_API_BASE_URL=https://yce-api-01.makeupar.com
```

Optional / conditional for v1 image generation and background removal:

```bash
PERFECT_V1_API_BASE_URL=https://yce-api-01.makeupar.com
PERFECT_V1_ACCESS_TOKEN=PASTE_IF_REQUIRED
PERFECT_V1_CLIENT_ID=PASTE_IF_REQUIRED
PERFECT_V1_CLIENT_SECRET=PASTE_IF_REQUIRED
PERFECT_TEXT_STYLE_GROUP_ID=PASTE_IF_REQUIRED
PERFECT_TEXT_STYLE_ID=PASTE_IF_REQUIRED
```

The v1 text-to-image docs mention style groups/styles. The API Console may require selecting or fetching `style_group_id` and `style_id`. The backend can auto-fetch them if v1 auth works, but explicit env values are safer for the demo.

## Implemented Endpoint Map

### Text-to-Image / Design Generation

Backend route:

```text
POST /api/generate
POST /api/perfect/text-to-image
```

Perfect Corp target:

```text
GET  /s2s/v1.0/task/style-group/text-to-image
GET  /s2s/v1.0/task/style/text-to-image?style_group_id=...
POST /s2s/v1.0/task/text-to-image
GET  /s2s/v1.0/task/text-to-image?task_id=...
```

Request shape used by backend:

```json
{
  "style_group_id": 1,
  "style_id": 1,
  "prompt": "print-ready apparel prompt",
  "negative_prompt": "low quality, blurred, garment mockup, human model",
  "batch_size": 1
}
```

Uncertainty to verify live:

- Whether the hackathon API key works directly as a v1 bearer token.
- Whether the API Console requires explicit style IDs.
- Whether the task request wants a wrapped `payload` object for this account tier.

### Background Removal

Backend route:

```text
POST /api/process-upload
POST /api/perfect/remove-background
```

Perfect Corp target:

```text
POST /s2s/v1.0/file/sod
POST /s2s/v1.0/task/sod
GET  /s2s/v1.0/task/sod?task_id=...
```

Used for print-readiness: uploaded or generated designs should become isolated/transparent when the live API supports it.

### AI Clothes Try-On

Backend route:

```text
POST /api/perfect/clothes-tryon
POST /api/virtual-tryon
```

Perfect Corp target:

```text
POST /s2s/v2.0/file/cloth
POST /s2s/v2.0/task/cloth
GET  /s2s/v2.0/task/cloth/{task_id}
```

Request shape used by backend:

```json
{
  "src_file_id": "uploaded_user_photo",
  "ref_file_id": "uploaded_garment_or_design",
  "garment_category": "upper_body",
  "change_shoes": false
}
```

Uncertainty to verify live:

- Whether Perfect Corp expects a full garment product image rather than a flat mockup/design snapshot.
- Whether the T-shirt mockup snapshot is accepted as the garment reference.

### Face Attribute / Skin Analysis

Backend route:

```text
POST /api/perfect/analyze-appearance
POST /api/perfect/color-recommendations
```

Perfect Corp targets:

```text
POST /s2s/v2.0/file/face-attr-analysis
POST /s2s/v2.0/task/face-attr-analysis
GET  /s2s/v2.0/task/face-attr-analysis/{task_id}

POST /s2s/v2.0/file/skin-analysis
POST /s2s/v2.0/task/skin-analysis
GET  /s2s/v2.0/task/skin-analysis/{task_id}
```

The app converts Perfect outputs into:

- skin tone / undertone / depth
- recommended apparel colors
- print contrast tips
- non-medical beauty-commerce suggestions

## Safe Curl Examples

Do not paste secrets into these commands. Load them from `backend/.env` through the server.

```bash
curl http://localhost:5000/api/health
```

```bash
curl -X POST http://localhost:5000/api/generate \
  -H "Content-Type: application/json" \
  -d "{\"prompt\":\"bold dragon streetwear badge\",\"apparelName\":\"Hoodie\",\"garmentColor\":\"#ffffff\"}"
```

```bash
curl -X POST http://localhost:5000/api/perfect/analyze-appearance \
  -H "Content-Type: application/json" \
  -d "{\"personImage\":\"data:image/jpeg;base64,PASTE_TEST_IMAGE_BASE64\"}"
```

## Credit / Usage Notes

- Perfect Corp task APIs consume account units/credits in live mode.
- Generated image URLs may expire; the backend fetches result URLs into data URLs when possible.
- Keep `PERFECT_DEMO_MODE=true` only for offline rehearsal. For judging, use `PERFECT_DEMO_MODE=false`.

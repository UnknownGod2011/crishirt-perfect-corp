# Crishirts — AI Apparel Design Studio

Personalized apparel design powered by **Perfect Corp AI** — generate print designs, preview them on garments, try them on virtually, and get skin-tone color recommendations.

Built for the **DevNetwork AI + ML Hackathon 2026**.

---

## Features

- **AI Design Generation** — Prompt-to-print artwork via Perfect Corp text-to-image (Pop Art style, print-ready output)
- **Background Removal** — Auto-strips backgrounds from generated and uploaded designs via Perfect Corp SOD
- **Live Mockup Preview** — Drag, resize, and rotate your design on a t-shirt mockup in real time
- **Virtual Try-On** — Upload a photo and see yourself wearing the design via Perfect Corp Clothes Try-On
- **Skin & Color Analysis** — Upload a close-up face photo for skin tone detection, color recommendations, and cosmetic insights powered by Perfect Corp Face Analysis + Gemini AI
- **Cart & Collection** — Save designs, manage cart, browse exclusive collection

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express |
| AI Provider | Perfect Corp API (v1 + v2) |
| Insight Enrichment | Google Gemini 2.5 Flash |
| Deployment | Vercel (frontend) + Render (backend) |

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/UnknownGod2011/crishirt-perfect-corp
cd crishirt-perfect-corp
npm install
cd backend && npm install && cd ..
```

### 2. Configure environment

Copy `.env.example` to `.env` (frontend):
```
VITE_API_URL=http://localhost:5000
```

Copy `backend/.env.example` to `backend/.env` and fill in:
```
PERFECT_API_KEY=your_perfect_corp_api_key
PERFECT_TEXT_STYLE_GROUP_ID=13600722
PERFECT_TEXT_STYLE_ID=5257
GEMINI_API_KEY=your_gemini_api_key   # optional but recommended
```

### 3. Run locally

```bash
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:5000

---

## API Keys Required

| Key | Where to get |
|---|---|
| `PERFECT_API_KEY` | [Perfect Corp API Console](https://developer.perfectcorp.com) |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com) |

---

## Deployment

**Frontend → Vercel:** `npm run deploy:frontend`  
Set `VITE_API_URL` to your Render backend URL in Vercel environment variables.

**Backend → Render:** Connect the `backend/` folder, use `node index.perfect.js` as start command, set all env vars from `backend/.env.example`.

---

## Perfect Corp APIs Used

| API | Purpose |
|---|---|
| Text-to-Image (v1) | Generate print-ready artwork from prompts |
| Subject Object Detection / SOD (v1) | Background removal |
| Clothes Try-On / cloth (v2) | Virtual try-on |
| Face Attribute Analysis (v2) | Skin tone, hair/eye color detection |
| Skin Analysis (v2) | Skin concern detection (acne, pores, texture, wrinkles) |

---

*Cosmetic suggestions are for retail inspiration only and are not medical advice.*

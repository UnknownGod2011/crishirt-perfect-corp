# Crishirts — AI Apparel Design Studio

Personalized apparel design powered by **Perfect Corp AI** — generate print designs, preview them on garments, try them on virtually, and get skin-tone color recommendations.

Built for the **DevNetwork AI + ML Hackathon 2026** and extended with an agent-native **WebMCP** interface for the OpenAI WebMCP Challenge.

---

## Features

- **AI Design Generation** — Prompt-to-print artwork via Perfect Corp text-to-image (Pop Art style, print-ready output)
- **Background Removal** — Auto-strips backgrounds from generated and uploaded designs via Perfect Corp SOD
- **Live Mockup Preview** — Drag, resize, and rotate your design on a t-shirt mockup in real time
- **Virtual Try-On** — Upload a photo and see yourself wearing the design via Perfect Corp Clothes Try-On
- **Skin & Color Analysis** — Upload a close-up face photo for skin tone detection, color recommendations, and cosmetic insights powered by Perfect Corp Face Analysis + Gemini AI
- **Cart & Collection** — Save designs, manage cart, browse exclusive collection
- **Agent-Native WebMCP** — AI agents can read and modify the same live CriShirt workspace semantically instead of relying on visual clicking and DOM interpretation

---

## WebMCP Agent Interface

CriShirt keeps the existing human UI intact and adds thin semantic WebMCP adapters over the same React application state and existing product logic. In browsers that do not expose `document.modelContext`, the bridges are no-ops and the human website behaves normally.

The current agent surface is intentionally compact:

| Tool | Purpose |
|---|---|
| `crishirt_get_workspace_state` | Read garment settings, front/back design state, placement, busy state, cart count, route, and a revision token in one compact response |
| `crishirt_configure_workspace` | Change garment type, color, material, size, and active front/back side without multiple selector clicks |
| `crishirt_set_design_placement` | Move, resize, or rotate existing artwork semantically instead of dragging on the canvas |
| `crishirt_generate_design` | Generate Perfect Corp-backed artwork and optionally configure garment settings in the same cancellable call |
| `crishirt_refine_design` | Refine the current artwork through the existing Perfect Corp route without copying image URLs between tools |
| `crishirt_add_current_design_to_cart` | Add the current configured apparel and artwork to the same cart model used by the human app |
| `crishirt_get_cart` | Read a compact semantic cart summary |
| `crishirt_remove_cart_item` | Remove a cart item by stable item id |
| `crishirt_list_collection` | Read the existing Exclusive Collection as compact structured product data instead of inspecting product cards visually |
| `crishirt_add_collection_item_to_cart` | Add an available collection product to the same cart state used by the human Collection page |
| `crishirt_navigate` | Navigate directly among Create, VR Try-On, Collection, and Cart surfaces |
| `crishirt_get_tryon_state` | Read privacy-safe Virtual Try-On readiness, selected/eligible cart item IDs, busy state, and result readiness without exposing image bytes |
| `crishirt_run_virtual_tryon` | Run the existing Perfect Corp try-on action using a photo the human already supplied and an optional stable cart item ID |

### Agent-use philosophy

The goal is not to reproduce every button as a tool. The goal is to reduce agent observation and interaction cost while preserving the same legitimate user capabilities.

A visual agent might otherwise need to inspect the page, locate several selectors, click through front/back controls, type a prompt, locate generation controls, wait, visually estimate artwork placement, drag and resize it, browse collection cards, locate cart controls, and inspect cart cards. WebMCP replaces those fragile steps with a few structured semantic calls while the visible UI continues to update from the same shared state.

Common custom-design flow:

1. Call `crishirt_get_workspace_state`.
2. Call `crishirt_generate_design` with the prompt plus optional garment attributes in one request.
3. Call `crishirt_set_design_placement` to position the result precisely.
4. Call `crishirt_add_current_design_to_cart`.
5. Call `crishirt_get_cart` to verify the resulting state.

Common collection flow:

1. Call `crishirt_list_collection`.
2. Choose an available product id.
3. Call `crishirt_add_collection_item_to_cart`.
4. Call `crishirt_get_cart` to verify the cart.

Common Virtual Try-On handoff:

1. The human uploads or captures their photo in the visible CriShirt UI.
2. Call `crishirt_get_tryon_state` to confirm photo readiness and inspect eligible cart designs.
3. Call `crishirt_run_virtual_tryon` with an optional `cartItemId`.
4. The existing visible Virtual Try-On UI receives the result from the same Perfect Corp request path used by the human button.

Camera permission, file picking, photo capture/upload, raw person-photo transfer, and result download intentionally remain human-controlled. The WebMCP tools expose only semantic readiness and the post-consent action; they never return person-image or result-image bytes.

The Collection page and collection WebMCP tools share the same `collectionCatalog` module and the same cart-item construction helper, preventing the human and agent product definitions from drifting apart.

Mutating workspace tools accept an optional `expectedRevision`. If the human changes the shared workspace before an agent mutation, the tool returns `STALE_STATE` instead of silently applying an edit against stale state.

Long-running Perfect Corp generation, refinement, and Virtual Try-On propagate the WebMCP execution `AbortSignal`, so cancelled agent operations can stop their underlying request cleanly.

Read surfaces that can include user/provider-generated text are annotated with `untrustedContentHint`, and read-only tools use `readOnlyHint`.

### Testing WebMCP

Use a WebMCP-capable browser/build and inspect the page's registered tools through `document.modelContext.getTools()` or the browser's supported WebMCP tooling. Test realistic requests such as:

- “Create a black oversized tee with a minimal motorsport graphic.”
- “Make the graphic smaller and move it upward.”
- “Switch to the back and add a second design.”
- “Add this apparel to my cart and tell me what is in the cart.”
- “Show me the available Exclusive Collection products and add the Retro Gaming Tee.”
- “Take me directly to virtual try-on.”
- After manually supplying a try-on photo: “Tell me which cart designs are eligible for try-on, then try the latest one.”

The production human site remains independent of WebMCP support. Detailed implementation state, validation evidence, remaining opportunities, and commit handoff notes are maintained in `PROGRESS.md`.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express |
| AI Provider | Perfect Corp API (v1 + v2) |
| Insight Enrichment | Google Gemini 2.5 Flash |
| Agent Interface | WebMCP via `document.modelContext` |
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

## WebMCP Progress Note

The WebMCP work is developed on the `webmcp-agent-native` branch so the existing `main` production deployment remains stable. The first implementation introduced the semantic creation/cart/navigation bridge and revision/cancellation safeguards. Follow-up work moved the Exclusive Collection catalog/cart-item creation into shared logic and added a privacy-preserving Virtual Try-On handoff that reuses the existing human Perfect Corp request path after the human supplies a photo. The current feature branch exposes thirteen semantic tools. See `PROGRESS.md` for the detailed handoff and validation record.

---

*Cosmetic suggestions are for retail inspiration only and are not medical advice.*
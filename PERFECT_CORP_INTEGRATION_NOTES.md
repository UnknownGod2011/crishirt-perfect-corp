# Perfect Corp Integration Notes

## Architecture

```text
React UI
  -> backend/index.perfect.js
    -> backend/services/perfectCorp.js
      -> Perfect Corp v1/v2 APIs
```

The browser never calls Perfect Corp directly. API keys stay in `backend/.env`.

## Main Implementation Files

- `backend/index.perfect.js`: Express API entrypoint.
- `backend/services/perfectCorp.js`: Perfect Corp auth, upload, task, poll, result handling.
- `src/components/ControlPanel.tsx`: generation, refinement, upload processing payloads.
- `src/components/VRTryOn.tsx`: Perfect Corp try-on and appearance analysis.
- `src/components/TShirtMockup.tsx`: multi-apparel mockup preview.
- `src/config/apparel.ts`: apparel product configuration.
- `public/mockups/apparel/*`: white transparent-style SVG garment mockups.

## Provider Replacement

The main scripts now use the Perfect backend:

```bash
npm run dev
npm run start:backend
npm run dev:backend
```

Legacy Bria/FIBO backend code remains in `backend/index.fibo.js` for reference, but it is no longer the default backend and is not part of the main demo path.

## Live Mode vs Demo Mode

Live mode:

```bash
PERFECT_DEMO_MODE=false
```

In live mode, routes call Perfect Corp. If auth/schema/credits fail, the route returns a real error to the frontend.

Demo mode:

```bash
PERFECT_DEMO_MODE=true
```

Demo mode returns local fallback visuals for rehearsal only. It is intentionally explicit and should not be used as the final judging flow.

## Perfect Corp Feature Coverage

- AI design generation: routed through Perfect v1 text-to-image where available.
- Background removal: routed through Perfect v1 SOD/background removal.
- Clothes try-on: routed through Perfect v2 cloth task.
- Face attributes: routed through Perfect v2 face attribute analysis.
- Skin analysis: routed through Perfect v2 skin analysis.
- Recommendations: generated from Perfect analysis plus retail rules.

## Known Live Verification Items

- Confirm whether the hackathon key supports v1 image APIs directly or requires v1 access/client credentials.
- Confirm the exact style group/style IDs for the best apparel-print style.
- Confirm whether clothes try-on works best with a full garment mockup snapshot or an isolated design reference.
- Confirm Perfect result object shape for the account tier.

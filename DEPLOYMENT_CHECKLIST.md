# Deployment Checklist

- [ ] `PERFECT_API_KEY` is configured in the host secret manager.
- [ ] `PERFECT_DEMO_MODE=false` for judging.
- [ ] Optional v1 credentials/style IDs are configured if live text-to-image requires them.
- [ ] Backend start command is `node backend/index.perfect.js`.
- [ ] Frontend `VITE_API_URL` points to the deployed backend.
- [ ] `/api/health` reports `success: true`.
- [ ] Design generation route returns a live Perfect Corp result.
- [ ] `/api/perfect/clothes-tryon` works with a clear user photo and garment reference.
- [ ] `/api/perfect/analyze-appearance` returns analysis or a documented live API error.

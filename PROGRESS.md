# CriShirt WebMCP Progress

## Mission

Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI work.

## Canonical repository and isolation

Repository: `UnknownGod2011/crishirt-perfect-corp`

Production branch: `main`

Production baseline commit: `88daa417caa5305f81e5554977a13a94a793cdeb`

Working branch: `webmcp-agent-native`

Production remains untouched. Vercel project `crishirtpc` is linked to `UnknownGod2011/crishirt-perfect-corp`; the production deployment still points at `main` commit `88daa417caa5305f81e5554977a13a94a793cdeb`.

## Current WebMCP surface

The feature branch now exposes thirteen semantic tools.

Main bridge: `src/components/WebMCPBridge.tsx`

1. `crishirt_get_workspace_state`
2. `crishirt_configure_workspace`
3. `crishirt_set_design_placement`
4. `crishirt_generate_design`
5. `crishirt_refine_design`
6. `crishirt_add_current_design_to_cart`
7. `crishirt_get_cart`
8. `crishirt_remove_cart_item`
9. `crishirt_navigate`

Collection bridge: `src/components/CollectionWebMCPBridge.tsx`

10. `crishirt_list_collection`
11. `crishirt_add_collection_item_to_cart`

Virtual Try-On integration: `src/components/VRTryOn.tsx`

12. `crishirt_get_tryon_state`
13. `crishirt_run_virtual_tryon`

All WebMCP entry points feature-detect `document.modelContext`; unsupported browsers continue through the existing human UI without depending on WebMCP.

## Shared-state and safety behavior

Workspace mutations can accept `expectedRevision`; stale mutations return deterministic `STALE_STATE` rather than silently overwriting newer human state.

Perfect Corp generation, refinement, and Virtual Try-On forward the WebMCP execution `AbortSignal` to their underlying fetch requests.

Exclusive Collection products are defined once in `src/config/collectionCatalog.ts`; the human Collection page and WebMCP bridge use the same catalog and cart-item creation logic.

Virtual Try-On now uses one shared `generateVirtualTryOn` action inside `VRTryOn.tsx`. Both the visible human button and `crishirt_run_virtual_tryon` invoke that same action, so the provider request body and state transitions cannot drift into separate human-versus-agent implementations.

The WebMCP try-on boundary is intentionally privacy-preserving:

- camera permission remains human-controlled;
- browser file picking remains human-controlled;
- raw person-photo data is never returned by a WebMCP tool;
- generated result-image bytes/URLs are not returned by the WebMCP tools;
- result download remains human-controlled;
- agents may only inspect semantic readiness, select an already-existing eligible cart design, and invoke the post-consent Perfect Corp action.

No primary WebMCP operation depends on CSS selectors, screen coordinates, or DOM clicking.

## Current-spec verification

Rechecked the current WebMCP Community Group draft on 2026-09-05. The feature branch remains aligned with the current imperative API model: `document.modelContext.registerTool`, JSON Schema inputs, `readOnlyHint`, `untrustedContentHint`, registration lifetime cancellation via `AbortSignal`, execution cancellation via the callback `AbortSignal`, plus browser-side `getTools()` / `executeTool()` for runtime inspection.

Actual interactive `document.modelContext.getTools()` and representative `executeTool()` validation in a WebMCP-capable browser is still unavailable from this automation environment and remains explicitly unclaimed.

## Fresh full journey audit

### Create workspace

Strong coverage. An agent can read garment/design/cart state in one compact call, configure multiple garment properties semantically, generate/refine through the existing Perfect Corp routes, position artwork precisely without visual dragging, and add the result to the existing cart.

A generation-plus-placement-plus-cart mega-action remains intentionally rejected. It would save only a few calls while hiding distinct side effects and making partial-failure recovery worse.

### Cart

Strong coverage. Agents can inspect the current cart and remove stable item IDs. Collection additions use the same cart model as the human app.

### Exclusive Collection

Strong coverage. Agents can inspect the static collection without visually scanning cards and can add an available product directly by stable ID. Human and agent paths share the same catalog and cart-item builder.

### Navigation

Strong coverage. Agents can directly navigate to Create, Virtual Try-On, Collection, and Cart without link discovery.

### Virtual Try-On

The high-value post-consent handoff is now implemented.

Human acquisition flow remains unchanged:

1. human uploads a torso/full-body image or grants camera permission and captures one;
2. the app stores that photo only in the existing local component state;
3. the human may continue selecting a cart design and clicking Generate Virtual Try-On exactly as before.

Agent handoff:

1. `crishirt_get_tryon_state` returns `photoPresent`, selected cart item ID, eligible cart item IDs/names, busy state, result readiness, and a deterministic readiness reason;
2. `crishirt_run_virtual_tryon` optionally accepts a stable `cartItemId`;
3. it requires an already-present human photo and an eligible existing cart design;
4. it invokes the same `generateVirtualTryOn` action as the visible human button;
5. the execution `AbortSignal` reaches the Perfect Corp fetch;
6. the tool returns semantic success/failure metadata only.

Deterministic try-on errors include:

- `PHOTO_REQUIRED`
- `CART_ITEM_NOT_FOUND`
- `GARMENT_IMAGE_REQUIRED`
- `TRYON_ALREADY_RUNNING`
- `TRYON_PROVIDER_FAILED`
- `TRYON_ABORTED`

### AR camera and photo acquisition

Intentionally not agentized. Camera capture uses `navigator.mediaDevices.getUserMedia` and photo upload uses browser file selection. These remain permission-sensitive human actions.

## Validation status

Functional Virtual Try-On implementation commit: `4dcef318ea8913b0efc906e1450044ad2da4d320`.

That first preview build correctly failed because TypeScript's unused-local check found `designPrompt` was no longer read after the refactor. The failure was not ignored or promoted.

Fix commit: `6b7fdfe28c4b5a048beda4436a3ae9948aa86c7d`.

The fix retained the existing prompt state and uses it for the Generate Virtual Try-On button's accessible label. Vercel then rebuilt the same feature branch successfully; deployment `dpl_5wCzGvCqghbp9QLBgb7qfSVxssq2` reached `READY` after running the repository build.

README update commit: `d19ebbb9cec52ccdbdc3ae4d95a381b50f58deba`.

Production remains on `main` and has not been promoted or modified by this work.

Interactive WebMCP runtime execution remains the strongest outstanding promotion gate.

## Remaining opportunities

1. Prioritize real WebMCP runtime discovery with `document.modelContext.getTools()` and representative `executeTool()` calls in a compatible browser if a usable environment becomes available.
2. Re-test stale revisions, cancellation, provider failure handling, unsupported-browser no-op behavior, collection availability validation, shared cart behavior, and Virtual Try-On deterministic errors in that runtime.
3. Re-audit tool descriptions, input schemas, response payload size, side-effect boundaries, and avoid adding tools merely to increase count.
4. Do not automate camera permission, file selection, raw person-image transfer, or result download through WebMCP.
5. Do not merge to `main` solely because preview builds pass; runtime WebMCP-capable browser validation remains the strongest promotion gate.

## README

`README.md` now documents the thirteen-tool WebMCP surface, agent-use philosophy, revision/cancellation behavior, collection flow, Virtual Try-On privacy boundary, shared human/agent try-on action, and representative test prompts. Detailed evolving handoff state remains in this file.

## Latest audit

2026-09-05: the previous Virtual Try-On tooling blocker was removed because the complete component could be retrieved safely. The post-consent WebMCP handoff was implemented inside `VRTryOn.tsx`, the first build failure was diagnosed rather than hidden, the fix reached a READY Vercel preview, production remained untouched, and the full user journey was re-audited. No additional tool is justified solely for tool-count growth.

## Next run

Read this file first. Reverify repository identity, branch head, `main` isolation, and current WebMCP behavior. Attempt runtime WebMCP discovery/execution first if a compatible browser/testing surface is available. Otherwise perform a fresh full journey audit and only ship another change if it materially reduces agent observation/click/round-trip cost without weakening human UX, privacy, or state correctness.
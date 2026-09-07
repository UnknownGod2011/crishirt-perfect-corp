# CriShirt WebMCP Progress

## Mission
Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI/UX work.

## Canonical repository and deployment facts
- Repository: `UnknownGod2011/crishirt-perfect-corp`
- Production branch: `main`
- Production commit: `88daa417caa5305f81e5554977a13a94a793cdeb`
- Working branch: `webmcp-agent-native`
- Branch head entering this run: `29faf05998e7f0dc93449becf1b5760102a54fa2`
- Compare entering this run: 78 commits ahead of `main`, 0 behind; merge base exactly production commit `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Production remains on `main`; this WebMCP branch has not been promoted.
- Vercel project remains `crishirtpc` (`prj_jAm749oRS01LbAdwec2lKvKZgAEF`).
- Entering preview deployment `dpl_Cxho4njsnti1Udrt84cUKTbsgUFX` is `READY`, tied to the canonical repository, `webmcp-agent-native`, and entering commit `29faf05998e7f0dc93449becf1b5760102a54fa2`.
- Entering preview build cloned the canonical repo and successfully ran `npm install` followed by `tsc -b && vite build`; Vite transformed 2020 modules and completed successfully.
- No production deployment configuration, environment variables, auth, database, commerce, or unrelated UI were changed in this run.

## Current WebMCP tool surface
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

Virtual Try-On: `src/components/VRTryOn.tsx`
12. `crishirt_get_tryon_state`
13. `crishirt_run_virtual_tryon`

All entry points feature-detect `document.modelContext`, so unsupported browsers retain normal human behavior.

## Shared state, safety, and privacy
- Workspace mutations accept optional `expectedRevision`; stale calls return deterministic `STALE_STATE` instead of silently overwriting later state.
- Humans and agents reuse the same application/cart/catalog/provider logic rather than DOM-click wrappers.
- Provider-backed callbacks propagate WebMCP execution cancellation into cancellable requests.
- Virtual Try-On keeps camera/file permission and raw person/result image data human-controlled.
- Primary tools are semantic and structured; they do not expose selectors, coordinates, or arbitrary DOM clicking.

## Current official WebMCP specification check
Reverified on 2026-09-07 against the official Web Machine Learning Community Group **Draft Community Group Report dated 2026-09-04**.

Current relevant facts:
- `document.modelContext` remains the imperative API surface.
- `registerTool(tool, options)` remains the semantic registration path.
- `getTools()` and `executeTool()` remain the in-page discovery/execution APIs.
- Per-execution options carry an `AbortSignal`.
- Registration lifetime cancellation is separate from execution cancellation.
- The draft still documents asynchronous `toolchange` notification and a race risk around rapid unregister/re-register churn.

No new spec-driven tool-surface correction is required this run.

## Fresh full-journey audit — 2026-09-07

### Repository / production isolation
Verified the canonical repository, default branch, working branch, exact entering head, production baseline, divergence, merge base, and current preview before considering mutation. Production `main` remains untouched.

### Create / edit / state recovery
`crishirt_get_workspace_state` remains the compact semantic recovery primitive for route, garment configuration, front/back design presence and placement, busy state, cart count, valid product choices, and revision. Existing configuration, placement, navigation, generation, and refinement tools cover the stable human Create journey without selector micro-tools.

### Generation / refinement
Generation and refinement remain semantically exposed through the existing provider path, validate inputs, propagate execution cancellation, and return deterministic failures. A same-tick human/agent overlap remains a theoretical candidate because React busy state can lag a nearly simultaneous second execution. A bridge-only mutex would not protect the visible human path, so no concurrency change is justified without a shared-path harness.

### Artwork placement
Semantic placement remains materially better than agent-side dragging: one bounded action updates x/y/width/height/rotation on the same front/back state used by the visible editor. No DOM drag wrappers are justified.

### Cart / collection
Current-design cart add, compact cart inspection, removal, collection listing, and collection add-to-cart remain covered using shared state/catalog. Intentional duplicate adds are valid existing behavior, so naive idempotency remains unsafe.

### Navigation / recovery
`crishirt_navigate` maps only to existing Create, Virtual Try-On, Collection, and Cart destinations. No new navigation surface is justified.

### Virtual Try-On
The privacy boundary remains correct: the human supplies the photo; WebMCP exposes readiness and execution only against already-supplied photo/cart state. Provider cancellation and synchronous loading protection remain in place.

The strongest narrow improvement is still registration stability. `VRTryOn.tsx` registers both Try-On tools in an effect whose dependency is `[tryOnResult]`. Successful try-on completion or result clearing therefore unregisters and re-registers otherwise unchanged tools. A component-lifetime registration backed by a synchronously maintained `tryOnResult` ref remains the preferred small fix.

That functional change was **not shipped** this run because the mandatory pre-ship full-app validation surface is still unavailable. A fresh canonical clone was retried and again failed with `Could not resolve host: github.com`. The connected GitHub API can inspect and mutate repository contents, but it does not provide a build-capable checkout. The READY Vercel preview validates the entering commit only and is not sufficient evidence for an uncommitted behavioral source edit. The source change therefore remains intentionally uncommitted rather than speculative.

### Schemas, annotations, payloads, round trips, and observability
The 13-tool surface remains coherent and high leverage. Read tools remain read-only, provider/user-derived read content remains marked untrusted where appropriate, schemas reject unknown fields, outputs remain compact/structured, and errors remain deterministic. No new compound tool materially improves journey cost enough to justify a broader mutation surface this run.

### Unsupported browser / human website
The bridges still return early when `document.modelContext` or `registerTool` is unavailable. Nothing in this run changed rendering, Perfect Corp provider paths, human cart behavior, navigation, collection UI, editing/placement, or try-on controls.

### README maturity check
`README.md` remains accurate and appropriately concise for the mature 13-tool semantic WebMCP surface; no README change is justified by this no-op functional run.

## Tests and verification performed this run
- Read `PROGRESS.md` before editing.
- Verified canonical repository identity and push/admin access.
- Verified `webmcp-agent-native` entered at `29faf05998e7f0dc93449becf1b5760102a54fa2`.
- Verified `main` remains `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Compared working branch against production: 78 commits ahead, 0 behind, merge base exactly production.
- Reverified the official 2026-09-04 WebMCP draft and its current `document.modelContext` / `registerTool` / `getTools()` / `executeTool()` / execution `AbortSignal` API shape.
- Re-read `src/components/VRTryOn.tsx` and confirmed the registration effect still depends on `[tryOnResult]`.
- Confirmed entering Vercel deployment `dpl_Cxho4njsnti1Udrt84cUKTbsgUFX` is `READY` for the exact canonical branch head.
- Inspected entering Vercel build logs: canonical clone succeeded; `npm install` succeeded; `tsc -b && vite build` succeeded; 2020 modules transformed.
- Retried a clean local clone of `webmcp-agent-native`; it failed with `Could not resolve host: github.com`.
- No functional source change was made, so no unvalidated behavior was committed.

## Failures found / fixes applied
- No new human-flow regression found.
- No missing high-leverage semantic capability found.
- Registration-lifecycle inefficiency remains in Virtual Try-On.
- Remaining candidate: shared generation/refinement same-tick overlap protection covering both human and agent paths.
- Remaining candidate: focused cart retry/same-tick protection that preserves intentional duplicate adds.
- Environment limitation remains transient: no build-capable canonical checkout is available in this runtime; actual browser-side `document.modelContext.getTools()` / `executeTool()` execution is also unavailable here.

## Remaining opportunities
1. When a build-capable checkout is available, implement and locally validate the Virtual Try-On registration-stability change before committing it.
2. Execute actual `document.modelContext.getTools()` discovery and representative `executeTool()` calls in a WebMCP-capable browser/testing surface when available.
3. Reproduce simultaneous generation/refinement and add only the smallest shared guard covering both human and agent paths, with cancellation/provider-failure cleanup tests.
4. Reproduce same-revision/retried cart mutations and add focused protection without blocking intentional duplicates.
5. Continue behavioral coverage for stale revisions, unsupported-browser fallback, route refresh, collection availability, shared cart state, provider failures, and Virtual Try-On errors when a safe harness is available.
6. Keep auditing schemas, descriptions, annotations, payload size, round trips, state recovery, registration churn, race handling, and observability without growing the tool surface unnecessarily.
7. Do not merge to `main` solely because a preview builds successfully.

## Latest commit SHA
Branch head entering this run: `29faf05998e7f0dc93449becf1b5760102a54fa2`.

This file is updated before the audit commit is created, so the resulting commit SHA is intentionally recorded by the next run rather than attempting a self-referential hash.

## Next run
Read this file first. Reverify repository/branch/production isolation and exact branch head. Retry for a build-capable checkout. If available, implement the Virtual Try-On registration-stability fix with a synchronous result ref and component-lifetime registration, build and test the full app, and only then commit it. Attempt real standards-style discovery/execution if a WebMCP-capable browser/test harness becomes available. Otherwise continue the fresh source-level audit and do not alter shared concurrency semantics without validation.

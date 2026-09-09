# CriShirt WebMCP Progress

## Mission
Keep the existing stable human CriShirt experience unchanged while exposing the same legitimate capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI/UX.

## Canonical repository / deployment facts
- Repository: `UnknownGod2011/crishirt-perfect-corp`.
- Production branch: `main`.
- Production commit: `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Working branch: `webmcp-agent-native`.
- Branch head entering this run: `c70dbcb2be8e6c35c31ccf3af800a032f95a807c`.
- Comparison at run start: 132 commits ahead of production, 0 behind; merge base is exactly `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Entering branch Vercel status: `success` / deployment completed.
- Production and production deployment configuration were not modified.

## Implemented WebMCP surface
Main bridge (`src/components/WebMCPBridge.tsx`):
1. `crishirt_get_workspace_state`
2. `crishirt_configure_workspace`
3. `crishirt_set_design_placement`
4. `crishirt_generate_design`
5. `crishirt_refine_design`
6. `crishirt_add_current_design_to_cart`
7. `crishirt_get_cart`
8. `crishirt_remove_cart_item`
9. `crishirt_navigate`

Collection bridge (`src/components/CollectionWebMCPBridge.tsx`):
10. `crishirt_list_collection`
11. `crishirt_add_collection_item_to_cart`

Virtual Try-On (`src/components/VRTryOn.tsx`):
12. `crishirt_get_tryon_state`
13. `crishirt_run_virtual_tryon`

All bridges feature-detect `document.modelContext`, so ordinary human flows continue normally when WebMCP is unavailable.

## Current safety / ergonomics
- Tools are semantic application actions, not DOM-click or CSS-selector wrappers.
- Tools reuse the same application/cart/catalog/provider state and logic used by humans.
- Workspace mutations support revision validation to reject stale agent mutations deterministically.
- Perfect Corp-backed generation/refinement/Try-On operations propagate WebMCP `AbortSignal` into `fetch`.
- Read operations use `readOnlyHint` where appropriate; provider/user-derived output uses `untrustedContentHint` where appropriate.
- Schemas are bounded to existing product capabilities and responses are compact/structured.
- Try-On photo capture/upload remains human-controlled and tools do not return raw person/result image bytes.

## Official WebMCP verification
Freshly reverified on 2026-09-10 against the official Web Machine Learning Community Group Draft Community Group Report dated 2026-09-04.

Still current and relevant:
- imperative API is `document.modelContext`;
- semantic registration is `registerTool(tool, options)`;
- in-page discovery/execution use `getTools()` and `executeTool()`;
- registration/execution can use `AbortSignal`;
- the current draft warns about ambiguity around rapidly unregistering and re-registering a same-name tool, so avoid unnecessary registration churn;
- official WPT results remain at `wpt.fyi/results/webmcp`.

## Fresh full-product audit — 2026-09-10 05:24 IST

### Repository isolation
Verified the canonical repository, `main`, `webmcp-agent-native`, entering head `c70dbcb2be8e6c35c31ccf3af800a032f95a807c`, exact production merge base, and 132-ahead/0-behind comparison. The WebMCP-relevant diff remains limited to `PROGRESS.md`, README WebMCP documentation, `src/App.tsx`, the three WebMCP/Try-On bridge components, shared collection catalog, and collection page integration.

### Create / edit / recovery journey
Re-audited the normal creation journey from scratch. The existing workspace read/configure/placement/generate/refine surface remains coherent and high-leverage. It replaces garment selector interpretation, side switching, drag/resize estimation, prompt entry, and repeated state rereads with semantic operations while preserving the same underlying state. `crishirt_generate_design` already combines optional garment configuration with generation to reduce round trips. No additional micro-tools are justified.

### Cart / collection / navigation
Current-design add-to-cart, compact cart inspection/removal, collection listing/add-to-cart, constrained semantic navigation, and workspace/cart reads cover the stable human journeys without inventing commerce functionality. The collection bridge still uses shared catalog/cart-item logic rather than a parallel agent-only representation. No broader idempotency or concurrency mechanism is justified without a reproduced failure.

### Virtual Try-On
Fresh source inspection again confirms both Try-On tools are registered inside a `useEffect` whose dependency is `[tryOnResult]`. Creating or clearing a result therefore aborts and re-registers otherwise identical tool definitions. This remains the strongest narrow source improvement because current WebMCP discourages ambiguous same-name re-registration churn.

Preferred fix remains small and architecture-safe: introduce a synchronous `tryOnResultRef`, keep it current with state, have `crishirt_get_tryon_state` read the ref, and register both Try-On tools for component lifetime rather than result lifetime.

The change was **not shipped this run** because the required clean local compile/test gate remains unavailable. A fresh clone of the canonical `webmcp-agent-native` branch failed again with `Could not resolve host: github.com`. Connected GitHub inspection and a green Vercel status for the entering head are not substitutes for compiling/testing a new behavioral mutation before committing it.

### Agent interaction cost / tool count
No new high-leverage semantic capability was found. The current 13-tool surface covers design state, garment configuration, artwork placement, generation/refinement, cart, collection, navigation/recovery, and privacy-safe Try-On with materially fewer visual observations, clicks, and round trips than the human UI. Growing the tool surface this run would add complexity without clear agent benefit.

### Human stability / unsupported browser
No Perfect Corp generation, editor/placement, cart, collection, Try-On, navigation, UI design, or deployment configuration was changed. Feature detection continues to preserve the human website when `document.modelContext` is unavailable.

## Verification / tests performed this run
- Read this durable handoff before any mutation.
- Verified canonical repository and default branch.
- Verified working branch head and exact production merge base.
- Compared production to branch: 132 ahead / 0 behind.
- Checked entering head combined status: Vercel `success`.
- Re-read `src/components/WebMCPBridge.tsx`, `src/components/CollectionWebMCPBridge.tsx`, `src/components/VRTryOn.tsx`, and README WebMCP documentation for semantic coverage, annotations, shared state, revision checks, cancellation, deterministic errors, and registration lifecycle.
- Reverified the official 2026-09-04 WebMCP specification and WPT location.
- Attempted a fresh clean clone/build environment; clone failed before install/build because local DNS could not resolve `github.com`.
- No functional source mutation was made; therefore no speculative or failing behavioral code was committed.

## Failures found / fixes applied
- No new human-flow regression found.
- No missing high-leverage semantic journey found.
- Known Try-On same-name registration churn remains.
- Transient build-environment blocker remains: local GitHub DNS resolution failure.
- This durable audit handoff was refreshed; no behavioral code changed.

## Remaining opportunities
1. When a clean build-capable checkout becomes available, implement the narrow Try-On result-ref/component-lifetime registration fix; run `npm ci`, `npm run build`, and relevant integration checks before committing.
2. Inspect actual `document.modelContext.getTools()` output and run representative `executeTool()` journeys in a WebMCP-capable browser/testing environment when available.
3. Use official Web Platform Tests as an additional compatibility signal when the environment supports WebMCP.
4. Reproduce simultaneous human/agent generation/refinement before adding any broader concurrency guard.
5. Reproduce retry/duplicate cart mutations before adding idempotency.
6. Keep auditing stale revisions, cancellation, provider failures, route changes/refresh, unsupported-browser fallback, collection/cart shared state, schemas, annotations, payload size, state recovery, registration churn, and agent round trips.
7. Do not merge to `main` solely because a remote preview build is green.

## Latest commit SHA
Latest verified branch head before this handoff update: `c70dbcb2be8e6c35c31ccf3af800a032f95a807c`.

The commit containing this file is necessarily created after the file contents are fixed, so its SHA is recorded by the next run rather than attempting a self-referential hash.

## Next run
Read this file first. Reverify canonical repo/branch/production isolation and deployment status. Retry a clean build-capable checkout. If it works, implement only the narrow Virtual Try-On registration-lifecycle fix, build/test it fully, and commit only if green. Also attempt real WebMCP discovery/execution or WPT-backed verification when a capable browser/test harness is available. If the build environment is still blocked, perform another fresh audit and preserve human behavior.
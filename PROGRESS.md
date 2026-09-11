# CriShirt WebMCP Progress

## Mission
Keep the existing stable human CriShirt experience unchanged while exposing the same legitimate capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI/UX.

## Canonical repository / deployment facts
- Repository: `UnknownGod2011/crishirt-perfect-corp`.
- Production branch: `main`.
- Production commit / exact merge base: `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Working branch: `webmcp-agent-native`.
- Branch head entering this run: `dc21babbfb8e30f6e51ace63768193f14c2c513d`.
- Entering comparison: 163 commits ahead of production, 0 behind.
- Entering Vercel status for `dc21babb...`: success.
- Production `main` and production deployment configuration were not modified.

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

All bridges feature-detect `document.modelContext`, so normal human flows continue when WebMCP is unavailable.

## Current safety / ergonomics
- Semantic application actions, not DOM-click/CSS-selector wrappers.
- Reuses the same React/cart/catalog/provider state and logic used by humans.
- Workspace mutations support optional revision validation for stale-state rejection.
- Perfect Corp generation/refinement/Try-On propagates the WebMCP execution `AbortSignal` into `fetch`.
- Read operations use `readOnlyHint`; provider/user-derived output uses `untrustedContentHint` where appropriate.
- Schemas are bounded to existing product capabilities and responses are compact/structured.
- Try-On photo capture/upload remains human-controlled and tools do not return raw person/result image bytes.
- Try-On tools remain registered stably across result-state changes via the lifecycle fix in `723d33e6457b894cf607af48d5f84c4d5082fee9`.

## Fresh full-product audit — 2026-09-11 11:21 IST

### Repository isolation
Verified the canonical repository, push permissions, `main`, working branch `webmcp-agent-native`, entering head `dc21babbfb8e30f6e51ace63768193f14c2c513d`, exact production merge base `88daa417caa5305f81e5554977a13a94a793cdeb`, and 163-ahead/0-behind state. Production remains untouched.

### Deployment verification
GitHub commit status for entering head `dc21babb...` reports Vercel success. No production deployment configuration was changed.

### Official WebMCP review
Freshly rechecked the current WebMCP material from the Web Machine Learning Community Group repository. The imperative surface remains `document.modelContext.registerTool(...)`, with `getTools()` / `executeTool()` for discovery and invocation, JSON Schema inputs, registration lifetime via `AbortSignal`, execution cancellation, read-only/untrusted-content annotations, and same-origin discovery by default.

The current design still favors registering stable semantic application tools rather than DOM wrappers. No spec change observed this run requires widening the CriShirt tool surface or altering same-origin exposure.

### Human journey versus agent journey
Re-audited the stable user journey from scratch: workspace read/configuration, garment/color/material/size/side selection, Perfect Corp generation, refinement, artwork placement, collection listing/add-to-cart, cart read/remove, constrained navigation, and Virtual Try-On readiness/execution after human photo consent. The existing 13-tool surface still covers the stable in-scope human goals without requiring visual DOM interpretation.

The current surface remains round-trip efficient: generation accepts optional garment configuration in the same call; refinement reuses workspace image state; workspace state is consolidated; collection is structurally readable; Try-On can target a stable cart item id; navigation is constrained to existing routes.

### New concrete race finding: generation/refinement admission
A fresh concurrency audit found a deterministic admission window in `src/components/WebMCPBridge.tsx`:
- `crishirt_generate_design` and `crishirt_refine_design` reject work when `stateRef.current.isGenerating || stateRef.current.isRefining` is already true.
- Each tool then sets the busy flag through React `dispatch` before starting its Perfect Corp fetch.
- Two `executeTool()` calls started nearly simultaneously can both observe the pre-dispatch state before React commits the first busy update, allowing two provider operations to begin.

This is a WebMCP-specific reliability issue because an agent can invoke tools concurrently/retry rapidly. The narrow safe fix is to add a synchronous bridge-local in-flight ref shared by generation and refinement, set it immediately after validation and before dispatch/fetch, reject a second admission deterministically with `WORKSPACE_BUSY`, and clear it in `finally`. This does not require changing product architecture or human UI behavior.

The fix was **not shipped this run** because the required clean build gate could not be executed. The execution container again failed while cloning the canonical repository with `Could not resolve host: github.com`. Per the mission rules, no behavioral source change is committed without a successful build/test gate.

### Race handling / recovery / cancellation
- Prior Try-On registration churn remains fixed.
- Workspace revision validation remains a lightweight stale-edit guard.
- Generation/refinement cancellation already propagates to provider requests.
- The newly identified near-simultaneous generation/refinement admission race is the highest-priority remaining source improvement once a build-capable checkout is available.
- Add-to-cart remains additive and remove-by-id deterministic; no duplicate/retry failure has been reproduced that justifies idempotency keys.
- No additional route recovery, provider-state, or Try-On race was reproduced in this audit.

### Schema / payload / annotation audit
- Tool names remain coherent and within current WebMCP naming constraints.
- Input schemas remain bounded and reject extra properties.
- User/provider-derived text returned by workspace/cart/Try-On surfaces remains marked untrusted where appropriate.
- Read-only surfaces retain `readOnlyHint`.
- No new compound tool, output expansion, cross-origin exposure, or schema widening clears the safety/utility bar this run.

### Unsupported-browser / refresh behavior
Bridge components continue to feature-detect `document.modelContext` and return without side effects when unavailable. Existing human React state/navigation behavior remains independent of tool registration.

### README maturity check
The README WebMCP section remains accurate and concise: it documents the 13 semantic tools, agent-use philosophy, privacy boundary, revision/cancellation behavior, testing approach, and durable handoff location. No README change was needed.

## Verification / tests performed this run
- Read this durable handoff before mutation.
- Verified canonical repository identity, default branch, write permissions, production `main`, and working branch.
- Verified entering head `dc21babb...`, exact production merge base, and 163-ahead/0-behind comparison.
- Verified Vercel success status on entering head.
- Re-read the full main WebMCP bridge, Collection bridge, Virtual Try-On registration/execution path, package scripts, README WebMCP section, and repository tree relevant to the stable flows.
- Rechecked current WebMCP registration/discovery/lifecycle semantics from the Web Machine Learning Community Group material.
- Re-audited human-versus-agent interaction cost for all current stable flows.
- Reproduced the generation/refinement admission race by code-path reasoning: the busy guard reads React state, while the guard-setting dispatch is asynchronous, leaving a same-tick concurrent invocation window.
- Attempted a clean checkout/build with `git clone --branch webmcp-agent-native --single-branch ...` followed by `npm ci && npm run build`; clone failed before install/build with `Could not resolve host: github.com`.
- `package.json` still has no dedicated test script; the relevant full compile/build gate is `tsc -b && vite build` via `npm run build`.
- No behavioral source code was changed because the clean build gate was unavailable.

## Failures found / fixes applied
- Found one concrete WebMCP concurrency weakness: near-simultaneous agent generation/refinement calls can both pass the React busy-state guard before the first dispatch commits.
- Did not ship the narrow ref-lock fix because a clean build could not be run in the current execution container.
- No new human-flow regression was found.
- Actual browser-side `document.modelContext.getTools()` / `executeTool()` execution remains unavailable in the current automation environment.

## Remaining opportunities
1. **Highest priority:** once a clean checkout can build, add and validate one shared synchronous WebMCP generation/refinement in-flight guard before provider fetches; verify cancellation clears the guard in `finally` and a second concurrent invocation returns deterministic `WORKSPACE_BUSY`.
2. Run `npm ci`, `npm run build`, and `npm run lint` after that narrow change; ship only if all relevant gates are green.
3. Inspect actual `document.modelContext.getTools()` output and execute representative CriShirt journeys in a WebMCP-capable browser/test environment when available.
4. Exercise cancellation, provider failure, stale revision, route changes/refresh, unsupported-browser fallback, annotations, registration stability, and same-origin exposure in that environment.
5. Reproduce human-vs-agent simultaneous generation/refinement before introducing any broader shared locking architecture; do not rewrite product state preemptively.
6. Reproduce retry/duplicate cart mutations before adding idempotency.
7. Continue re-auditing schemas, payload size, round trips, state recovery, race handling, cancellation, observability, and tool ergonomics each run.
8. Do not merge to `main` solely because a feature-branch preview is green.

## Latest commit SHA
Latest tested behavioral source commit: `723d33e6457b894cf607af48d5f84c4d5082fee9`.
Entering documentation head: `dc21babbfb8e30f6e51ace63768193f14c2c513d`.

The commit containing this handoff file is created after its contents are fixed, so its own SHA is recorded by the next run rather than attempting a self-referential hash.

## Next run
Read this file first. Reverify canonical repo/branch/production isolation and deployment status. Retry a clean checkout/build early. If the build gate is available, implement only the narrow synchronous generation/refinement admission guard, build/lint it, and commit only if green. Then re-audit the entire human journey again and continue searching for safe improvements in agent speed, schemas, payload size, state recovery, races, cancellation, observability, and browser-level tool execution. If build remains unavailable, do not ship untested behavioral code; record a fresh audit instead.

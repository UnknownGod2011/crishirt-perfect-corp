# CriShirt WebMCP Progress

## Mission
Keep the existing stable human CriShirt experience unchanged while exposing the same legitimate capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI/UX.

## Canonical repository / deployment facts
- Repository: `UnknownGod2011/crishirt-perfect-corp`.
- Production branch: `main`.
- Production commit / exact merge base: `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Working branch: `webmcp-agent-native`.
- Branch head entering this run: `137f12082fc477579e045c09bcfcb771735bb29b`.
- Entering comparison: 162 commits ahead of production, 0 behind.
- Entering Vercel deployment for `137f120...`: `READY`; authenticated fetch returned HTTP 200 and the expected CriShirt application shell.
- Vercel project `crishirtpc` remains linked to `UnknownGod2011/crishirt-perfect-corp`.
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
- Reuses the same application/cart/catalog/provider state and logic used by humans.
- Workspace mutations support revision validation for stale-state rejection.
- Perfect Corp generation/refinement/Try-On propagates the WebMCP execution `AbortSignal` into `fetch`.
- Read operations use `readOnlyHint`; provider/user-derived output uses `untrustedContentHint` where appropriate.
- Schemas are bounded to existing product capabilities and responses are compact/structured.
- Try-On photo capture/upload remains human-controlled and tools do not return raw person/result image bytes.
- Try-On tools remain registered stably across result-state changes via the lifecycle fix in `723d33e6457b894cf607af48d5f84c4d5082fee9`.

## Fresh full-product audit — 2026-09-11 10:21 IST

### Repository isolation
Verified the canonical repository and push permissions, production `main`, working branch `webmcp-agent-native`, entering head `137f12082fc477579e045c09bcfcb771735bb29b`, exact production merge base `88daa417caa5305f81e5554977a13a94a793cdeb`, and 162-ahead/0-behind state. Production remains untouched.

### Deployment verification
The Vercel project `crishirtpc` is still linked specifically to `UnknownGod2011/crishirt-perfect-corp`. The newest deployment corresponds to branch head `137f120...` on `webmcp-agent-native`, is `READY`, and an authenticated direct fetch returned HTTP 200 with the expected CriShirt application shell. No deployment configuration was changed.

### Official WebMCP review
Fresh verification against the current official WebMCP Community Group draft dated 9 September 2026 reconfirmed the imperative `document.modelContext.registerTool(...)` model, `getTools()`, `executeTool()`, JSON Schema `inputSchema`, `title`, registration cancellation, execution cancellation, and the `readOnlyHint`, `untrustedContentHint`, and `consequentialHint` annotations.

The draft still warns that rapid unregister/re-register cycles with the same tool name can race with discovery/execution. The prior Try-On lifecycle fix remains correct: the Try-On tools stay registered for the component lifetime and read result state through refs rather than re-registering on each result change.

The current draft's `exposedTo` / `fromOrigins` controls remain unnecessary for CriShirt's top-level same-origin tools. Same-origin discovery is already supported; intentionally widening cross-origin exposure would add no product capability and needless draft coupling.

The official report now links a Web Platform Tests suite (`wpt.fyi/results/webmcp`). That is useful for browser implementation coverage, but it does not replace app-level execution of CriShirt's registered tools in a WebMCP-capable browser.

### Human journey versus agent journey
Re-audited the stable user journey from scratch: workspace state, garment/color/material/size/side configuration, generation, refinement, design placement, collection inspection, cart add/read/remove, constrained navigation, and Virtual Try-On readiness/execution after human photo consent. The existing 13-tool surface covers every stable human goal in scope without requiring visual DOM interpretation. No missing high-leverage semantic action was found.

The current surface still avoids unnecessary round trips: generation can accept garment settings in the same call; refinement reuses the workspace image; workspace state is consolidated; collection products are returned structurally; Try-On accepts a stable cart item ID; navigation is constrained to existing routes.

### Race handling / recovery / cancellation
- The prior Try-On registration race remains fixed.
- Workspace revision validation remains a lightweight guard against stale human/agent edits.
- Add-to-cart operations are additive and remove-by-id is deterministic; no duplicate/retry failure has been reproduced that justifies introducing idempotency keys.
- Generation/refinement/Try-On already reject active busy states where relevant and propagate cancellation to provider requests.
- No new silent-overwrite, stale-state, route-recovery, or provider-state race was reproduced in this audit.

### Schema / payload / annotation audit
- Tool names remain within current WebMCP naming constraints.
- Input schemas remain bounded and reject extra properties.
- User/provider-derived text returned by workspace/cart/Try-On surfaces remains marked untrusted where applicable.
- `consequentialHint=true` remains inappropriate because current actions are reversible in-app operations, not significant real-world/non-reversible actions.
- No new schema widening, compound tool, output field, or annotation cleared the safety/utility bar this run.

### Unsupported-browser / refresh behavior
The bridge components still feature-detect `document.modelContext` and return without side effects when unavailable. Existing human React state/navigation behavior remains independent of WebMCP registration. No code change was justified here.

### README maturity check
The README's concise WebMCP section remains accurate: it documents the 13 semantic tools, agent-use philosophy, privacy boundary, revision/cancellation behavior, and testing approach without turning into an internal log. No README change was needed.

## Verification / tests performed this run
- Read this durable handoff before any mutation.
- Verified canonical repository identity, default branch, and write permissions.
- Verified working-branch head `137f120...` and exact production merge base.
- Compared branch to production: 162 ahead, 0 behind.
- Re-read the main WebMCP bridge, Collection bridge, Virtual Try-On registration/execution path, shared application/cart state, route mounting, package scripts, and README WebMCP section.
- Freshly verified the official WebMCP draft and its current registration, execution, annotations, origin-exposure, cancellation, and race semantics.
- Verified the official draft links the Web Platform Tests suite for WebMCP.
- Verified the newest `crishirtpc` Vercel deployment is `READY` for `137f120...` on `webmcp-agent-native`.
- Authenticated deployment fetch returned HTTP 200 with the expected app shell.
- Vercel build success serves as the current full TypeScript/Vite deployment build gate; this repository still has no dedicated automated test script in `package.json`.
- No behavioral source code was changed because no improvement cleared the risk/utility bar.

## Failures found / fixes applied
- No new human-flow regression found.
- No missing high-leverage semantic journey found.
- No new behavioral WebMCP source fix was warranted this run.
- Actual browser-side `document.modelContext.getTools()` / `executeTool()` execution of CriShirt remains unavailable in the current automation environment.

## Remaining opportunities
1. Inspect actual `document.modelContext.getTools()` output and execute representative CriShirt journeys in a WebMCP-capable browser or official test environment when available.
2. Exercise cancellation, provider failure, stale revision, route changes/refresh, unsupported-browser fallback, annotations, registration stability, and same-origin/cross-origin exposure in that environment.
3. Reproduce simultaneous human/agent generation or refinement before adding broader locking/concurrency guards.
4. Reproduce retry/duplicate cart mutations before adding idempotency.
5. Consider adding narrowly scoped WebMCP-focused automated tests only if they can validate real registration/schema/state behavior without introducing a fragile mock architecture or changing product code.
6. Continue re-auditing schemas, payload size, round trips, state recovery, race handling, cancellation, observability, and tool ergonomics each run.
7. Do not merge to `main` solely because a feature-branch preview is green.

## Latest commit SHA
Latest tested behavioral source commit: `723d33e6457b894cf607af48d5f84c4d5082fee9`.
Entering documentation head: `137f12082fc477579e045c09bcfcb771735bb29b`.

The commit containing this handoff file is created after its contents are fixed, so its own SHA is recorded by the next run rather than attempting a self-referential hash.

## Next run
Read this file first. Reverify canonical repo/branch/production isolation and deployment status. Re-audit the entire existing human journey before proposing changes. Prioritize real browser/tool-discovery execution (`getTools()` / `executeTool()`) if a capable environment becomes available. Otherwise search only for concrete, reproducible improvements in schemas, payload size, round trips, cancellation, state recovery, race handling, observability, and current draft compatibility. If no safe code change is justified, record a fresh no-op audit rather than inventing functionality.

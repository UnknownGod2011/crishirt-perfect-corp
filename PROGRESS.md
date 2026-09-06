# CriShirt WebMCP Progress

## Mission

Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI work.

## Canonical repository and deployment facts

- Repository: `UnknownGod2011/crishirt-perfect-corp`
- Production branch: `main`
- Production commit: `88daa417caa5305f81e5554977a13a94a793cdeb`
- Working branch: `webmcp-agent-native`
- Branch head entering this audit: `08d5e2ae9c0832b1ed2b14944515de0a0c4210fe`
- Compare entering this audit: 42 commits ahead of `main`, 0 behind; merge base is exactly production commit `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Vercel project: `crishirtpc` (`prj_jAm749oRS01LbAdwec2lKvKZgAEF`).
- Exact preview for `08d5e2ae9c0832b1ed2b14944515de0a0c4210fe`: deployment `dpl_8BK8UNPYDK3ry82EbHc7p3yc1GCF`, state `READY`, verified 2026-09-06.
- Build logs for that exact deployment confirm successful `npm install` and `npm run build` (`tsc -b && vite build`), with 2020 modules transformed and production output deployed successfully.
- Production remains on `main`; this WebMCP branch has not been promoted.
- No production deployment configuration, environment variable, commerce, auth, database, or unrelated UI change was made in this audit.

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

Virtual Try-On integration: `src/components/VRTryOn.tsx`

12. `crishirt_get_tryon_state`
13. `crishirt_run_virtual_tryon`

All WebMCP entry points feature-detect `document.modelContext`, so unsupported browsers retain the normal human UI flow.

## Shared state, safety, and privacy

- Workspace mutations accept optional `expectedRevision`; stale calls return deterministic `STALE_STATE` instead of silently overwriting later state.
- Perfect Corp generation/refinement and Virtual Try-On propagate the WebMCP execution `AbortSignal` to fetch.
- Collection catalog/cart behavior is shared between humans and agents through `src/config/collectionCatalog.ts`.
- Virtual Try-On humans and agents share the same `generateVirtualTryOn` action.
- Camera permission, file picking, raw person-photo data, generated try-on result bytes/URLs, and downloads remain human-controlled.
- No primary tool is a DOM-click, CSS-selector, coordinate-click, or visual wrapper.

## Current official WebMCP specification check

Freshly reverified on 2026-09-06 against the official Web Machine Learning Community Group **WebMCP Draft Community Group Report dated 2026-09-04**.

The implementation target remains correct: secure-context `document.modelContext`, semantic `registerTool`, JSON Schema `inputSchema`, registration cancellation, execution `AbortSignal`, `getTools()`, and `executeTool()`.

No current specification change justifies an architecture rewrite or new product behavior.

## Fresh full-journey audit — 2026-09-06 12:24 IST

### Repository / production isolation

Repository identity, write access, branch identity, production baseline, branch divergence, and the exact preview deployment were rechecked before considering any mutation. The working branch remains isolated from production and 0 commits behind `main`.

### Create / edit

`crishirt_get_workspace_state` still gives the agent garment configuration, front/back design presence and placement, busy state, cart count, route, valid product options, and a revision token in one compact call. `crishirt_configure_workspace` replaces multiple selector interactions. `crishirt_set_design_placement` replaces visual drag/resize/rotate work with bounded semantic coordinates.

No broader compound tool is justified: combining generate + placement + cart would reduce only a few round trips while increasing side-effect blast radius and partial-failure ambiguity.

### Generation / refinement concurrency

Direct source inspection again confirms the concrete timing window. Both `crishirt_generate_design` and `crishirt_refine_design` check React-backed `isGenerating` / `isRefining`, then dispatch the busy state. `stateRef` only observes that change after React propagation, so two sufficiently close WebMCP invocations can both pass the busy check.

The smallest correct fix remains a synchronous in-memory operation guard shared by generation and refinement, released in `finally`, while retaining the existing React busy flags for the human UI. This avoids a state-management rewrite.

That patch was deliberately not shipped in this audit because this runtime still cannot execute a behavioral WebMCP test against the deployed app: the documented `agent-browser` executable is not installed, and a clean local clone again failed with `Could not resolve host: github.com`. Build health is proven through Vercel, but changing concurrency semantics without a behavioral reproduction/verification path is not yet justified.

### Revision / cart race

Optimistic `expectedRevision` validation is still non-atomic for sufficiently close synchronous mutations because `revisionRef` advances when React state propagates. Two rapid add-to-cart calls can therefore validate the same revision before the first dispatch becomes observable and can create duplicate items.

The preferred cart hardening remains focused same-revision reservation/duplicate handling rather than a global state rewrite. This should be implemented only with a targeted behavioral test.

### Cart

Existing human cart capabilities remain semantically covered: inspect, add the currently configured apparel/design, add supported collection items, and remove existing items. No quantity-update or checkout tool is added because the stable human site does not expose corresponding shared actions.

### Exclusive Collection

`crishirt_list_collection` avoids visual card inspection and returns stable product IDs, category, price, availability, and image path. `crishirt_add_collection_item_to_cart` uses the same shared catalog/cart model as the human page and rejects unavailable items. No agent-only product behavior is introduced.

### Navigation

Create, Virtual Try-On, Collection, and Cart remain directly reachable through one bounded semantic navigation tool. Additional route tools would only increase discovery burden.

### Virtual Try-On

The privacy boundary remains appropriate. `crishirt_get_tryon_state` reports readiness and eligible cart item IDs without exposing the user photo or result bytes. `crishirt_run_virtual_tryon` reuses the shared application action, propagates cancellation, and returns deterministic errors. Camera/file acquisition remains human-controlled.

Try-on already sets `loadingRef.current` synchronously when starting, so it has a stronger immediate overlap guard than generation/refinement.

### Schemas / payloads / annotations / recovery

The 13-tool surface remains coherent and high leverage. Read tools are compact, schemas are bounded to existing product capabilities, `readOnlyHint` and `untrustedContentHint` are present where appropriate, and errors are structured. No new tiny wrappers or schema expansion is justified in this audit.

### Unsupported browser / refresh / route lifecycle

All bridges feature-detect `document.modelContext`; normal human behavior remains available when WebMCP is absent. Registration lifetime remains tied to component lifetime with abort controllers. No safe lifecycle change is justified without actual WebMCP browser execution.

## Tests and verification performed this audit

- Read `PROGRESS.md` before considering changes.
- Verified canonical repository `UnknownGod2011/crishirt-perfect-corp` and write access.
- Verified working branch `webmcp-agent-native` at exact head `08d5e2ae9c0832b1ed2b14944515de0a0c4210fe`.
- Verified production `main` remains exactly `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Compared branch against production: 42 commits ahead, 0 behind, merge base exactly production baseline.
- Re-inspected `src/components/WebMCPBridge.tsx`, especially revision checks, generation/refinement busy checks, cancellation, schemas, placement, cart, and navigation.
- Rechecked `package.json`: build remains `tsc -b && vite build`; there is still no unit/integration test runner configured.
- Reverified the official WebMCP draft dated 2026-09-04.
- Verified exact Vercel deployment `dpl_8BK8UNPYDK3ry82EbHc7p3yc1GCF` for commit `08d5e2ae...` is `READY`.
- Inspected that deployment's build log: `tsc -b && vite build` completed successfully, 2020 modules transformed, deployment completed.
- Retried the prescribed browser runtime path: `agent-browser` is still not installed.
- Retried a fresh clean local clone: DNS resolution for `github.com` still fails in the execution container.
- Re-audited create/edit, generation/refinement, cart, collection, navigation, try-on, unsupported-browser fallback, stale state, duplicate invocation, cancellation, provider failure boundaries, refresh/route handling, payload size, and tool count.

## Failures found / fixes applied

- No deployment failure: the exact entering commit preview is `READY` and build-valid.
- Generation/refinement overlap remains a verified source-level race candidate.
- Optimistic revision checks remain non-atomic for sufficiently close calls; duplicate cart add is the clearest associated risk.
- Actual WebMCP browser execution remains blocked because `agent-browser` is unavailable.
- Local independent clone/build remains blocked by transient DNS resolution failure for `github.com`.
- No speculative functional source change was shipped.
- No production, deployment-config, unrelated repository, or UI change was made.

## Remaining opportunities

1. Execute real `document.modelContext.getTools()` discovery and representative `executeTool()` calls in a WebMCP-capable browser/testing surface.
2. Reproduce simultaneous generation/refinement under controlled execution, then add the smallest synchronous shared operation guard and verify cancellation/release behavior.
3. Reproduce same-revision duplicate cart mutation, then add focused revision reservation/duplicate protection without rewriting shared state.
4. Add lightweight tests for stale revisions, repeated same-revision mutation, cancellation, provider failure, unsupported-browser fallback, collection availability, route refresh, shared cart state, and Virtual Try-On errors when a safe harness becomes available.
5. Continue auditing schemas, descriptions, annotations, payload size, round trips, and recovery behavior without growing the tool surface unnecessarily.
6. Do not merge to `main` solely because previews build successfully.

## README

`README.md` already contains a concise WebMCP philosophy/capability/testing section. No README change is justified in this audit; detailed run history belongs here.

## Latest commit SHA

Latest audited working-branch commit entering this audit: `08d5e2ae9c0832b1ed2b14944515de0a0c4210fe`.

This file is updated before the audit documentation commit is created, so the resulting documentation commit SHA is intentionally recorded by the following run rather than attempting a self-referential hash.

## Next run

Read this file first. Reverify repo/branch/production isolation and exact preview status. Recheck the official WebMCP draft. Prefer obtaining actual browser execution or a safe lightweight behavioral harness; if available, reproduce the overlap window and ship only the smallest synchronous guard with build/behavior validation. Otherwise continue a fresh human-vs-agent interaction-cost/race audit and do not ship speculative functional code.

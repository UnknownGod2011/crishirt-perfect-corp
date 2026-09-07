# CriShirt WebMCP Progress

## Mission
Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI/UX work.

## Canonical repository and deployment facts
- Repository: `UnknownGod2011/crishirt-perfect-corp`
- Production branch: `main`
- Production commit: `88daa417caa5305f81e5554977a13a94a793cdeb`
- Working branch: `webmcp-agent-native`
- Branch head entering this run: `8258dbdac1d09ef25f7a4c9edacca606e9e3506b`
- Compare entering this run: 66 commits ahead of `main`, 0 behind; merge base exactly production commit `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Production remains on `main`; this WebMCP branch has not been promoted.
- Vercel project: `crishirtpc` (`prj_jAm749oRS01LbAdwec2lKvKZgAEF`).
- Exact entering preview for `8258dbd...`: `dpl_ApuUgeTCd4b6tmDLy1FdJdDwvtsh`, state `READY`.
- Vercel metadata ties that preview to repository `UnknownGod2011/crishirt-perfect-corp`, branch `webmcp-agent-native`, and SHA `8258dbdac1d09ef25f7a4c9edacca606e9e3506b`.
- Entering preview build cloned the canonical repository, ran `npm install`, then `tsc -b && vite build`, transformed 2020 modules, and completed successfully.
- Build emitted existing dependency-audit/Browserslist warnings; they are outside this WebMCP-only mission and were not changed.
- No production deployment configuration, environment variables, auth, database, commerce, or unrelated UI were changed.

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

All WebMCP entry points feature-detect `document.modelContext`, so unsupported browsers retain normal human UI behavior.

## Shared state, safety, and privacy
- Workspace mutations accept optional `expectedRevision`; stale calls return deterministic `STALE_STATE` rather than silently overwriting later state.
- Collection catalog/cart behavior is shared between humans and agents through `src/config/collectionCatalog.ts`.
- Virtual Try-On humans and agents share the same `generateVirtualTryOn` action.
- Camera permission, file picking, raw person-photo data, generated try-on result bytes/URLs, and downloads remain human-controlled.
- No primary tool is a DOM-click, CSS-selector, coordinate-click, or visual wrapper.
- Provider-backed callbacks propagate the WebMCP execution `AbortSignal` into cancellable provider requests.

## Current official WebMCP specification check
Reverified on 2026-09-07 against the official Web Machine Learning Community Group WebMCP Draft Community Group Report dated 2026-09-04.

Relevant draft facts remain:
- `document.modelContext` is the imperative API surface.
- `registerTool(tool, options)` is the semantic registration path.
- Tool execution receives per-execution options carrying an `AbortSignal`.
- Registration lifetime cancellation is separate from per-execution cancellation.
- `getTools()` and `executeTool()` are the in-page discovery/execution APIs.
- The current draft explicitly documents that rapid unregister/re-register cycles can race with discovery/execution and target either the old or new registration.
- Current annotations include `readOnlyHint`, `untrustedContentHint`, and `consequentialHint`.

No new spec-driven surface correction is required this run.

## Fresh full-journey audit — 2026-09-07

### Repository / production isolation
Verified canonical repository identity, default branch, working branch, exact entering head, production baseline, divergence, merge base, and exact Vercel preview before mutation. The run stayed scoped to this repository and did not touch `main` or production configuration.

### Create / edit / state recovery
`crishirt_get_workspace_state` continues to provide the compact semantic observation needed for recovery: route, garment configuration, front/back design presence and placement, busy state, cart count, valid product choices, and a revision token. Workspace configuration, placement, and navigation reuse application state rather than visual clicking. No new tool is justified; a mega-tool combining generation, placement, navigation, and cart mutation would make partial failures and state recovery less clear.

### Generation / refinement
Generation and refinement remain semantically exposed through shared application state, validate inputs, propagate execution cancellation, and return deterministic errors. The same-tick overlap window remains theoretically possible because React-backed busy state may not propagate before an extremely close second human or agent execution. A bridge-only mutex remains insufficient because it would not cover human/agent overlap. Any fix should guard the shared action path and be tested for duplicate rejection, cancellation cleanup, provider failure cleanup, and lock release before shipping.

### Artwork placement
Semantic placement remains materially better than agent-side visual dragging: the tool accepts bounded x/y/width/height/rotation values and operates on the same stored front/back alignment used by the visible editor. No additional micro-tools are justified.

### Cart / collection
Current-design cart add, compact cart inspection, removal, collection listing, and collection add-to-cart remain semantically covered using the same shared state/catalog as the human UI. Stable IDs and availability validation remain in place. The same-revision/same-tick mutation window remains theoretical; naive idempotency is unsafe because intentional duplicate adds are legitimate existing behavior.

### Navigation / recovery
`crishirt_navigate` and workspace route reporting continue to remove unnecessary visual route discovery while preserving the same supported human destinations. No hidden routes or new product behavior were added.

### Virtual Try-On
The privacy boundary remains correct: the human supplies the photo; WebMCP exposes readiness and execution only against already-supplied photo/cart state. Provider cancellation is propagated and `loadingRef` is synchronously set before the request, so duplicate try-on execution is rejected promptly.

The strongest narrow improvement remains registration stability. `VRTryOn.tsx` still registers both Try-On tools in an effect whose dependency is `[tryOnResult]`. Successful try-on completion or clearing/changing the result causes unchanged semantic tools to be unregistered and registered again. The current official draft specifically warns that rapid unregister/re-register transitions can race with discovery/execution. A component-lifetime registration backed by a live `tryOnResult` ref would remove that unnecessary churn while preserving the visible UI and privacy boundary.

That functional change was not shipped because the required pre-commit full-app validation remains unavailable in this runtime. A fresh `git ls-remote https://github.com/UnknownGod2011/crishirt-perfect-corp.git HEAD` again failed before mutation with `Could not resolve host: github.com`, so there is still no local build-capable checkout. Committing behavior changes before the relevant app can be built would violate the validation gate.

### Schemas, annotations, payloads, round trips, and observability
The 13-tool surface remains coherent and high leverage. Read tools remain read-only, untrusted-content annotations remain appropriate, responses are compact and structured, errors are deterministic, and no current reversible/non-financial action warrants adding a consequential tool merely for annotation coverage. Existing `console.warn` registration diagnostics remain lightweight and sufficient; no extra user-facing telemetry is justified.

### Unsupported browser / normal human website
The bridges continue to return early when `document.modelContext` or `registerTool` is unavailable. Nothing in this run changed rendering, Perfect Corp provider paths, human cart behavior, navigation, collection UI, editing/placement, or try-on controls.

### README maturity check
`README.md` was re-read and remains concise and accurate for the current mature surface: it documents the semantic tool philosophy, all thirteen capabilities, privacy boundary, revision handling, testing approach, and cancellation semantics without duplicating this detailed run log.

## Tests and verification performed this run
- Read `PROGRESS.md` before editing.
- Verified canonical repository identity and admin/push access.
- Verified `webmcp-agent-native` entered at `8258dbdac1d09ef25f7a4c9edacca606e9e3506b`.
- Verified `main` remains `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Compared branch against production: 66 commits ahead, 0 behind, merge base exactly production.
- Verified entering Vercel preview `dpl_ApuUgeTCd4b6tmDLy1FdJdDwvtsh` is `READY` and tied to the correct repository/branch/SHA.
- Verified its build cloned the canonical repository, ran `npm install`, `tsc -b && vite build`, transformed 2020 modules, and completed successfully.
- Reverified the official 2026-09-04 WebMCP draft and current `document.modelContext` / `registerTool` / `getTools()` / `executeTool()` / execution `AbortSignal` API shape.
- Re-inspected `src/components/WebMCPBridge.tsx` for semantic state reads, revision validation, bounded placement, provider cancellation, structured errors, and unsupported-browser fallback.
- Re-inspected `src/components/VRTryOn.tsx` for privacy boundaries, synchronous busy guarding, provider cancellation, compact readiness output, and the `[tryOnResult]` registration dependency.
- Re-read the mature WebMCP README section for accuracy and scope discipline.
- Retested local repository access; direct `github.com` DNS resolution still fails in the container with `Could not resolve host: github.com`.
- No functional source change was made, so no unvalidated behavior was committed.

## Failures found / fixes applied
- No new human-flow regression found.
- No missing high-leverage semantic capability found.
- Registration-lifecycle inefficiency remains: Virtual Try-On tools are needlessly re-registered whenever `tryOnResult` changes.
- Remaining candidate: shared generation/refinement same-tick overlap protection covering both human and agent paths.
- Remaining candidate: focused cart retry/same-tick protection that preserves deliberate duplicate adds.
- Environment limitation: direct `github.com` DNS resolution still fails in the build container; actual browser-side `document.modelContext.getTools()` / `executeTool()` execution is also unavailable in this runtime.

## Remaining opportunities
1. When a build-capable checkout is available, implement and locally validate the Virtual Try-On registration-stability change before committing it.
2. Execute actual `document.modelContext.getTools()` discovery and representative `executeTool()` calls in a WebMCP-capable browser/testing surface when available.
3. Reproduce simultaneous generation/refinement and add the smallest shared guard covering both human and agent paths, with cancellation/provider-failure cleanup tests.
4. Reproduce same-revision/retried cart mutations and add focused protection without blocking intentional duplicates.
5. Continue focused behavioral coverage for stale revisions, unsupported-browser fallback, route refresh, collection availability, shared cart state, provider failures, and Virtual Try-On errors when a safe harness is available.
6. Keep auditing schemas, descriptions, annotations, payload size, round trips, state recovery, registration churn, race handling, and observability without growing the tool surface unnecessarily.
7. Do not merge to `main` solely because a preview builds successfully.

## README
`README.md` remains concise and accurate. Detailed run history remains here.

## Latest commit SHA
Branch head entering this run: `8258dbdac1d09ef25f7a4c9edacca606e9e3506b`.

This file is updated before the audit commit is created, so the resulting commit SHA is intentionally recorded by the next run rather than attempting a self-referential hash.

## Next run
Read this file first. Reverify repository/branch/production isolation and the exact preview/build for the commit produced by this run. Retry for a build-capable checkout. If available, implement the Virtual Try-On registration-stability fix with a synchronous result ref and component-lifetime registration, build the full app, and only then commit it. Attempt real standards-style discovery/execution if a WebMCP-capable browser/test harness becomes available. Otherwise continue the fresh source-level audit and do not alter shared concurrency semantics without validation.
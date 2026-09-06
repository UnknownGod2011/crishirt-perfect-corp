# CriShirt WebMCP Progress

## Mission
Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI work.

## Canonical repository and deployment facts
- Repository: `UnknownGod2011/crishirt-perfect-corp`
- Production branch: `main`
- Production commit: `88daa417caa5305f81e5554977a13a94a793cdeb`
- Working branch: `webmcp-agent-native`
- Branch head entering this run: `eb85acb466f21db4db8216621a30b78ad3f770b3`
- Compare entering this run: 60 commits ahead of `main`, 0 behind; merge base exactly production commit `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Production remains on `main`; this WebMCP branch has not been promoted.
- Vercel project: `crishirtpc` (`prj_jAm749oRS01LbAdwec2lKvKZgAEF`).
- Exact entering deployment for `eb85acb...`: `dpl_3HgBMxjhZCmQkyKKpUHVBiwWWSfK`, state `READY`.
- Vercel metadata ties that deployment to repository `UnknownGod2011/crishirt-perfect-corp`, branch `webmcp-agent-native`, and SHA `eb85acb466f21db4db8216621a30b78ad3f770b3`.
- Entering preview build ran `tsc -b && vite build`, transformed 2020 modules, and completed successfully.
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

Relevant current draft facts remain:
- `document.modelContext` is the imperative API surface.
- `registerTool(tool, options)` is the semantic registration path.
- Tool execution receives per-execution options carrying an `AbortSignal`.
- Registration lifetime cancellation is separate from per-execution cancellation.
- `getTools()` and `executeTool()` are the in-page discovery/execution APIs.
- Current annotations include `readOnlyHint`, `untrustedContentHint`, and `consequentialHint`.

No new spec-driven correction is required this run.

## Fresh full-journey audit — 2026-09-07

### Repository / production isolation
Verified repository identity, default branch, working branch, exact branch head, production baseline, divergence, exact merge base, and exact Vercel preview metadata before mutation. This run stayed scoped to the canonical repository and did not touch `main` or production configuration.

### Create / edit / state recovery
The existing workspace state tool still compresses garment settings, design presence and placement, busy state, cart count, valid options, route, and revision into one semantic observation. Workspace configuration and design placement reuse application state rather than visual clicking. Route recovery and direct navigation remain semantically covered.

No additional compound create/edit/navigation tool is justified: bundling generation, placement, and cart mutation would hide partial failures and make recovery less deterministic.

### Generation / refinement
Generation and refinement remain semantically exposed, validate inputs, use shared application state, propagate cancellation to provider requests, and return deterministic failures.

The same-tick overlap window remains theoretically possible because React-backed busy state may not propagate before an extremely close second human/agent or agent/agent execution. A bridge-only mutex remains insufficient because it would not cover human/agent overlap. The correct fix must guard the shared action path and be tested for duplicate rejection, cancellation cleanup, provider failure cleanup, and lock release.

### Cart / collection
Current-design cart add, compact cart inspection, removal, collection listing, and collection add-to-cart remain semantically covered with shared data. Collection IDs remain stable and availability is validated before mutation.

The same-revision/same-tick cart mutation window also remains theoretical. Naive idempotency is unsafe because intentional duplicate adds are legitimate existing user behavior.

### Virtual Try-On
The privacy boundary remains correct: the human supplies the photo; WebMCP exposes readiness and execution only against already-supplied photo/cart state. Provider cancellation is propagated and `loadingRef` is synchronously set before the request, so duplicate try-on execution is rejected promptly.

The strongest narrow improvement remains registration stability. `VRTryOn.tsx` still registers both Try-On tools in an effect whose dependency is `[tryOnResult]`. Completing a try-on changes that state, aborts the current registration controller, and re-registers both tools even though only result readiness changed. A live `tryOnResultRef` plus component-lifetime registration would avoid unnecessary registration churn while preserving the same visible and semantic behavior.

That functional change was not shipped because the pre-commit local validation environment is still unavailable. A fresh clean clone attempted this run and failed before mutation with `Could not resolve host: github.com`. Committing a behavior change first and relying on Vercel afterward would violate the rule against committing unvalidated functional work.

### Schemas, annotations, payloads, round trips
The 13-tool surface remains coherent and high leverage. Read tools remain read-only, untrusted-content annotations remain appropriate on prompt/cart/try-on surfaces, responses are compact and structured, errors are deterministic, and `consequentialHint` is not justified for the current reversible/non-financial actions.

No tiny wrapper, DOM-derived interface, or invented capability is justified.

## Tests and verification performed this run
- Read `PROGRESS.md` before editing.
- Verified canonical repository and `webmcp-agent-native` branch.
- Verified production `main` remains `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Verified working branch entered at `eb85acb466f21db4db8216621a30b78ad3f770b3`.
- Compared branch against production: 60 commits ahead, 0 behind, merge base exactly production.
- Verified exact Vercel preview `dpl_3HgBMxjhZCmQkyKKpUHVBiwWWSfK` is `READY` and tied to the correct repository/branch/SHA.
- Verified entering build ran `tsc -b && vite build`, transformed 2020 modules, and completed successfully.
- Reverified the official 2026-09-04 WebMCP draft.
- Re-inspected `VRTryOn.tsx` and confirmed the `[tryOnResult]` registration dependency is still present.
- Retried a fresh clean clone for local validation; it failed before mutation with `Could not resolve host: github.com`.
- No functional source change was made, so no unvalidated functional commit was created.

## Failures found / fixes applied
- No new human-flow regression found.
- No missing high-leverage semantic capability found.
- Strongest remaining candidate: eliminate Virtual Try-On result-driven re-registration with a live result ref and component-lifetime registration.
- Remaining candidate: shared generation/refinement same-tick overlap protection covering both human and agent paths.
- Remaining candidate: focused cart retry/same-tick protection that preserves deliberate duplicate adds.
- Environment limitation: local clean GitHub checkout still fails DNS resolution; actual browser-side `document.modelContext.getTools()` / `executeTool()` execution is also unavailable in the current runtime.

## Remaining opportunities
1. When a build-capable checkout is available, implement and locally validate the Virtual Try-On registration-stability change before committing it.
2. Execute actual `document.modelContext.getTools()` discovery and representative `executeTool()` calls in a WebMCP-capable browser/testing surface when available.
3. Reproduce simultaneous generation/refinement and add the smallest shared guard that covers both human and agent paths, with cancellation/provider-failure cleanup tests.
4. Reproduce same-revision/retried cart mutations and add focused protection without blocking intentional duplicates.
5. Continue focused behavioral coverage for stale revisions, unsupported-browser fallback, route refresh, collection availability, shared cart state, provider failures, and Virtual Try-On errors when a safe harness is available.
6. Keep auditing schemas, descriptions, annotations, payload size, round trips, state recovery, registration churn, and race handling without growing the tool surface unnecessarily.
7. Do not merge to `main` solely because a preview builds successfully.

## README
`README.md` remains concise and accurate. Its WebMCP section continues to describe the semantic tool philosophy, thirteen capabilities, privacy boundary, revision handling, testing approach, and cancellation semantics. Detailed run history remains here.

## Latest commit SHA
Branch head entering this run: `eb85acb466f21db4db8216621a30b78ad3f770b3`.

This file is updated before the audit commit is created, so the resulting commit SHA is intentionally recorded by the next run rather than attempting a self-referential hash.

## Next run
Read this file first. Reverify repository/branch/production isolation and the exact preview/build for the commit produced by this run. Retry a clean checkout. If build-capable access returns, implement and locally validate the Virtual Try-On registration-stability fix before committing it, then confirm its preview. Attempt real standards-style discovery/execution if a WebMCP-capable browser/test harness becomes available. Otherwise continue the fresh source-level audit and do not alter shared concurrency semantics without validation.

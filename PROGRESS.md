# CriShirt WebMCP Progress

## Mission
Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI/UX work.

## Canonical repository and deployment facts
- Repository: `UnknownGod2011/crishirt-perfect-corp`.
- Production branch: `main`.
- Production commit: `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Working branch: `webmcp-agent-native`.
- Branch head entering this audit: `945f4908b936a0a938c246bb7824d5aab6b89cb4`.
- Compare entering this audit: 116 commits ahead of `main`, 0 behind; merge base is exactly production commit `88daa417caa5305f81e5554977a13a94a793cdeb`.
- GitHub combined status on the entering branch head: Vercel `success`.
- Production remains on `main`; this audit did not alter production or deployment configuration.

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

All WebMCP entry points feature-detect `document.modelContext`, preserving the normal human website when WebMCP is unavailable.

## Current safety and ergonomics
- Semantic tools reuse shared application/cart/catalog/provider logic rather than DOM-click or selector wrappers.
- Workspace mutations support revision validation so stale agent calls fail deterministically rather than silently overwrite newer shared state.
- Provider-backed generation/refinement/Try-On propagate execution cancellation into `fetch`.
- Read tools are annotated read-only where appropriate and provider/user-derived outputs are marked untrusted where appropriate.
- Virtual Try-On keeps photo acquisition and raw person/result image data under human UI control.
- Schemas are bounded, compact, and constrained to existing product capabilities.

## Official WebMCP specification check
Reverified on 2026-09-09 against the official Web Machine Learning Community Group Draft Community Group Report dated 2026-09-04.

Current relevant facts:
- `document.modelContext` remains the imperative API surface.
- `registerTool(tool, options)` remains the semantic registration path.
- `getTools()` and `executeTool()` remain the in-page discovery/execution APIs.
- Tool execution and registration lifetime can use `AbortSignal`.
- The specification explicitly warns that rapid unregister/re-register can race with discovery/execution, so unnecessary registration churn should be avoided.

## Fresh full-journey audit — 2026-09-09 13:19 IST

### Repository / production isolation
Verified the canonical repository, default branch `main`, working branch `webmcp-agent-native`, branch head `945f4908b936a0a938c246bb7824d5aab6b89cb4`, and exact production merge base `88daa417caa5305f81e5554977a13a94a793cdeb`. The WebMCP branch is 116 commits ahead / 0 behind. No unrelated repository or production configuration was touched.

### Create / editing / state recovery
The existing workspace state, configuration, placement, generation, and refinement tools remain the right semantic surface. They remove visual interpretation and drag/click round trips while operating on the same application state as the human UI. No selector-level tool is justified.

### Generation / refinement
Current tools continue to route through existing Perfect Corp-backed application paths, validate inputs, return deterministic failures, and propagate cancellation. No new concurrency architecture is justified without a reproduced human/agent race.

### Cart / collection
Current-design add-to-cart, cart inspection/removal, collection listing, and collection add-to-cart cover the existing stable cart/collection journey. Existing duplicate-add semantics should not be changed without a reproduced agent retry problem.

### Navigation / recovery
The constrained navigation tool plus semantic state reads remain preferable to arbitrary URL navigation or DOM-click wrappers.

### Virtual Try-On
Fresh source inspection confirms `src/components/VRTryOn.tsx` still registers both Try-On tools inside an effect whose dependency is `[tryOnResult]`. A successful result or result clearing therefore tears down and recreates otherwise identical tools. This remains the strongest narrow WebMCP improvement because the current specification explicitly documents ambiguity around rapid unregister/re-register cycles.

Preferred fix remains: add a synchronous `tryOnResultRef`, keep it current with state, read the ref from `crishirt_get_tryon_state`, and register the two tools for component lifetime rather than result lifetime.

The change was intentionally not shipped in this audit because the required pre-commit local checkout/build gate remains unavailable. A fresh clone of the canonical branch again failed with `Could not resolve host: github.com`. Connected GitHub access permits exact repository inspection and safe documentation updates, but is not a substitute for compiling and testing a behavioral source mutation before committing it.

### Schemas / payloads / round trips
The 13-tool surface remains coherent. No additional compound tool or mutation was found that clearly reduces legitimate interaction cost enough to justify expanding the surface this run. Existing read tools provide recovery points for workspace, cart, collection, and Try-On state.

### Unsupported browser / human flow
WebMCP remains feature-detected rather than required. No change was made to Perfect Corp generation, editing/placement, Try-On UI, cart, collection, navigation, or the production human experience.

### README maturity
The concise README WebMCP section remains appropriate; no README change was justified this run.

## Tests and verification performed this audit
- Read `PROGRESS.md` before editing.
- Verified repository is exactly `UnknownGod2011/crishirt-perfect-corp` and default branch is `main`.
- Verified current WebMCP branch head is `945f4908b936a0a938c246bb7824d5aab6b89cb4` before this audit commit.
- Compared `main...webmcp-agent-native`: 116 ahead, 0 behind, merge base exactly `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Reverified the official 2026-09-04 WebMCP draft and current `document.modelContext` / `registerTool` / `getTools()` / `executeTool()` model.
- Reinspected `VRTryOn.tsx`; confirmed Try-On tool registration still depends on `[tryOnResult]`, while provider cancellation still flows through `fetch`.
- Checked GitHub combined status for the entering branch head; Vercel reports `success`.
- Attempted a fresh clean clone of `webmcp-agent-native`; it failed with `Could not resolve host: github.com`.
- No functional source mutation was made, so no unbuilt speculative behavior was committed.

## Failures found / fixes applied
- No new human-flow regression found.
- No missing high-leverage semantic capability found.
- Known Virtual Try-On registration-lifecycle inefficiency remains.
- Transient environment limitation remains: local GitHub DNS resolution prevents the required clean build/test checkout.
- Durable audit state was refreshed in this file.

## Remaining opportunities
1. As soon as a build-capable clean checkout is available, implement and locally validate the Virtual Try-On registration-stability fix before committing it.
2. Execute actual `document.modelContext.getTools()` discovery and representative `executeTool()` journeys in a WebMCP-capable browser or official test harness when available.
3. Reproduce simultaneous human/agent generation/refinement before adding any shared concurrency guard.
4. Reproduce retry/duplicate cart behavior before adding mutation idempotency.
5. Continue testing stale revisions, cancellation, provider failures, route changes/refresh, unsupported-browser fallback, collection availability, shared cart state, and Try-On failure paths.
6. Continue fresh per-run audits of tool ergonomics, descriptions, schemas, annotations, payload size, round trips, state recovery, registration churn, race handling, and observability without growing the tool count unnecessarily.
7. Do not merge to `main` solely on the basis of a remote preview build.

## Latest commit SHA
Branch head entering this audit: `945f4908b936a0a938c246bb7824d5aab6b89cb4`.

This file is updated before the audit commit is created, so the resulting audit commit SHA is intentionally recorded by the next run rather than attempting a self-referential hash.

## Next run
Read this file first. Reverify repository/branch/production isolation and exact branch head. If a safe build-capable checkout is available, implement the Virtual Try-On result-ref/component-lifetime registration fix, build/test the full relevant app, and only then commit it. Attempt real WebMCP discovery/execution if a capable browser/test harness becomes available. Otherwise perform another fresh no-op audit and preserve current human behavior.

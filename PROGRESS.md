# CriShirt WebMCP Progress

## Mission
Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI/UX work.

## Canonical repository and deployment facts
- Repository: `UnknownGod2011/crishirt-perfect-corp`
- Production branch: `main`
- Production commit: `88daa417caa5305f81e5554977a13a94a793cdeb`
- Working branch: `webmcp-agent-native`
- Branch head entering this run: `80863088330c5335786ba6c65cb4563095ec8b6d`
- Compare entering this run: 98 commits ahead of `main`, 0 behind; merge base exactly production commit `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Production remains on `main`; the WebMCP branch has not been promoted.
- Vercel project: `crishirtpc` (`prj_jAm749oRS01LbAdwec2lKvKZgAEF`).
- Latest entering branch preview: `dpl_GpakED2bMVPkBrbFEGhXvQK4b7RZ`, state `READY`, for commit `80863088330c5335786ba6c65cb4563095ec8b6d`.
- That preview cloned the canonical repository/branch, ran `npm install`, then `tsc -b && vite build`, transformed 2020 modules, and completed successfully.
- The remote install still reports the pre-existing dependency audit findings (31 total: 3 low, 9 moderate, 18 high, 1 critical). These remain outside the WebMCP-only mission unless a finding is shown to affect this work directly.
- No production deployment configuration, environment variables, auth, database, commerce, Perfect Corp provider behavior, or unrelated UI was changed in this run.

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
- Workspace mutations accept optional `expectedRevision`; stale calls return deterministic `STALE_STATE` rather than silently overwriting newer state.
- Humans and agents reuse the same application/cart/catalog/provider logic rather than DOM-click wrappers.
- Provider-backed callbacks propagate WebMCP execution cancellation into cancellable requests.
- Virtual Try-On keeps camera/file permission and raw person/result image data human-controlled.
- Primary tools are semantic and structured; they do not expose selectors, DOM-click wrappers, arbitrary page interaction, or new product capability.

## Current official WebMCP specification check
Reverified on 2026-09-08 against the official Web Machine Learning Community Group Draft Community Group Report dated 2026-09-04.

Current relevant facts:
- `document.modelContext` remains the imperative API surface.
- `registerTool(tool, options)` remains the semantic registration path.
- `getTools()` and `executeTool()` remain the in-page discovery/execution APIs.
- Tool execution receives an `AbortSignal`; registration lifetime can separately be tied to an `AbortSignal`.
- The draft still explicitly documents ambiguity around rapid unregister/re-register cycles.
- Current CriShirt semantic tools, compact schemas, cancellation, annotations, and privacy-safe structured outputs remain aligned with the draft.

No new spec-driven tool-surface correction is required this run.

## Fresh full-journey audit — 2026-09-08

### Repository / production isolation
Verified the canonical repository, default branch, working branch, exact feature head, production head, divergence, merge base, Vercel project, and latest feature-branch preview before considering any mutation. Production remains untouched.

### Create / edit / state recovery
`crishirt_get_workspace_state` remains the high-leverage recovery primitive for route, garment configuration, design presence/placement, busy state, cart count, valid options, and revision. Configure, placement, generation, refinement, and constrained navigation cover the stable Create journey without selector-level tools.

### Generation / refinement
Generation and refinement continue to use the existing provider routes, reject invalid inputs, return deterministic failures, and propagate execution cancellation. A bridge-only mutex remains unjustified because it would not cover the visible human path and could create divergent concurrency semantics.

### Artwork placement
One bounded semantic placement mutation remains substantially cheaper and more reliable for agents than visual dragging while preserving the same underlying application state. No DOM drag wrapper is justified.

### Cart / collection
Current-design add-to-cart, compact cart inspection, removal, collection listing, and collection add-to-cart remain covered through shared app/catalog state. Intentional duplicate adds are existing human behavior, so naive idempotency would change product semantics and remains unjustified without a reproducible retry bug.

### Navigation / recovery
`crishirt_navigate` remains restricted to existing stable destinations. No generic arbitrary URL or DOM navigation surface is justified.

### Virtual Try-On
The privacy boundary remains correct: a human supplies the photo through the visible UI; the agent can read privacy-safe readiness and execute try-on against an eligible existing cart item. Raw person/result images are not returned through WebMCP.

`VRTryOn.tsx` still registers both Try-On tools inside an effect with dependency `[tryOnResult]`. Successful result changes and result clearing therefore unregister and re-register otherwise identical tools. This remains the strongest narrow source improvement because the current specification explicitly warns that rapid unregister/re-register can race with discovery/execution.

Preferred fix remains: maintain a synchronous `tryOnResultRef`, have `crishirt_get_tryon_state` read that ref, and register both tools for component lifetime rather than result lifetime.

The behavioral fix was intentionally not shipped this run. The connected GitHub/Vercel surfaces can inspect source and completed remote builds, but they still do not provide a safe pre-commit local build/test workspace for a proposed source mutation. A successful preview of the existing commit is not a substitute for validating a new behavioral edit before committing it.

### Schemas, annotations, payloads, round trips, observability
The 13-tool surface remains coherent and high leverage. Read tools are read-only where appropriate; provider/user-derived content is marked untrusted where appropriate; schemas reject unknown fields; outputs remain compact and deterministic. No additional compound tool reduces interaction cost enough to justify broadening the mutation surface this run.

### Unsupported browser / human website
The bridges still feature-detect `document.modelContext` / `registerTool` and return early when unsupported. No change this run touched rendering, Perfect Corp provider paths, editing/placement, cart behavior, navigation, collection UI, or try-on controls.

### README maturity check
`README.md` remains appropriately scoped for the current mature semantic WebMCP surface. No README change is justified this run.

## Tests and verification performed this run
- Read `PROGRESS.md` before editing.
- Verified repository is exactly `UnknownGod2011/crishirt-perfect-corp` and default branch is `main`.
- Verified working branch entered at `80863088330c5335786ba6c65cb4563095ec8b6d`.
- Verified `main` remains `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Compared branch against production: 98 commits ahead, 0 behind, merge base exactly production.
- Reverified the official 2026-09-04 WebMCP draft and current `document.modelContext`, `registerTool`, `getTools()`, `executeTool()`, cancellation, and registration-lifetime semantics.
- Re-read the current Virtual Try-On registration path and confirmed the registration effect still depends on `[tryOnResult]`.
- Verified latest entering feature-branch preview `dpl_GpakED2bMVPkBrbFEGhXvQK4b7RZ` is `READY` for commit `80863088330c5335786ba6c65cb4563095ec8b6d`.
- Verified its build log ran `npm install`, then `tsc -b && vite build`, transformed 2020 modules, and completed successfully.
- No functional source change was made, so no speculative behavior was committed.

## Failures found / fixes applied
- No new human-flow regression found.
- No missing high-leverage semantic capability found.
- Registration-lifecycle inefficiency remains in Virtual Try-On.
- Remaining candidate: shared generation/refinement overlap protection covering both human and agent paths, only if a race can be reproduced safely.
- Remaining candidate: focused cart retry/same-tick protection that preserves intentional duplicate adds, only if a retry race can be reproduced.
- Environment limitation remains: no safe pre-commit build-capable source workspace and no actual WebMCP-capable browser execution surface were available in this run.
- Durable handoff updated with exact repository, deployment, build, specification, audit, blocker, and next-run facts.

## Remaining opportunities
1. When a build-capable checkout is available, implement and locally validate the Virtual Try-On registration-stability change before committing it.
2. Execute actual `document.modelContext.getTools()` discovery and representative `executeTool()` calls in a WebMCP-capable browser/testing surface when available.
3. Reproduce simultaneous generation/refinement and add only the smallest shared guard covering both human and agent paths, with cancellation/provider-failure cleanup tests.
4. Reproduce same-revision/retried cart mutations and add focused protection without blocking intentional duplicates.
5. Continue behavioral coverage for stale revisions, unsupported-browser fallback, route refresh, collection availability, shared cart state, provider failures, and Virtual Try-On errors when a safe harness is available.
6. Keep auditing schemas, descriptions, annotations, payload size, round trips, state recovery, registration churn, race handling, and observability without growing the tool surface unnecessarily.
7. Do not merge to `main` solely because a remote preview builds successfully.

## Latest commit SHA
Branch head entering this run: `80863088330c5335786ba6c65cb4563095ec8b6d`.

This file is updated before the audit commit is created, so the resulting audit commit SHA is intentionally recorded by the next run rather than attempting a self-referential hash.

## Next run
Read this file first. Reverify repository/branch/production isolation and exact branch head. If a safe build-capable checkout is available, implement the Virtual Try-On registration-stability fix with a synchronous result ref and component-lifetime registration, build and test the full app, and only then commit it. Attempt real standards-style discovery/execution if a WebMCP-capable browser/test harness becomes available. Otherwise continue the fresh source-level audit and do not alter shared concurrency semantics without validation.

# CriShirt WebMCP Progress

## Mission
Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI/UX work.

## Canonical repository and deployment facts
- Repository: `UnknownGod2011/crishirt-perfect-corp`.
- Production branch: `main`.
- Production commit: `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Working branch: `webmcp-agent-native`.
- Branch head entering this audit: `63e99d3c76697ebf46fbee9d785106cf46fc52b0`.
- Compare entering this audit: 113 commits ahead of `main`, 0 behind; merge base is exactly production commit `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Production remains on `main`; the WebMCP branch has not been promoted.
- Vercel project: `crishirtpc` (`prj_jAm749oRS01LbAdwec2lKvKZgAEF`).
- Latest entering branch preview: `dpl_58AybBpXmLdQQz8oFDZTKPnF3rNg`, state `READY`, for commit `63e99d3c76697ebf46fbee9d785106cf46fc52b0`.
- That preview cloned the canonical branch, ran `npm install`, then `tsc -b && vite build`, transformed 2020 modules, completed successfully, and deployed.
- No production deployment configuration, environment variables, auth, database, commerce, Perfect Corp provider behavior, or unrelated UI was changed in this audit.

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

All WebMCP entry points feature-detect `document.modelContext`, so browsers without WebMCP retain normal human behavior.

## Shared state, safety, privacy, and ergonomics
- Workspace mutations accept optional `expectedRevision`; stale calls return deterministic `STALE_STATE` instead of silently overwriting newer state.
- Humans and agents reuse the same application/cart/catalog/provider logic rather than DOM-click wrappers.
- Provider-backed generation, refinement, and Virtual Try-On propagate the WebMCP execution `AbortSignal` into `fetch`.
- Virtual Try-On keeps camera/file permission and raw person/result image data human-controlled.
- Primary tools are semantic and structured; they do not expose CSS selectors, arbitrary clicks, arbitrary URLs, or product functionality the site does not already support.
- Compound tools are used where they materially reduce round trips, including generation with optional supported garment configuration.

## Official WebMCP specification check
Reverified on 2026-09-09 against the official Web Machine Learning Community Group Draft Community Group Report dated 2026-09-04.

Current relevant facts:
- `document.modelContext` is the imperative API surface.
- `registerTool(tool, options)` is the semantic registration path.
- `getTools()` and `executeTool()` are the in-page discovery/execution APIs.
- Tool execution accepts an `AbortSignal`; registration lifetime can separately be tied to an `AbortSignal`.
- The draft documents asynchronous tool-change timing and a rapid unregister/re-register ambiguity, so needless registration churn should be avoided.
- CriShirt's semantic tools, compact schemas, cancellation, annotations, and privacy-safe structured outputs remain aligned with the current draft.

## Fresh full-journey audit — 2026-09-09 10:24 IST

### Create / edit / state recovery
`crishirt_get_workspace_state` remains the correct high-leverage recovery primitive for route, garment configuration, front/back design presence and placement, generation/refinement busy state, cart count, valid options, and revision. Configuration, placement, generation, refinement, and constrained navigation cover the existing stable Create journey without selector-level tools.

### Generation / refinement
Generation and refinement still reuse the existing Perfect Corp-backed API routes, validate inputs, reject requests while the shared workspace reports generation/refinement busy, expose deterministic failures, and propagate cancellation to `fetch`. A WebMCP-only mutex remains unjustified because it would not guard the human path and could create divergent semantics.

### Artwork placement
One bounded semantic placement mutation remains substantially cheaper and more reliable for agents than visual dragging while preserving the same shared application state. No DOM drag wrapper is justified.

### Cart / collection
Current-design add-to-cart, compact cart inspection, removal, collection listing, and collection add-to-cart remain covered through shared app/catalog state. Intentional duplicate adds are existing human behavior, so naive idempotency would change product semantics without a reproduced retry bug.

### Navigation / state recovery
`crishirt_navigate` remains intentionally constrained to existing stable surfaces (`create`, `tryon`, `collection`, `cart`). No generic arbitrary-URL or DOM navigation surface is justified.

### Virtual Try-On
The privacy boundary remains correct: the human supplies the photo through the visible UI; the agent can read privacy-safe readiness and execute try-on against an eligible existing cart item. Raw person/result images are not returned through WebMCP.

`VRTryOn.tsx` still registers both Try-On tools inside an effect with dependency `[tryOnResult]`. Successful result changes and result clearing therefore unregister and re-register otherwise identical tools. This remains the strongest narrow source improvement because needless lifecycle churn can race with asynchronous discovery/tool-change behavior described by the current WebMCP draft.

Preferred fix remains: maintain a synchronous `tryOnResultRef`, keep it updated with result state, have `crishirt_get_tryon_state` read that ref, and register both tools for component lifetime rather than result lifetime.

The behavioral fix was intentionally not shipped in this audit. A fresh clean checkout of the canonical `webmcp-agent-native` branch again failed before source retrieval with `Could not resolve host: github.com`. The connected GitHub surface can inspect and mutate exact source and Vercel can verify already-committed branch previews, but neither substitutes for the required pre-commit local build/test gate for a behavioral source mutation.

### Schemas, payloads, annotations, round trips, observability
The 13-tool surface remains coherent and high leverage. Read tools remain read-only where appropriate; user/provider-derived content is marked untrusted where appropriate; schemas reject unknown fields; outputs remain compact and deterministic. No additional compound tool currently reduces interaction cost enough to justify broadening the mutation surface.

### Unsupported browser / human website
The bridges still feature-detect `document.modelContext` / `registerTool` and return early when unsupported. No audit change touched rendering, Perfect Corp provider paths, editing/placement, cart behavior, navigation, collection UI, or try-on controls.

### README maturity
`README.md` remains appropriately scoped for the mature semantic WebMCP surface. No README change is justified in this audit.

## Tests and verification performed in this audit
- Read `PROGRESS.md` before editing.
- Verified repository is exactly `UnknownGod2011/crishirt-perfect-corp` and default branch is `main`.
- Verified working branch head entering the audit was `63e99d3c76697ebf46fbee9d785106cf46fc52b0`.
- Verified `main` remains `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Compared branch against production: 113 commits ahead, 0 behind, merge base exactly production.
- Reverified the official 2026-09-04 WebMCP draft and current `document.modelContext`, `registerTool`, `getTools()`, `executeTool()`, cancellation, and registration-lifetime semantics.
- Re-read the main WebMCP bridge and Virtual Try-On WebMCP registration paths as part of the fresh journey audit.
- Confirmed generation/refinement cancellation, stale-state protection, compact semantic state, bounded placement, constrained navigation, unsupported-browser feature detection, and Try-On privacy boundary remain present.
- Confirmed the Virtual Try-On registration effect still depends on `[tryOnResult]`.
- Attempted a fresh clean checkout of `webmcp-agent-native`; clone failed with `Could not resolve host: github.com`.
- Verified entering preview `dpl_58AybBpXmLdQQz8oFDZTKPnF3rNg` is `READY` for commit `63e99d3c76697ebf46fbee9d785106cf46fc52b0`.
- Verified its build ran `npm install` and `tsc -b && vite build`, transformed 2020 modules, and completed successfully.
- No functional source change was made, so no speculative behavior was committed.

## Failures found / fixes applied
- No new human-flow regression found.
- No missing high-leverage semantic capability found.
- Registration-lifecycle inefficiency remains in Virtual Try-On.
- Environment limitation remains transient: clean local checkout is blocked by DNS; no actual WebMCP-capable browser execution surface was available in this audit.
- Durable handoff refreshed with exact repository, deployment, specification, audit, blocker, and next-run facts.

## Remaining opportunities
1. When a build-capable checkout is available, implement and locally validate the Virtual Try-On registration-stability change before committing it.
2. Execute actual `document.modelContext.getTools()` discovery and representative `executeTool()` calls in a WebMCP-capable browser/testing surface when available.
3. Reproduce simultaneous human/agent generation or refinement and add only the smallest shared guard covering both paths if a real race is observed.
4. Reproduce same-revision/retried cart mutations before adding any idempotency that might block intentional duplicates.
5. Continue coverage for stale revisions, unsupported-browser fallback, route refresh, collection availability, shared cart state, cancellation, provider failures, and Virtual Try-On errors when a safe harness is available.
6. Keep auditing schemas, descriptions, annotations, payload size, round trips, state recovery, registration churn, race handling, and observability without growing the tool surface unnecessarily.
7. Do not merge to `main` solely because a remote preview builds successfully.

## Latest commit SHA
Branch head entering this audit: `63e99d3c76697ebf46fbee9d785106cf46fc52b0`.

This file is updated before the audit commit is created, so the resulting audit commit SHA is intentionally recorded by the next run rather than attempting a self-referential hash.

## Next run
Read this file first. Reverify repository/branch/production isolation and exact branch head. If a safe build-capable checkout is available, implement the Virtual Try-On registration-stability fix with a synchronous result ref and component-lifetime registration, build and test the full app, and only then commit it. Attempt real standards-style discovery/execution if a WebMCP-capable browser/test harness becomes available. Otherwise continue the fresh source-level audit and do not alter shared concurrency semantics without validation.

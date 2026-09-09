# CriShirt WebMCP Progress

## Mission
Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI/UX work.

## Canonical repository and deployment facts
- Repository: `UnknownGod2011/crishirt-perfect-corp`.
- Production branch: `main`.
- Production commit: `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Working branch: `webmcp-agent-native`.
- Branch head entering this audit: `16ee6fce1a452a482ca74fc75363cc61b4a1bc17`.
- Compare entering this audit: 129 commits ahead of `main`, 0 behind; merge base is exactly production commit `88daa417caa5305f81e5554977a13a94a793cdeb`.
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
- Workspace mutations support revision validation so stale agent calls fail deterministically instead of silently overwriting newer shared state.
- Provider-backed generation/refinement/Try-On propagate execution cancellation into `fetch`.
- Read tools are annotated read-only where appropriate and provider/user-derived outputs are marked untrusted where appropriate.
- Virtual Try-On keeps photo acquisition and raw person/result image data under human UI control.
- Schemas are bounded, compact, and constrained to existing product capabilities.

## Official WebMCP specification check
Reverified on 2026-09-10 against the official Web Machine Learning Community Group Draft Community Group Report dated 2026-09-04.

Current relevant facts remain:
- `document.modelContext` is the imperative API surface.
- `registerTool(tool, options)` is the semantic registration path.
- `getTools()` and `executeTool()` are the in-page discovery/execution APIs.
- Tool execution and registration lifetime can use `AbortSignal`.
- The specification explicitly illustrates ambiguity around rapidly aborting and re-registering a same-name tool, so unnecessary registration churn should be avoided.
- The official test suite remains available via WPT at `wpt.fyi/results/webmcp`.

## Fresh full-journey audit — 2026-09-10 02:20 IST

### Repository / production isolation
Verified the canonical repository, default branch `main`, working branch `webmcp-agent-native`, entering branch head `16ee6fce1a452a482ca74fc75363cc61b4a1bc17`, and exact production merge base `88daa417caa5305f81e5554977a13a94a793cdeb`. The WebMCP branch is 129 commits ahead / 0 behind. No unrelated repository or production configuration was touched.

The WebMCP-relevant changed surface relative to production remains limited to `PROGRESS.md`, the concise README WebMCP section, `src/App.tsx`, `src/components/WebMCPBridge.tsx`, `src/components/CollectionWebMCPBridge.tsx`, `src/components/VRTryOn.tsx`, `src/config/collectionCatalog.ts`, and `src/pages/collection.tsx`.

### Create / editing / state recovery
The workspace read/configure/placement/generation/refinement tools remain the right high-leverage semantic surface. They eliminate visual interpretation, selector clicking, and drag/resize estimation while operating on the same state as the human UI. `crishirt_generate_design` already combines optional garment configuration with generation, reducing round trips without inventing product behavior. No extra micro-tool or DOM wrapper is justified.

### Generation / refinement
Current tools continue to use existing Perfect Corp-backed application paths with bounded inputs, deterministic error objects, busy-state checks, revision protection where relevant, and AbortSignal propagation. No broader concurrency architecture change is justified without a reproduced race.

### Cart / collection
Current-design add-to-cart, cart inspection/removal, collection listing, and collection add-to-cart cover the stable cart/collection journey. Shared catalog/cart construction avoids human-agent drift. No idempotency layer is justified without a reproduced duplicate-action failure.

### Navigation / recovery
The constrained semantic navigation tool plus state reads remain preferable to arbitrary URL navigation or DOM-click primitives. No route expansion is justified beyond routes already supported by the human site.

### Virtual Try-On
Fresh source inspection confirms `src/components/VRTryOn.tsx` still registers both Try-On tools inside a `useEffect` whose dependency is `[tryOnResult]`. Successful result creation or clearing therefore aborts and recreates otherwise identical registrations.

This remains the strongest narrow improvement because the current WebMCP draft explicitly shows that rapid same-name unregister/re-register behavior can race with tool discovery/execution.

Preferred fix remains deliberately small: add a synchronous `tryOnResultRef`, keep it current with state, read that ref inside `crishirt_get_tryon_state`, and register both Try-On tools for component lifetime instead of result lifetime.

The fix was intentionally not shipped this audit because the required clean checkout/build gate is still unavailable. A fresh clone of the canonical `webmcp-agent-native` branch again failed with `Could not resolve host: github.com`. Connected GitHub inspection is sufficient for exact source auditing and documentation handoff, but not a substitute for compiling/testing behavioral code before committing it.

### Schemas / payloads / round trips
The 13-tool surface remains coherent and sufficiently compound. Current schemas constrain apparel, side, placement, prompt size, color, and optional revision tokens. No new semantic capability was found that clearly reduces legitimate interaction cost enough to justify growing the tool count this run.

### Unsupported browser / human flow
All bridges remain feature-detected. No change was made to Perfect Corp generation, editing/placement, Try-On UI, cart, collection, navigation, or deployed human behavior.

### README maturity
The concise README WebMCP section remains accurate and appropriately scoped; no README change is justified this run.

## Tests and verification performed this audit
- Read `PROGRESS.md` before editing.
- Verified repository is exactly `UnknownGod2011/crishirt-perfect-corp` and default branch is `main`.
- Verified entering WebMCP branch head is `16ee6fce1a452a482ca74fc75363cc61b4a1bc17`.
- Compared production commit `88daa417caa5305f81e5554977a13a94a793cdeb` to the branch head: 129 ahead, 0 behind, merge base exactly production.
- Checked GitHub combined status for the entering branch head; Vercel reports `success`.
- Reverified the official 2026-09-04 WebMCP report and WPT link.
- Reinspected `src/components/WebMCPBridge.tsx`, `src/components/CollectionWebMCPBridge.tsx`, `src/components/VRTryOn.tsx`, and the README WebMCP section.
- Confirmed Try-On registration still depends on `[tryOnResult]`, while provider cancellation still flows through the tool signal into `fetch`.
- Attempted a fresh clean clone of `webmcp-agent-native`; it again failed with `Could not resolve host: github.com`.
- No functional source mutation was made, so no unbuilt speculative behavior was committed.

## Failures found / fixes applied
- No new human-flow regression found.
- No missing high-leverage semantic capability found.
- Known Virtual Try-On registration-lifecycle inefficiency remains.
- Transient environment limitation remains: local GitHub DNS resolution prevents the required clean build/test checkout.
- Durable audit state was refreshed in this file only.

## Remaining opportunities
1. As soon as a build-capable clean checkout is available, implement and locally validate the Virtual Try-On result-ref/component-lifetime registration fix before committing it.
2. Execute actual `document.modelContext.getTools()` discovery and representative `executeTool()` journeys in a WebMCP-capable browser or official test harness when available.
3. Use the official Web Platform Tests suite as an additional compatibility signal when a capable browser environment is available.
4. Reproduce simultaneous human/agent generation/refinement before adding any shared concurrency guard.
5. Reproduce retry/duplicate cart behavior before adding mutation idempotency.
6. Continue testing stale revisions, cancellation, provider failures, route changes/refresh, unsupported-browser fallback, collection availability, shared cart state, and Try-On failure paths.
7. Continue fresh per-run audits of schemas, annotations, payload size, round trips, state recovery, registration churn, race handling, and observability without growing the tool count unnecessarily.
8. Do not merge to `main` solely on the basis of a remote preview build.

## Latest commit SHA
Branch head entering this audit: `16ee6fce1a452a482ca74fc75363cc61b4a1bc17`.

This file is updated before the audit commit is created, so the resulting audit commit SHA is intentionally recorded by the next run rather than attempting a self-referential hash.

## Next run
Read this file first. Reverify repository/branch/production isolation and exact branch head. If a safe build-capable checkout is available, implement the Virtual Try-On result-ref/component-lifetime registration fix, build/test the full relevant app, and only then commit it. Attempt real WebMCP discovery/execution or WPT-backed verification if a capable browser/test harness becomes available. Otherwise perform another fresh no-op audit and preserve current human behavior.

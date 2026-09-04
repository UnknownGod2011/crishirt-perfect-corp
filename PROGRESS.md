# CriShirt WebMCP Progress

## Mission
Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools.

## Canonical repository

Repository: `UnknownGod2011/crishirt-perfect-corp`

Default branch: `main`

Baseline commit audited: `88daa417caa5305f81e5554977a13a94a793cdeb`

Working integration branch: `webmcp-agent-native`

Production deployment configuration has not been changed by this work.

## Existing application facts

The app is a React + TypeScript + Vite frontend with a shared `AppContext` that owns front/back designs, placement, garment configuration and cart state.

Perfect Corp-backed generation and refinement are already working through the existing backend routes used by `ControlPanel`.

The human UI already supports garment selection, color, material, size, front/back design state, drag/resize/rotation, generation, refinement, virtual try-on navigation, collection and cart.

WebMCP is therefore being added as a thin semantic adapter over the existing state/actions and backend APIs, not as a redesign.

## WebMCP implementation in this run

Added `src/components/WebMCPBridge.tsx` using the current `document.modelContext.registerTool` imperative API.

The bridge feature-detects WebMCP and returns `null`, so unsupported browsers keep the existing human experience unchanged.

Tool registration is lifecycle-scoped with an `AbortController`, so tools are unregistered when the React bridge unmounts.

Long Perfect Corp generation/refinement fetches forward the WebMCP execution `AbortSignal`.

Implemented tools:

1. `crishirt_get_workspace_state`
   Read-only compact snapshot of garment configuration, valid options, front/back design presence and placement, busy state, cart count, route and revision token.

2. `crishirt_configure_workspace`
   Compound semantic mutation for apparel type, color, material, size and active front/back side with validation.

3. `crishirt_set_design_placement`
   Semantic move/resize/rotate action using existing CriShirt alignment state rather than DOM dragging.

4. `crishirt_generate_design`
   Cancellable Perfect Corp-backed generation. Can configure garment attributes and side in the same call to reduce agent round trips.

5. `crishirt_refine_design`
   Cancellable refinement using the existing current workspace image without requiring the agent to copy image URLs.

6. `crishirt_add_current_design_to_cart`
   Adds the current existing design/product state to the same cart data model used by the human app. Cart rendering already has an alignment-aware fallback when canvas snapshots are absent.

7. `crishirt_get_cart`
   Read-only compact cart summary.

8. `crishirt_remove_cart_item`
   Removes an existing cart item by stable cart item id.

9. `crishirt_navigate`
   Direct semantic navigation among the existing Create, VR Try-On, Collection and Cart surfaces.

## Agent efficiency gains

A normal agent no longer needs to visually locate selectors, inspect front/back controls, drag artwork, find generation/refinement buttons, parse cart cards or search navigation links for these flows.

The generation tool can combine garment configuration plus generation into one call, reducing round trips for common requests such as "make me a black oversized tee with a motorsport graphic".

Read tools return compact structured state instead of image-heavy DOM observations.

Mutation tools accept an optional `expectedRevision` from the workspace state and return `STALE_STATE` if the React state has changed before the mutation executes.

## Safety and compatibility

No Shopify, login, Supabase, SerpApi or unrelated product expansion was added.

No production deployment configuration was changed.

No existing Perfect Corp routes were removed or altered.

WebMCP absence is a no-op for the human website.

Tool inputs are allow-listed with JSON Schemas and deterministic validation errors.

Generated/user prompt content is marked with `untrustedContentHint` on read/generation surfaces where it can appear in tool output.

## Validation performed

Repository identity and main branch were verified through GitHub before editing.

Current official WebMCP specification and Chrome documentation were rechecked on 2026-09-04. The implementation uses `document.modelContext`, `registerTool`, JSON Schema, `readOnlyHint`, `untrustedContentHint`, registration AbortSignal and execution AbortSignal as currently specified.

Source-level compatibility was checked against the actual current `AppContext`, `ControlPanel`, apparel catalog and cart rendering code.

A local package build could not be executed in this automation environment during this run, so the integration is intentionally isolated on `webmcp-agent-native` rather than merged into `main` yet. Production remains unchanged until a build/preview verification succeeds.

## Remaining opportunities

Run a real branch build/preview and inspect registered WebMCP tools in a compatible browser.

Exercise realistic agent journeys end-to-end and verify visible UI state changes.

Check whether virtual try-on itself exposes a safe existing action that can be wrapped semantically without duplicating its current page logic.

Evaluate whether collection item selection/add-to-cart should have a WebMCP tool.

Evaluate cart snapshot parity for agent-added custom designs; current cart fallback is alignment-aware, but the human Add to Cart path also creates canvas snapshots.

Re-audit schemas and descriptions after real browser execution for unnecessary round trips or ambiguous fields.

Once the branch is proven stable, merge only the tested WebMCP commit and update README with concise final WebMCP documentation.

## Next run

1. Verify the branch commit and any available CI or preview deployment.
2. Inspect actual tool registration if a WebMCP-capable browser/preview is available.
3. Fix only concrete integration issues found by testing.
4. Audit virtual try-on and collection journeys for one or two additional high-leverage semantic tools.
5. Update this file with exact results and latest commit SHA.

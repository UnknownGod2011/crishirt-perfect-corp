# CriShirt WebMCP Progress

## Mission
Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools.

## Canonical repository

Repository: `UnknownGod2011/crishirt-perfect-corp`

Default branch: `main`

Production baseline commit audited: `88daa417caa5305f81e5554977a13a94a793cdeb`

Working integration branch: `webmcp-agent-native`

Initial functional WebMCP commit: `5913bb9e72703621c2627112d7bf520e7385c5dd`

Preview-validation documentation commit: `cba7eccf2ef8987b74d1d79b6ebc3f3f0ff8e1eb`

README WebMCP documentation commit: `9a764e36358fa6f8ebc9d02e9d045f493dbcfc13`

Production deployment configuration has not been changed by this work.

## Existing application facts

The app is a React + TypeScript + Vite frontend with a shared `AppContext` that owns front/back designs, placement, garment configuration and cart state.

Perfect Corp-backed generation and refinement are already working through the existing backend routes used by `ControlPanel`.

The human UI already supports garment selection, color, material, size, front/back design state, drag/resize/rotation, generation, refinement, virtual try-on navigation, collection and cart.

WebMCP is therefore being added as a thin semantic adapter over the existing state/actions and backend APIs, not as a redesign.

## WebMCP implementation

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

The generation tool can combine garment configuration plus generation into one call, reducing round trips for common requests such as “make me a black oversized tee with a motorsport graphic”.

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

Repository identity and branch state were verified through GitHub before each pass.

The Vercel project `crishirtpc` is confirmed connected to `UnknownGod2011/crishirt-perfect-corp`.

The production deployment is still on `main` commit `88daa417caa5305f81e5554977a13a94a793cdeb` and remains untouched.

Separate preview deployments for `webmcp-agent-native` are `READY`. The functional WebMCP commit `5913bb9e72703621c2627112d7bf520e7385c5dd` and the preview-validation commit `cba7eccf2ef8987b74d1d79b6ebc3f3f0ff8e1eb` both built successfully on Vercel.

Current official WebMCP specification was rechecked on 2026-09-04. The implementation matches the current `Document.modelContext` API, `registerTool`, JSON Schema input descriptions, `readOnlyHint`, `untrustedContentHint`, registration `AbortSignal`, and execution `AbortSignal` model.

Source-level compatibility was checked against the actual current `AppContext`, `ControlPanel`, apparel catalog, cart rendering code, Collection page and AR Try-On page.

Actual in-browser `document.modelContext.getTools()` execution has not been observed in this automation environment because the available deployment fetch path is HTTP-level rather than a WebMCP-capable interactive browser context. This remains explicitly unclaimed rather than being treated as passed.

## Second-pass journey audit

The full existing user journey was re-read after the first WebMCP implementation.

### Create workspace
Coverage is strong. The agent can read state, configure several garment properties in one call, generate/refine, place artwork precisely, and coordinate against human edits through `expectedRevision`.

### Cart
Coverage is strong for the current custom-design cart model. Agents can add the current design, inspect cart contents semantically, and remove specific items by stable id.

### Navigation
Coverage is sufficient. Agents can move directly to Create, Try-On, Collection and Cart without visually searching navigation.

### Exclusive Collection
The human Collection page currently has four available fixed products and visual add-to-cart buttons. A future improvement could expose a read-only collection catalog plus semantic add-to-cart action. This was deliberately not rushed into the final pass because the product catalog is currently local page data rather than a shared domain module; duplicating it inside the WebMCP bridge would create drift. The safer future change is to extract that catalog/cart-item construction into a shared module used by both the human page and the agent adapter.

### AR Try-On
The current AR page relies on local browser camera permission and direct `getUserMedia` interaction. Agent navigation to the page is exposed, but starting the camera or downloading snapshots was deliberately not wrapped as an autonomous WebMCP action. Camera permission remains a user/browser-controlled boundary. This avoids turning a human permission-sensitive capability into an opaque agent action.

### Remaining efficiency opportunities

1. Extract Collection catalog/cart-item creation into shared domain code, then add `crishirt_list_collection` and `crishirt_add_collection_item_to_cart` without duplicating page constants.
2. Add a small shared “prepare current design for try-on” action if the human generation path and AR page can share it safely; do not automate camera permission.
3. Inspect the nine registered tools in a WebMCP-capable browser with `document.modelContext.getTools()` and execute representative calls while observing live UI state.
4. Add focused automated tests around tool registration, schema shape, stale revision handling, cancellation and unsupported-browser no-op behavior if the repository gets a WebMCP test harness.
5. Revisit placement coordinates only if a later architecture change exposes a normalized design surface; do not rewrite the stable mockup solely for this.

## README / submission documentation

`README.md` now contains a concise WebMCP section describing:

- the agent-native philosophy
- all nine current tools
- shared-state behavior
- revision safety
- cancellation behavior
- annotations
- realistic example prompts
- how to inspect/test the registered tools
- branch isolation from production

Detailed progress remains here rather than turning the README into an internal log.

## Current handoff

The branch is production-isolated, Vercel-build-validated, and materially more agent-accessible without changing the external human product surface.

Do not merge merely because the preview builds. Before promotion to `main`, perform one WebMCP-capable interactive browser run that confirms the nine tools are actually discoverable and that representative generation, placement, cart, and navigation calls visibly affect the same UI state.

Latest durable documentation commit before this file update: `9a764e36358fa6f8ebc9d02e9d045f493dbcfc13`.

If future work continues, read this file first, verify the canonical repository/branch, and prioritize runtime verification before adding more tools.

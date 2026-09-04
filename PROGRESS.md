# CriShirt WebMCP Progress

## Mission

Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI work.

## Canonical repository and isolation

Repository: `UnknownGod2011/crishirt-perfect-corp`

Production branch: `main`

Production baseline commit: `88daa417caa5305f81e5554977a13a94a793cdeb`

Working branch: `webmcp-agent-native`

Branch head before this progress update: `5cd09e18693ffcf35a72025a2132775e4eccd8af`

Fresh comparison on 2026-09-05: feature branch is 7 commits ahead and 0 behind `main`; merge base remains exactly the production baseline. Production configuration has not been changed or promoted by this work.

## Current WebMCP surface

The feature branch exposes eleven semantic tools.

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

Both bridges feature-detect `document.modelContext`; unsupported browsers continue through the existing human UI with no dependency on WebMCP.

## Shared-state and safety behavior

Workspace mutations can accept `expectedRevision`; stale mutations return deterministic `STALE_STATE` rather than silently overwriting newer human state.

Perfect Corp generation and refinement forward the WebMCP execution `AbortSignal` to their fetch requests.

Exclusive Collection products are defined once in `src/config/collectionCatalog.ts`; the human Collection page and WebMCP bridge use the same catalog and cart-item creation logic.

No primary WebMCP operation depends on CSS selectors, screen coordinates, or DOM clicking.

## Current-spec verification

The official WebMCP draft was rechecked on 2026-09-05. The implementation still matches the current imperative model using `document.modelContext.registerTool`, JSON Schema input schemas, tool annotations including `readOnlyHint` and `untrustedContentHint`, registration lifetime cancellation through `AbortSignal`, and execution cancellation through `AbortSignal`.

Actual interactive `document.modelContext.getTools()` and `executeTool()` validation in a WebMCP-capable browser is still not available from this automation environment and remains explicitly unclaimed.

## Latest full journey audit

### Create workspace

Strong coverage. An agent can read garment/design/cart state in one call, configure multiple garment properties semantically, generate/refine through the existing Perfect Corp routes, position artwork precisely without visual dragging, and add the result to the existing cart.

The existing generation tool already combines optional garment configuration with generation. A larger generation-plus-placement-plus-cart compound action is still intentionally rejected because it would hide multiple distinct side effects and make partial-failure recovery worse for only a small round-trip saving.

### Cart

Strong coverage. Agents can inspect the current custom-design cart and remove stable item IDs. Collection cart additions use the same human cart model.

### Exclusive Collection

Strong coverage. Agents can inspect the full static collection without visually scanning cards and can add an available product directly by stable ID.

### Navigation

Strong coverage. Agents can directly navigate to Create, Virtual Try-On, Collection, and Cart without link discovery.

### Virtual Try-On audit — new finding

`src/components/VRTryOn.tsx` was inspected in full during this run.

The current human flow has three separable steps:

1. the human supplies a torso/full-body photo by file chooser or camera permission;
2. the user selects a cart design;
3. the existing Perfect Corp Clothes Try-On request runs using the selected cart garment plus the human photo.

Camera capture and file upload should remain human/browser-controlled. They are permission-sensitive and/or carry large private image data, so this automation will not wrap those actions in an opaque autonomous WebMCP tool.

However, there is a legitimate remaining agent-friction opportunity after the human has already supplied the photo: cart-design selection and the subsequent Perfect Corp try-on execution are currently only available through visual UI controls. A future safe implementation may expose a small try-on-specific bridge that can:

- read whether a human photo is already present, which cart item is selected, whether the try-on is running, and whether a result exists;
- select a specific existing cart design by stable cart item ID;
- invoke the existing `generateVirtualTryOn` logic only when a human-supplied photo and valid cart design are already present;
- forward `AbortSignal` to the Perfect Corp request;
- never accept raw person-image data through WebMCP and never request camera/file permissions autonomously.

This would create a clean human-agent handoff: human supplies private photo; agent handles semantic product selection and existing Perfect Corp operation. It would meaningfully reduce visual inspection/click cost while preserving the permission boundary.

No implementation was shipped this run because `VRTryOn` currently keeps photo, selected-design, loading, and result state locally. Adding WebMCP safely requires a small shared-function/refactor so the human button and agent tool invoke the exact same logic. A hurried duplicate implementation would violate the shared-business-logic requirement and risk divergence. The next code change should only proceed if this shared refactor can be made and validated cleanly.

## Validation status

Existing feature-branch Vercel previews for prior functional WebMCP commits reached `READY` and successfully built the React/TypeScript application.

Production remains on `main` and has not been changed.

Interactive WebMCP runtime execution remains the strongest outstanding promotion gate.

## Remaining opportunities

1. Prioritize actual WebMCP runtime discovery and representative execution in a compatible browser if available.
2. Implement the safe Virtual Try-On human-agent handoff only through shared existing `VRTryOn` logic, with no camera/file automation and no raw photo payloads in WebMCP.
3. Re-test stale revisions, cancellation, provider failure handling, unsupported-browser no-op behavior, collection availability validation, and shared cart behavior once runtime execution is available.
4. Continue auditing tool descriptions, deterministic errors, payload size, and unnecessary agent round trips without increasing tool count for its own sake.
5. Do not merge to `main` solely because preview builds pass; runtime WebMCP-capable browser validation remains the strongest promotion gate.

## README

`README.md` already documents the eleven-tool WebMCP surface, agent-use philosophy, revision and cancellation behavior, collection flow, shared collection catalog design, and representative test prompts. Detailed evolving handoff state remains in this file.

## Next run

Read this file first. Reverify repository identity, branch head, `main` isolation, and current official WebMCP behavior. Attempt runtime verification first. If runtime verification is still unavailable, revisit the Virtual Try-On shared-logic opportunity and only implement it if the human and agent paths can share exactly the same state transitions and Perfect Corp request without automating camera/file permission or duplicating business logic. Otherwise perform a fresh full journey audit and record a verified no-op rather than shipping speculative code.

# CriShirt WebMCP Progress

## Mission

Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI work.

## Canonical repository and isolation

Repository: `UnknownGod2011/crishirt-perfect-corp`

Production branch: `main`

Production baseline commit: `88daa417caa5305f81e5554977a13a94a793cdeb`

Working branch: `webmcp-agent-native`

Fresh comparison on 2026-09-05: the feature branch is 8 commits ahead and 0 behind `main`. The merge base remains exactly the production baseline. Production configuration has not been changed or promoted by this work.

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

The implementation remains aligned with the imperative WebMCP model already used by the branch: `document.modelContext.registerTool`, JSON Schema inputs, tool annotations including `readOnlyHint` and `untrustedContentHint`, registration lifetime cancellation, and execution cancellation through `AbortSignal`.

Actual interactive `document.modelContext.getTools()` and representative `executeTool()` validation in a WebMCP-capable browser is still unavailable from this automation environment and remains explicitly unclaimed.

## Fresh full journey audit

### Create workspace

Strong coverage. An agent can read garment/design/cart state in one compact call, configure multiple garment properties semantically, generate/refine through the existing Perfect Corp routes, position artwork precisely without visual dragging, and add the result to the existing cart.

A larger generation-plus-placement-plus-cart compound action remains intentionally rejected. It would save only a small number of round trips while hiding several distinct side effects and making partial-failure recovery worse.

### Cart

Strong coverage. Agents can inspect the current custom-design cart and remove stable item IDs. Collection cart additions use the same human cart model.

### Exclusive Collection

Strong coverage. Agents can inspect the static collection without visually scanning cards and can add an available product directly by stable ID. The human page and agent path share the same catalog and cart-item builder.

### Navigation

Strong coverage. Agents can directly navigate to Create, Virtual Try-On, Collection, and Cart without link discovery.

### Virtual Try-On

This remains the only clear high-value uncovered journey.

`src/components/VRTryOn.tsx` currently keeps `userPhoto`, selected cart item, loading state, result, and error state locally. Its existing human flow is:

1. human supplies a torso/full-body photo by upload or camera permission;
2. human selects a cart design;
3. existing Perfect Corp Clothes Try-On request runs using the human photo and selected cart garment.

The privacy/permission boundary is correct and must remain intact. WebMCP should never request camera/file permission autonomously and should never accept or return the raw person-image payload.

A future safe implementation can expose only the post-consent handoff:

- read whether a human photo is present without exposing its content;
- list/select eligible cart items by stable ID;
- read try-on busy/result readiness state without returning the private photo;
- invoke the same existing Perfect Corp Clothes Try-On action only after a human photo already exists;
- forward the tool execution `AbortSignal` into the Perfect Corp fetch;
- return deterministic errors such as `PHOTO_REQUIRED`, `CART_ITEM_NOT_FOUND`, `TRYON_ALREADY_RUNNING`, and provider failures.

No code was shipped for this path in this audit because the state and request logic are still local to `VRTryOn`. A second, separate bridge that duplicates that request would violate the shared-business-logic requirement and can drift from the human button. The safe implementation requires a small refactor inside the existing component or a shared hook/action so human and agent invoke the exact same state transition and request.

### AR camera and photo acquisition

Intentionally not agentized. Camera capture uses `navigator.mediaDevices.getUserMedia` and photo upload uses browser file selection. These are permission-sensitive human actions and do not become better simply by wrapping them in an autonomous agent tool.

## Agent interaction cost review

Current high-value design journey:

Human-style agent automation would require page interpretation, control discovery, several clicks, visual drag/resize operations, cart discovery, and repeated state re-reading.

Current WebMCP path reduces that to compact semantic reads and mutations with explicit state and stable IDs.

The remaining material friction is Virtual Try-On after the human supplies a photo. Everything before photo acquisition is already appropriately human-controlled; everything after photo acquisition can eventually become semantic without weakening privacy.

No other new tool is justified merely to increase tool count.

## Validation status

Existing feature-branch Vercel previews for prior functional WebMCP commits reached `READY` and successfully built the React/TypeScript application.

Production remains on `main` and has not been changed.

Interactive WebMCP runtime execution remains the strongest outstanding promotion gate.

The project currently has no dedicated automated WebMCP test harness in `package.json`; the build command is `tsc -b && vite build`. Adding a large test framework solely for this branch is not justified while production stability is the priority, but a minimal tool-registration/runtime test would be valuable if the environment can execute the WebMCP API.

## Remaining opportunities

1. Prioritize real WebMCP runtime discovery and representative tool execution in a compatible browser if available.
2. Implement the safe Virtual Try-On post-photo handoff only through shared existing `VRTryOn` logic.
3. Do not automate camera permission, file selection, or raw person-image transfer through WebMCP.
4. Re-test stale revisions, cancellation, provider failure handling, unsupported-browser no-op behavior, collection availability validation, and shared cart behavior once runtime execution is available.
5. Continue auditing descriptions, deterministic errors, response payload size, side-effect boundaries, and unnecessary agent round trips.
6. Do not merge to `main` solely because preview builds pass; runtime WebMCP-capable browser validation remains the strongest promotion gate.

## README

`README.md` documents the eleven-tool WebMCP surface, agent-use philosophy, revision/cancellation behavior, collection flow, shared collection catalog design, and representative test prompts. Detailed evolving handoff state remains in this file.

## Next run

Read this file first. Reverify repository identity, branch head, `main` isolation, and current WebMCP behavior. Attempt runtime verification first if a compatible browser/testing surface becomes available. Otherwise revisit the Virtual Try-On shared-logic refactor and ship it only if the human button and agent tool can invoke exactly the same request/state transitions with no autonomous camera/file access and no raw person-photo exposure. If that cannot be validated safely, perform a fresh journey audit and record a verified no-op rather than shipping speculative code.

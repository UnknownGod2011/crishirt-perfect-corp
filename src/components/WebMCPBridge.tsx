import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { APPAREL_OPTIONS, getApparelConfig } from '../config/apparel';
import { useAppContext, type CartItem, type DesignAlignment } from '../store/AppContext';

type ToolInput = Record<string, unknown>;
type ToolExecutionOptions = { signal: AbortSignal };
type WebMCPTool = {
  name: string;
  title?: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
  execute: (input: ToolInput, options: ToolExecutionOptions) => Promise<unknown> | unknown;
};
type ModelContextLike = {
  registerTool: (tool: WebMCPTool, options?: { signal?: AbortSignal }) => Promise<void>;
};

type Side = 'front' | 'back';

const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
const API_BASE = `${import.meta.env.VITE_API_URL || (isLocalHost ? 'http://localhost:5000' : '')}/api`;
const ROUTES = ['/', '/ar-tryon', '/collection', '/cart'] as const;

const asString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const asFiniteNumber = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : undefined);
const asSide = (value: unknown): Side | undefined => (value === 'front' || value === 'back' ? value : undefined);
const isHexColor = (value: string) => /^#[0-9a-f]{6}$/i.test(value);

const success = (data: Record<string, unknown>) => ({ success: true, ...data });
const failure = (errorCode: string, message: string, details?: Record<string, unknown>) => ({
  success: false,
  errorCode,
  message,
  ...(details || {}),
});

async function readJson(response: Response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.error?.message || data?.message || `HTTP ${response.status}`;
    throw new Error(message);
  }
  if (!data?.success) throw new Error(data?.error?.message || 'API request failed');
  return data;
}

export default function WebMCPBridge() {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const stateRef = useRef(state);
  const revisionRef = useRef(1);
  const navigateRef = useRef(navigate);

  useEffect(() => {
    stateRef.current = state;
    revisionRef.current += 1;
  }, [state]);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    const modelContext = (document as Document & { modelContext?: ModelContextLike }).modelContext;
    if (!modelContext?.registerTool) return;

    const registrationController = new AbortController();
    const register = (tool: WebMCPTool) => {
      void modelContext.registerTool(tool, { signal: registrationController.signal }).catch((error) => {
        console.warn(`[WebMCP] Failed to register ${tool.name}`, error);
      });
    };

    const checkExpectedRevision = (input: ToolInput) => {
      const expected = asFiniteNumber(input.expectedRevision);
      const current = revisionRef.current;
      if (expected !== undefined && expected !== current) {
        return failure('STALE_STATE', `Workspace changed since revision ${expected}. Read current state before modifying it.`, {
          currentRevision: current,
        });
      }
      return null;
    };

    register({
      name: 'crishirt_get_workspace_state',
      title: 'Read CriShirt workspace',
      description: 'Read the current CriShirt creation workspace in one compact call, including garment configuration, front/back design presence and placement, busy state, cart count, valid product options, and a revision token for safe follow-up mutations.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async () => {
        const s = stateRef.current;
        const apparel = getApparelConfig(s.apparelType);
        return success({
          revision: revisionRef.current,
          route: window.location.pathname,
          busy: { generating: s.isGenerating, refining: s.isRefining, progress: s.generationProgress || null },
          product: {
            apparelType: s.apparelType,
            apparelName: apparel.label,
            color: s.tshirtColor,
            material: s.material,
            size: s.size,
            currentSide: s.currentSide,
            validMaterials: apparel.materials,
            validSizes: apparel.sizes,
            availableApparel: APPAREL_OPTIONS.map((item) => ({ id: item.id, label: item.label })),
          },
          designs: {
            front: {
              hasImage: Boolean(s.frontDesign.currentImage),
              prompt: s.frontDesign.lastPrompt || null,
              refinementPrompt: s.frontDesign.lastRefinementPrompt || null,
              alignment: s.frontDesignAlignment,
            },
            back: {
              hasImage: Boolean(s.backDesign.currentImage),
              prompt: s.backDesign.lastPrompt || null,
              refinementPrompt: s.backDesign.lastRefinementPrompt || null,
              alignment: s.backDesignAlignment,
            },
          },
          cart: { itemCount: s.cartItems.length },
        });
      },
    });

    register({
      name: 'crishirt_configure_workspace',
      title: 'Configure garment workspace',
      description: 'Change one or more existing CriShirt workspace settings semantically: garment type, garment color, material, size, or front/back side. This replaces multiple visual selector interactions. Pass expectedRevision from crishirt_get_workspace_state when coordinating with concurrent human edits.',
      inputSchema: {
        type: 'object',
        properties: {
          expectedRevision: { type: 'number', description: 'Optional revision returned by crishirt_get_workspace_state.' },
          apparelType: { type: 'string', enum: APPAREL_OPTIONS.map((item) => item.id) },
          color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$', description: 'Six-digit CSS hex garment color.' },
          material: { type: 'string' },
          size: { type: 'string' },
          side: { type: 'string', enum: ['front', 'back'] },
        },
        additionalProperties: false,
      },
      execute: async (input) => {
        const stale = checkExpectedRevision(input);
        if (stale) return stale;
        const s = stateRef.current;
        const requestedType = asString(input.apparelType) || s.apparelType;
        const apparel = APPAREL_OPTIONS.find((item) => item.id === requestedType);
        if (!apparel) return failure('INVALID_APPAREL', `Unsupported apparel type: ${requestedType}`);

        const material = asString(input.material) || (apparel.materials.includes(s.material) ? s.material : apparel.materials[0]);
        const size = asString(input.size) || (apparel.sizes.includes(s.size) ? s.size : apparel.sizes[0]);
        const color = asString(input.color) || s.tshirtColor;
        const side = asSide(input.side) || s.currentSide;

        if (!apparel.materials.includes(material)) {
          return failure('INVALID_MATERIAL', `${material} is not available for ${apparel.label}.`, { validMaterials: apparel.materials });
        }
        if (!apparel.sizes.includes(size)) {
          return failure('INVALID_SIZE', `${size} is not available for ${apparel.label}.`, { validSizes: apparel.sizes });
        }
        if (!isHexColor(color)) return failure('INVALID_COLOR', 'Color must be a six-digit hex value such as #000000.');

        if (requestedType !== s.apparelType) dispatch({ type: 'SET_APPAREL_TYPE', payload: requestedType });
        if (material !== s.material) dispatch({ type: 'SET_MATERIAL', payload: material });
        if (size !== s.size) dispatch({ type: 'SET_SIZE', payload: size });
        if (color !== s.tshirtColor) dispatch({ type: 'SET_TSHIRT_COLOR', payload: color });
        if (side !== s.currentSide) dispatch({ type: 'SWITCH_SIDE', payload: side });

        return success({
          applied: { apparelType: requestedType, apparelName: apparel.label, material, size, color, side },
          note: 'The visible CriShirt UI uses the same shared state and will reflect these changes.',
        });
      },
    });

    register({
      name: 'crishirt_set_design_placement',
      title: 'Place apparel artwork',
      description: 'Move, resize, or rotate the existing design on the front or back without visual dragging. Any omitted placement value keeps its current value. Coordinates match the existing 560 by 700 CriShirt mockup workspace.',
      inputSchema: {
        type: 'object',
        properties: {
          expectedRevision: { type: 'number' },
          side: { type: 'string', enum: ['front', 'back'] },
          x: { type: 'number', minimum: 0, maximum: 560 },
          y: { type: 'number', minimum: 0, maximum: 700 },
          width: { type: 'number', minimum: 24, maximum: 400 },
          height: { type: 'number', minimum: 24, maximum: 400 },
          rotation: { type: 'number', minimum: -180, maximum: 180 },
        },
        additionalProperties: false,
      },
      execute: async (input) => {
        const stale = checkExpectedRevision(input);
        if (stale) return stale;
        const s = stateRef.current;
        const side = asSide(input.side) || s.currentSide;
        const design = side === 'front' ? s.frontDesign : s.backDesign;
        if (!design.currentImage) return failure('DESIGN_NOT_FOUND', `There is no ${side} design to place yet.`);
        const current = side === 'front' ? s.frontDesignAlignment : s.backDesignAlignment;
        const alignment: DesignAlignment = {
          x: asFiniteNumber(input.x) ?? current.x,
          y: asFiniteNumber(input.y) ?? current.y,
          width: asFiniteNumber(input.width) ?? current.width,
          height: asFiniteNumber(input.height) ?? current.height,
          rotation: asFiniteNumber(input.rotation) ?? current.rotation,
        };
        if (alignment.x < 0 || alignment.x > 560 || alignment.y < 0 || alignment.y > 700 || alignment.width < 24 || alignment.width > 400 || alignment.height < 24 || alignment.height > 400 || alignment.rotation < -180 || alignment.rotation > 180) {
          return failure('INVALID_PLACEMENT', 'Placement values are outside the supported CriShirt mockup bounds.');
        }
        dispatch({ type: 'UPDATE_DESIGN_ALIGNMENT', payload: { side, alignment } });
        return success({ side, alignment });
      },
    });

    register({
      name: 'crishirt_generate_design',
      title: 'Generate apparel artwork',
      description: 'Generate a new Perfect Corp-backed apparel design and place it into the live CriShirt workspace. Optional garment settings can be supplied in the same call to avoid separate agent round trips. The operation is cancellable.',
      inputSchema: {
        type: 'object',
        required: ['prompt'],
        properties: {
          prompt: { type: 'string', minLength: 1, maxLength: 1000 },
          expectedRevision: { type: 'number' },
          side: { type: 'string', enum: ['front', 'back'] },
          apparelType: { type: 'string', enum: APPAREL_OPTIONS.map((item) => item.id) },
          color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
          material: { type: 'string' },
          size: { type: 'string' },
        },
        additionalProperties: false,
      },
      annotations: { untrustedContentHint: true },
      execute: async (input, { signal }) => {
        const stale = checkExpectedRevision(input);
        if (stale) return stale;
        const prompt = asString(input.prompt);
        if (!prompt) return failure('INVALID_PROMPT', 'A non-empty design prompt is required.');
        const s = stateRef.current;
        if (s.isGenerating || s.isRefining) return failure('WORKSPACE_BUSY', 'CriShirt is already generating or refining a design.');

        const side = asSide(input.side) || s.currentSide;
        const apparelType = asString(input.apparelType) || s.apparelType;
        const apparel = APPAREL_OPTIONS.find((item) => item.id === apparelType);
        if (!apparel) return failure('INVALID_APPAREL', `Unsupported apparel type: ${apparelType}`);
        const material = asString(input.material) || (apparel.materials.includes(s.material) ? s.material : apparel.materials[0]);
        const size = asString(input.size) || (apparel.sizes.includes(s.size) ? s.size : apparel.sizes[0]);
        const color = asString(input.color) || s.tshirtColor;
        if (!apparel.materials.includes(material)) return failure('INVALID_MATERIAL', `${material} is not available for ${apparel.label}.`, { validMaterials: apparel.materials });
        if (!apparel.sizes.includes(size)) return failure('INVALID_SIZE', `${size} is not available for ${apparel.label}.`, { validSizes: apparel.sizes });
        if (!isHexColor(color)) return failure('INVALID_COLOR', 'Color must be a six-digit hex value.');

        dispatch({ type: 'SET_GENERATING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        dispatch({ type: 'SET_GENERATION_PROGRESS', payload: 'Starting Perfect Corp generation...' });
        if (apparelType !== s.apparelType) dispatch({ type: 'SET_APPAREL_TYPE', payload: apparelType });
        if (material !== s.material) dispatch({ type: 'SET_MATERIAL', payload: material });
        if (size !== s.size) dispatch({ type: 'SET_SIZE', payload: size });
        if (color !== s.tshirtColor) dispatch({ type: 'SET_TSHIRT_COLOR', payload: color });
        if (side !== s.currentSide) dispatch({ type: 'SWITCH_SIDE', payload: side });

        try {
          const response = await fetch(`${API_BASE}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, apparelType, apparelName: apparel.label, garmentColor: color, material, printArea: side }),
            signal,
          });
          const data = await readJson(response);
          if (!asString(data.imageUrl)) throw new Error('Generation completed without an image URL.');
          dispatch({ type: 'SET_GENERATED_IMAGE', payload: { side, url: data.imageUrl } });
          dispatch({ type: 'SET_LAST_PROMPT', payload: { side, prompt } });
          dispatch({ type: 'SET_GENERATION_PROGRESS', payload: '' });
          return success({ side, apparelType, apparelName: apparel.label, color, material, size, hasImage: true });
        } catch (error) {
          if (signal.aborted) return failure('CANCELLED', 'Design generation was cancelled.');
          const message = error instanceof Error ? error.message : 'Design generation failed.';
          dispatch({ type: 'SET_ERROR', payload: message });
          dispatch({ type: 'SET_GENERATION_PROGRESS', payload: '' });
          return failure('PERFECT_GENERATION_FAILED', message);
        } finally {
          dispatch({ type: 'SET_GENERATING', payload: false });
        }
      },
    });

    register({
      name: 'crishirt_refine_design',
      title: 'Refine existing artwork',
      description: 'Refine the current front or back artwork through CriShirt’s existing Perfect Corp-backed refinement route. Uses the design already in workspace state, so the agent does not need to copy image URLs. The operation is cancellable.',
      inputSchema: {
        type: 'object',
        required: ['instruction'],
        properties: {
          instruction: { type: 'string', minLength: 1, maxLength: 1000 },
          expectedRevision: { type: 'number' },
          side: { type: 'string', enum: ['front', 'back'] },
        },
        additionalProperties: false,
      },
      annotations: { untrustedContentHint: true },
      execute: async (input, { signal }) => {
        const stale = checkExpectedRevision(input);
        if (stale) return stale;
        const instruction = asString(input.instruction);
        if (!instruction) return failure('INVALID_INSTRUCTION', 'A non-empty refinement instruction is required.');
        const s = stateRef.current;
        if (s.isGenerating || s.isRefining) return failure('WORKSPACE_BUSY', 'CriShirt is already generating or refining a design.');
        const side = asSide(input.side) || s.currentSide;
        const design = side === 'front' ? s.frontDesign : s.backDesign;
        if (!design.currentImage) return failure('DESIGN_NOT_FOUND', `There is no ${side} design to refine.`);
        const apparel = getApparelConfig(s.apparelType);

        dispatch({ type: 'SET_REFINING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        dispatch({ type: 'SET_GENERATION_PROGRESS', payload: 'Starting Perfect Corp refinement...' });
        try {
          const response = await fetch(`${API_BASE}/refine`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ instruction, imageUrl: design.currentImage, apparelType: s.apparelType, apparelName: apparel.label, garmentColor: s.tshirtColor, material: s.material, printArea: side }),
            signal,
          });
          const data = await readJson(response);
          if (!asString(data.refinedImageUrl)) throw new Error('Refinement completed without an image URL.');
          dispatch({ type: 'SET_REFINED_IMAGE', payload: { side, url: data.refinedImageUrl } });
          dispatch({ type: 'SET_LAST_REFINEMENT_PROMPT', payload: { side, prompt: instruction } });
          dispatch({ type: 'SET_GENERATION_PROGRESS', payload: '' });
          try {
            localStorage.setItem('selectedDesign', data.refinedImageUrl);
            localStorage.setItem('tshirtColor', s.tshirtColor);
          } catch {
            // Refinement is still valid if storage quota is unavailable.
          }
          return success({ side, hasImage: true });
        } catch (error) {
          if (signal.aborted) return failure('CANCELLED', 'Design refinement was cancelled.');
          const message = error instanceof Error ? error.message : 'Design refinement failed.';
          dispatch({ type: 'SET_ERROR', payload: message });
          dispatch({ type: 'SET_GENERATION_PROGRESS', payload: '' });
          return failure('PERFECT_REFINEMENT_FAILED', message);
        } finally {
          dispatch({ type: 'SET_REFINING', payload: false });
        }
      },
    });

    register({
      name: 'crishirt_add_current_design_to_cart',
      title: 'Add current apparel to cart',
      description: 'Add the current configured apparel and any front/back artwork to CriShirt’s existing cart state in one semantic operation. Requires at least one design. Uses the same cart data model as the human Add to Cart flow.',
      inputSchema: {
        type: 'object',
        properties: { expectedRevision: { type: 'number' } },
        additionalProperties: false,
      },
      execute: async (input) => {
        const stale = checkExpectedRevision(input);
        if (stale) return stale;
        const s = stateRef.current;
        if (!s.frontDesign.currentImage && !s.backDesign.currentImage) return failure('DESIGN_NOT_FOUND', 'Generate at least one front or back design before adding to cart.');
        const apparel = getApparelConfig(s.apparelType);
        const now = new Date().toISOString();
        const item: CartItem = {
          id: `${Date.now()}-webmcp`,
          apparelType: s.apparelType,
          apparelName: apparel.label,
          frontDesign: { imageUrl: s.frontDesign.currentImage, design: s.frontDesign.lastPrompt || 'No front design', alignment: s.frontDesignAlignment },
          backDesign: { imageUrl: s.backDesign.currentImage, design: s.backDesign.lastPrompt || 'No back design', alignment: s.backDesignAlignment },
          tshirtColor: s.tshirtColor,
          material: s.material,
          size: s.size,
          addedAt: now,
          price: apparel.basePrice,
          arData: { frontMockupUrl: s.frontDesign.currentImage || undefined, backMockupUrl: s.backDesign.currentImage || undefined, lastUsedForAR: now },
        };
        dispatch({ type: 'ADD_TO_CART', payload: item });
        return success({ itemId: item.id, apparelName: apparel.label, price: item.price, cartItemCount: s.cartItems.length + 1 });
      },
    });

    register({
      name: 'crishirt_get_cart',
      title: 'Read CriShirt cart',
      description: 'Read a compact semantic summary of the current CriShirt cart without visually inspecting cart cards.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async () => {
        const items = stateRef.current.cartItems.map((item) => ({
          id: item.id,
          apparelType: item.apparelType || 'tshirt',
          apparelName: item.apparelName || getApparelConfig(item.apparelType).label,
          color: item.tshirtColor,
          material: item.material,
          size: item.size,
          price: item.price,
          hasFrontDesign: Boolean(item.frontDesign.imageUrl),
          hasBackDesign: Boolean(item.backDesign.imageUrl),
          frontPrompt: item.frontDesign.design || null,
          backPrompt: item.backDesign.design || null,
        }));
        return success({ itemCount: items.length, items, total: items.reduce((sum, item) => sum + item.price, 0) });
      },
    });

    register({
      name: 'crishirt_remove_cart_item',
      title: 'Remove CriShirt cart item',
      description: 'Remove one existing CriShirt cart item by the stable item id returned from crishirt_get_cart.',
      inputSchema: {
        type: 'object',
        required: ['itemId'],
        properties: { itemId: { type: 'string', minLength: 1 }, expectedRevision: { type: 'number' } },
        additionalProperties: false,
      },
      execute: async (input) => {
        const stale = checkExpectedRevision(input);
        if (stale) return stale;
        const itemId = asString(input.itemId);
        const s = stateRef.current;
        if (!s.cartItems.some((item) => item.id === itemId)) return failure('CART_ITEM_NOT_FOUND', `No cart item exists with id ${itemId}.`);
        dispatch({ type: 'REMOVE_FROM_CART', payload: itemId });
        return success({ removedItemId: itemId, cartItemCount: s.cartItems.length - 1 });
      },
    });

    register({
      name: 'crishirt_navigate',
      title: 'Navigate CriShirt',
      description: 'Navigate directly to an existing CriShirt surface without searching for navigation links. Supported destinations are create, virtual try-on, collection, and cart.',
      inputSchema: {
        type: 'object',
        required: ['destination'],
        properties: { destination: { type: 'string', enum: ['create', 'tryon', 'collection', 'cart'] } },
        additionalProperties: false,
      },
      execute: async (input) => {
        const destination = asString(input.destination);
        const routeMap: Record<string, (typeof ROUTES)[number]> = { create: '/', tryon: '/ar-tryon', collection: '/collection', cart: '/cart' };
        const route = routeMap[destination];
        if (!route) return failure('INVALID_DESTINATION', 'Destination must be create, tryon, collection, or cart.');
        navigateRef.current(route);
        return success({ route });
      },
    });

    return () => registrationController.abort();
  }, [dispatch]);

  return null;
}

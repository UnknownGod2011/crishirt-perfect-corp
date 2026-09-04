import { useEffect, useRef } from 'react';
import { COLLECTION_PRODUCTS, createCollectionCartItem, getCollectionProduct } from '../config/collectionCatalog';
import { useAppContext } from '../store/AppContext';

type ToolInput = Record<string, unknown>;
type WebMCPTool = {
  name: string;
  title?: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
  execute: (input: ToolInput, options: { signal: AbortSignal }) => Promise<unknown> | unknown;
};
type ModelContextLike = {
  registerTool: (tool: WebMCPTool, options?: { signal?: AbortSignal }) => Promise<void>;
};

const success = (data: Record<string, unknown>) => ({ success: true, ...data });
const failure = (errorCode: string, message: string, details?: Record<string, unknown>) => ({
  success: false,
  errorCode,
  message,
  ...(details || {}),
});

export default function CollectionWebMCPBridge() {
  const { state, dispatch } = useAppContext();
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const modelContext = (document as Document & { modelContext?: ModelContextLike }).modelContext;
    if (!modelContext?.registerTool) return;

    const controller = new AbortController();
    const register = (tool: WebMCPTool) => {
      void modelContext.registerTool(tool, { signal: controller.signal }).catch((error) => {
        console.warn(`[WebMCP] Failed to register ${tool.name}`, error);
      });
    };

    register({
      name: 'crishirt_list_collection',
      title: 'List CriShirt collection',
      description: 'Read the existing CriShirt Exclusive Collection as compact structured product data, including stable product ids, availability, display price, category, and image path. This avoids visually inspecting every collection card.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: async () => success({
        products: COLLECTION_PRODUCTS.map((product) => ({
          id: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          available: product.available,
          image: product.image || null,
        })),
      }),
    });

    register({
      name: 'crishirt_add_collection_item_to_cart',
      title: 'Add collection item to cart',
      description: 'Add one currently available product from CriShirt’s existing Exclusive Collection directly to the same cart state used by the human collection page. Use a product id returned by crishirt_list_collection.',
      inputSchema: {
        type: 'object',
        required: ['productId'],
        properties: {
          productId: { type: 'integer', enum: COLLECTION_PRODUCTS.map((product) => product.id) },
        },
        additionalProperties: false,
      },
      execute: async (input) => {
        const productId = typeof input.productId === 'number' && Number.isInteger(input.productId) ? input.productId : undefined;
        if (productId === undefined) return failure('INVALID_COLLECTION_PRODUCT', 'A valid collection product id is required.');
        const product = getCollectionProduct(productId);
        if (!product) return failure('COLLECTION_PRODUCT_NOT_FOUND', `No collection product exists with id ${productId}.`);
        if (!product.available || product.numericPrice === null) {
          return failure('COLLECTION_PRODUCT_UNAVAILABLE', `${product.name} is not currently available.`);
        }

        const item = createCollectionCartItem(product, 'webmcp');
        const priorCount = stateRef.current.cartItems.length;
        dispatch({ type: 'ADD_TO_CART', payload: item });
        return success({
          itemId: item.id,
          product: { id: product.id, name: product.name, price: item.price },
          cartItemCount: priorCount + 1,
        });
      },
    });

    return () => controller.abort();
  }, [dispatch]);

  return null;
}

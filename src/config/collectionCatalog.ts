import type { CartItem } from '../store/AppContext';

export interface CollectionProduct {
  id: number;
  name: string;
  category: string;
  price: string;
  numericPrice: number | null;
  image?: string;
  available: boolean;
}

export const COLLECTION_PRODUCTS: CollectionProduct[] = [
  {
    id: 1,
    name: 'Golden Treasure Tee',
    category: 'Exclusive Collection',
    price: '$24.99',
    numericPrice: 24.99,
    image: '/TeeCollection/Tee1.png',
    available: true,
  },
  {
    id: 2,
    name: 'Retro Gaming Tee',
    category: 'Exclusive Collection',
    price: '$24.99',
    numericPrice: 24.99,
    image: '/TeeCollection/Tee2.png',
    available: true,
  },
  {
    id: 3,
    name: 'Chess Master Tee',
    category: 'Exclusive Collection',
    price: '$24.99',
    numericPrice: 24.99,
    image: '/TeeCollection/Tee3.png',
    available: true,
  },
  {
    id: 4,
    name: 'Urban Style Hoodie',
    category: 'Exclusive Collection',
    price: '$24.99',
    numericPrice: 24.99,
    image: '/TeeCollection/Tee4.png',
    available: true,
  },
  {
    id: 5,
    name: 'Crystal Series Limited Drop',
    category: 'Premium Wear',
    price: 'Coming Soon',
    numericPrice: null,
    available: false,
  },
  {
    id: 6,
    name: 'Aurora Glow Collection',
    category: 'AI-Generated Fits',
    price: 'Coming Soon',
    numericPrice: null,
    available: false,
  },
];

export function getCollectionProduct(productId: number) {
  return COLLECTION_PRODUCTS.find((product) => product.id === productId);
}

export function createCollectionCartItem(product: CollectionProduct, source: 'human' | 'webmcp' = 'human'): CartItem {
  if (!product.available || product.numericPrice === null) {
    throw new Error(`${product.name} is not currently available.`);
  }

  return {
    id: `collection-${product.id}-${Date.now()}-${source}`,
    frontDesign: {
      imageUrl: null,
      design: 'Complete T-shirt product',
      alignment: {
        x: 205,
        y: 280,
        width: 150,
        height: 150,
        rotation: 0,
      },
    },
    backDesign: {
      imageUrl: null,
      design: 'No back design',
    },
    tshirtColor: '#000000',
    material: 'Cotton',
    size: 'M',
    addedAt: new Date().toISOString(),
    price: product.numericPrice,
    collectionItem: {
      isCollectionItem: true,
      completeProductImage: product.image || null,
      productName: product.name,
      category: product.category,
    },
  };
}

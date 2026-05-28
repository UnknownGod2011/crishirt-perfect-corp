export type ApparelType =
  | 'tshirt'
  | 'hoodie'
  | 'sweatshirt'
  | 'oversized-tee'
  | 'crop-top'
  | 'long-sleeve';

export interface PrintAreaConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ApparelConfig {
  id: ApparelType;
  label: string;
  basePrice: number;
  perfectGarmentCategory: 'upper_body' | 'auto';
  assets: {
    front: string;
    back: string;
    /** SVG white-base used as the multiply target for non-tshirt garments */
    frontSvg?: string;
    backSvg?: string;
  };
  materials: string[];
  sizes: string[];
  printArea: {
    front: PrintAreaConfig;
    back: PrintAreaConfig;
  };
}

const defaultSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const defaultMaterials = ['Cotton', 'Polyester', 'Blended', 'Organic Cotton'];

export const APPAREL_OPTIONS: ApparelConfig[] = [
  {
    id: 'tshirt',
    label: 'T-shirt',
    basePrice: 29.99,
    perfectGarmentCategory: 'upper_body',
    assets: {
      front: '/mockups/tshirt.png',
      back: '/mockups/tshirtbp.png',
    },
    materials: defaultMaterials,
    sizes: defaultSizes,
    printArea: {
      front: { x: 205, y: 280, width: 150, height: 150 },
      back: { x: 205, y: 270, width: 150, height: 150 },
    },
  },
  {
    id: 'hoodie',
    label: 'Hoodie',
    basePrice: 49.99,
    perfectGarmentCategory: 'upper_body',
    assets: {
      front: '/mockups/apparel/hoodie-front.png',
      back: '/mockups/apparel/hoodie-back.png',
    },
    materials: ['Cotton Fleece', 'Poly Fleece', 'Blended'],
    sizes: defaultSizes,
    printArea: {
      front: { x: 207, y: 251, width: 147, height: 147 },
      back:  { x: 210, y: 249, width: 141, height: 141 },
    },
  },
  {
    id: 'sweatshirt',
    label: 'Sweatshirt',
    basePrice: 44.99,
    perfectGarmentCategory: 'upper_body',
    assets: {
      front: '/mockups/apparel/sweatshirt-front.png',
      back: '/mockups/apparel/sweatshirt-back.png',
    },
    materials: ['Cotton Fleece', 'Poly Fleece', 'Blended'],
    sizes: defaultSizes,
    printArea: {
      front: { x: 191, y: 265, width: 181, height: 181 },
      back:  { x: 195, y: 260, width: 173, height: 173 },
    },
  },
  {
    id: 'oversized-tee',
    label: 'Oversized T-shirt',
    basePrice: 36.99,
    perfectGarmentCategory: 'upper_body',
    assets: {
      front: '/mockups/apparel/oversized-tee-front.png',
      back: '/mockups/apparel/oversized-tee-back.png',
    },
    materials: defaultMaterials,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    printArea: {
      front: { x: 249, y: 240, width: 163, height: 163 },
      back:  { x: 236, y: 244, width: 175, height: 175 },
    },
  },
  {
    id: 'crop-top',
    label: 'Crop top',
    basePrice: 34.99,
    perfectGarmentCategory: 'upper_body',
    assets: {
      front: '/mockups/apparel/crop-top-front.png',
      back: '/mockups/apparel/crop-top-back.png',
    },
    materials: ['Cotton', 'Ribbed Cotton', 'Blended'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    printArea: {
      front: { x: 240, y: 264, width: 163, height: 163 },
      back:  { x: 239, y: 284, width: 163, height: 163 },
    },
  },
  {
    id: 'long-sleeve',
    label: 'Long-sleeve tee',
    basePrice: 39.99,
    perfectGarmentCategory: 'upper_body',
    assets: {
      front: '/mockups/apparel/long-sleeve-front.png',
      back: '/mockups/apparel/long-sleeve-back.png',
    },
    materials: defaultMaterials,
    sizes: defaultSizes,
    printArea: {
      front: { x: 232, y: 245, width: 168, height: 168 },
      back:  { x: 228, y: 247, width: 166, height: 166 },
    },
  },
];

export const getApparelConfig = (type?: string): ApparelConfig => {
  return APPAREL_OPTIONS.find((item) => item.id === type) || APPAREL_OPTIONS[0];
};

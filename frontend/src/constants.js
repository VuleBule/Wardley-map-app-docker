export const ItemTypes = {
  COMPONENT: 'component',
};

export const MapExportTypes = {
  PNG: 'png',
  SVG: 'svg',
  JSON: 'json',
};

export const EvolutionStages = {
  GENESIS: { min: 0, max: 0.25, name: 'Genesis' },
  CUSTOM: { min: 0.25, max: 0.5, name: 'Custom Built' },
  PRODUCT: { min: 0.5, max: 0.75, name: 'Product' },
  COMMODITY: { min: 0.75, max: 1, name: 'Commodity' },
};

export const ValueStages = {
  LOW: { min: 0, max: 0.25, name: 'Low Value' },
  MEDIUM: { min: 0.25, max: 0.75, name: 'Medium Value' },
  HIGH: { min: 0.75, max: 1, name: 'High Value' },
};

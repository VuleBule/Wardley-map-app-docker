import { saveAs } from 'file-saver';
import { MapExportTypes } from '../constants';

export const exportMap = async (type, svgElement, mapData) => {
  switch (type) {
    case MapExportTypes.PNG:
      await exportAsPNG(svgElement);
      break;
    case MapExportTypes.SVG:
      exportAsSVG(svgElement);
      break;
    case MapExportTypes.JSON:
      exportAsJSON(mapData);
      break;
    default:
      throw new Error('Unsupported export type');
  }
};

const exportAsPNG = async (svgElement) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const svgString = new XMLSerializer().serializeToString(svgElement);
  const svg = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svg);
  
  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    context.drawImage(img, 0, 0);
    canvas.toBlob((blob) => {
      saveAs(blob, 'wardley-map.png');
    });
  };
  img.src = url;
};

const exportAsSVG = (svgElement) => {
  const svgString = new XMLSerializer().serializeToString(svgElement);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  saveAs(blob, 'wardley-map.svg');
};

const exportAsJSON = (mapData) => {
  const blob = new Blob([JSON.stringify(mapData, null, 2)], {
    type: 'application/json;charset=utf-8'
  });
  saveAs(blob, 'wardley-map.json');
};

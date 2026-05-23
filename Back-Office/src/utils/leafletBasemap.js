import L from 'leaflet';

/**
 * Mapa Leaflet claro (fundo branco/cinza, estradas — sem relevo/vegetação colorida).
 * Carto Positron: https://carto.com/basemaps/
 */
export const LEAFLET_LIGHT_TILE = {
  url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  options: {
    maxZoom: 20,
    subdomains: 'abcd',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noreferrer">OpenStreetMap</a> '
      + '&copy; <a href="https://carto.com/attributions" rel="noreferrer">CARTO</a>',
  },
};

export function addLightBasemap(map) {
  if (!map) return null;
  return L.tileLayer(LEAFLET_LIGHT_TILE.url, LEAFLET_LIGHT_TILE.options).addTo(map);
}

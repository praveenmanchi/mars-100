// Simple Mars Map Service with reliable fallback tiles
import L from 'leaflet';

// Multiple fallback tile sources for Mars
const MARS_TILE_SOURCES = {
  // Primary: OpenPlanetaryMap Mars tiles
  openPlanetary: {
    url: 'https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-mars-basemap-v0-2/all/{z}/{x}/{y}.png',
    attribution: '© OpenPlanetaryMap',
    maxZoom: 8,
    available: true
  },
  // Fallback 1: USGS Mars Viking Color Mosaic
  usgsViking: {
    url: 'https://astrowebmaps.wr.usgs.gov/webmapatlas/Layers/mars_viking_color/{z}/{x}/{y}.png',
    attribution: '© USGS Astrogeology',
    maxZoom: 7,
    available: true
  },
  // Fallback 2: Simple colored terrain (generic tile server style)
  basicTerrain: {
    url: 'https://tiles.wmflabs.org/hillshading/{z}/{x}/{y}.png',
    attribution: '© Map data',
    maxZoom: 8,
    available: true
  },
  // Ultimate fallback: Local/generated tiles
  localFallback: {
    url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    attribution: 'Local tiles',
    maxZoom: 18,
    available: true
  }
};

// Create a simple, reliable Mars map layer
export const createSimpleMarsLayer = () => {
  // Start with OpenPlanetaryMap tiles as they're most reliable
  const primarySource = MARS_TILE_SOURCES.openPlanetary;
  
  return L.tileLayer(primarySource.url, {
    attribution: primarySource.attribution,
    maxZoom: primarySource.maxZoom || 8,
    minZoom: 0,
    tileSize: 256,
    crossOrigin: 'anonymous',
    // Provide a data URL as error tile (transparent 1x1 PNG)
    errorTileUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iIzNGMUUxNSIvPjx0ZXh0IHg9IjEyOCIgeT0iMTI4IiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjEyIiBmaWxsPSIjODU0NDQyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TWFycyBUaWxlPC90ZXh0Pjwvc3ZnPg=='
  });
};

// Create a basic colored background layer as ultimate fallback
export const createBasicMarsBackground = () => {
  // Create a simple canvas tile layer with Mars-like colors
  const CanvasTileLayer = L.GridLayer.extend({
    createTile: function(coords) {
      const tile = document.createElement('canvas');
      const ctx = tile.getContext('2d');
      const size = this.getTileSize();
      
      tile.width = size.x;
      tile.height = size.y;
      
      // Create a Mars-like gradient background
      const gradient = ctx.createRadialGradient(
        size.x / 2, size.y / 2, 0,
        size.x / 2, size.y / 2, size.x / 2
      );
      
      // Mars colors - rusty reds and browns
      const colors = [
        '#8B4513', // saddle brown
        '#A0522D', // sienna
        '#CD853F', // peru
        '#D2691E', // chocolate
        '#BC8F8F'  // rosy brown
      ];
      
      // Random Mars-like color for this tile
      const baseColor = colors[Math.floor(Math.random() * colors.length)];
      
      gradient.addColorStop(0, baseColor);
      gradient.addColorStop(0.5, '#704214');
      gradient.addColorStop(1, '#3F1E15');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size.x, size.y);
      
      // Add some texture
      ctx.globalAlpha = 0.1;
      for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        ctx.arc(
          Math.random() * size.x,
          Math.random() * size.y,
          Math.random() * 10 + 2,
          0,
          2 * Math.PI
        );
        ctx.fillStyle = Math.random() > 0.5 ? '#000000' : '#FFFFFF';
        ctx.fill();
      }
      
      // Add tile coordinates for debugging
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px monospace';
      ctx.fillText(`${coords.x},${coords.y} z${coords.z}`, 10, 20);
      
      return tile;
    }
  });
  
  return new CanvasTileLayer({
    attribution: 'Mars Surface Simulation',
    maxZoom: 18,
    minZoom: 0,
    tileSize: 256
  });
};

// Export a function to get the best available layer
export const getBestMarsLayer = () => {
  // Try OpenPlanetaryMap first as it's most reliable
  try {
    return createSimpleMarsLayer();
  } catch (error) {
    console.warn('Failed to create primary Mars layer, using canvas fallback');
    // Fall back to canvas-generated tiles
    return createBasicMarsBackground();
  }
};

export default {
  createSimpleMarsLayer,
  createBasicMarsBackground,
  getBestMarsLayer,
  MARS_TILE_SOURCES
};
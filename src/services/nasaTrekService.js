// NASA Trek WMTS Service Integration
// Fixed to use proper WMTS endpoints and Mars equirectangular projection

import L from 'leaflet';
import proj4 from 'proj4';

// NASA Trek WMTS base URL (using correct WMTS format)
const NASA_TREK_WMTS_BASE = 'https://trek.nasa.gov/tiles/Mars/EQ';

// Define Mars equirectangular projection (EPSG:104905)
proj4.defs('EPSG:104905', 
  '+proj=eqc +lat_ts=0 +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +a=3396190 +b=3396190 +units=m +no_defs'
);

// Mars coordinate reference system for Leaflet
export const MARS_CRS = L.extend({}, L.CRS.EPSG4326, {
  code: 'EPSG:104905',
  projection: L.Projection.LonLat,
  transformation: new L.Transformation(1/180, 1, -1/180, 0.5)
});

// Valid NASA Trek WMTS layer configurations (from API documentation)
export const MARS_TILE_LAYERS = {
  themis_day_ir: {
    id: 'themis_day_ir',
    name: 'THEMIS Day IR Global',
    description: 'Mars Odyssey THEMIS Infrared Day Global Mosaic - 100m/pixel',
    layerId: 'THEMIS_DayIR_ControlledMosaics_100m_v2_oct2018',
    url: `${NASA_TREK_WMTS_BASE}/THEMIS_DayIR_ControlledMosaics_100m_v2_oct2018/1.0.0/default/default028mm/{z}/{y}/{x}.jpg`,
    attribution: '© NASA/JPL/ASU - Mars Odyssey THEMIS',
    maxZoom: 12,
    minZoom: 0,
    resolution: '100m/pixel',
    dataSource: 'Mars Odyssey THEMIS',
    bounds: [[-65.0006576, -179.9999997], [65.0007535, 179.9998849]],
    tileSize: 256
  },
  themis_night_ir: {
    id: 'themis_night_ir',
    name: 'THEMIS Night IR Global',
    description: 'Mars Odyssey THEMIS Infrared Night Global Mosaic - 100m/pixel',
    layerId: 'THEMIS_NightIR_ControlledMosaics_100m_v2_oct2018',
    url: `${NASA_TREK_WMTS_BASE}/THEMIS_NightIR_ControlledMosaics_100m_v2_oct2018/1.0.0/default/default028mm/{z}/{y}/{x}.jpg`,
    attribution: '© NASA/JPL/ASU - Mars Odyssey THEMIS',
    maxZoom: 12,
    minZoom: 0,
    resolution: '100m/pixel',
    dataSource: 'Mars Odyssey THEMIS',
    bounds: [[-65.0006576, -179.9999997], [65.0007535, 179.9998849]],
    tileSize: 256
  },
  mola_colorhillshade: {
    id: 'mola_colorhillshade',
    name: 'MOLA Color Hillshade',
    description: 'Mars Global Surveyor MOLA Global Color Hillshade - 463m/pixel',
    layerId: 'Mars_MGS_MOLA_ClrShade_merge_global_463m',
    url: `${NASA_TREK_WMTS_BASE}/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg`,
    attribution: '© NASA/JPL/GSFC - Mars Global Surveyor MOLA',
    maxZoom: 10,
    minZoom: 0,
    resolution: '463m/pixel',
    dataSource: 'MGS MOLA',
    bounds: [[-89.9991635, -180], [90, 179.9983271]],
    tileSize: 256
  },
  mola_hrsc_blend: {
    id: 'mola_hrsc_blend',
    name: 'MOLA HRSC Color Blend',
    description: 'MGS MOLA and Mars Express HRSC Color Hillshade Blend - 200m/pixel',
    layerId: 'Mars_MOLA_blend200ppx_HRSC_ClrShade_clon0dd_200mpp_lzw',
    url: `${NASA_TREK_WMTS_BASE}/Mars_MOLA_blend200ppx_HRSC_ClrShade_clon0dd_200mpp_lzw/1.0.0/default/default028mm/{z}/{y}/{x}.jpg`,
    attribution: '© NASA/JPL/GSFC/ESA - MGS MOLA & Mars Express HRSC',
    maxZoom: 11,
    minZoom: 0,
    resolution: '200m/pixel',
    dataSource: 'MGS MOLA + MEX HRSC',
    bounds: [[-89.999224, -180], [90, 179.9984479]],
    tileSize: 256
  },
  moc_global: {
    id: 'moc_global',
    name: 'MOC Global Color',
    description: 'Mars Global Surveyor MOC Global Color Mosaic',
    layerId: 'msss_atlas_simp_clon',
    url: `${NASA_TREK_WMTS_BASE}/msss_atlas_simp_clon/1.0.0/default/default028mm/{z}/{y}/{x}.png`,
    attribution: '© NASA/JPL/MSSS - Mars Global Surveyor MOC',
    maxZoom: 9,
    minZoom: 0,
    resolution: '~230m/pixel',
    dataSource: 'MGS MOC',
    bounds: [[-89.9999958, -179.9999885], [89.9999916, 179.9999862]],
    tileSize: 256
  },
  hirise_color_global: {
    id: 'hirise_color_global',
    name: 'HiRISE Color Global',
    description: 'Mars Reconnaissance Orbiter HiRISE Color Global Mosaic - 0.25m/pixel',
    layerId: 'Mars_MRO_HiRISE_color_global_mosaic_v01_2024',
    url: `${NASA_TREK_WMTS_BASE}/Mars_MRO_HiRISE_color_global_mosaic_v01_2024/1.0.0/default/default028mm/{z}/{y}/{x}.jpg`,
    attribution: '© NASA/JPL/UA - Mars Reconnaissance Orbiter HiRISE',
    maxZoom: 16,
    minZoom: 0,
    resolution: '0.25m/pixel',
    dataSource: 'MRO HiRISE',
    bounds: [[-89.9999, -179.9999], [89.9999, 179.9999]],
    tileSize: 256
  },
  ctx_global_mosaic: {
    id: 'ctx_global_mosaic',
    name: 'CTX Global Mosaic',
    description: 'Mars Reconnaissance Orbiter Context Camera Global Mosaic - 6m/pixel',
    layerId: 'Mars_MRO_CTX_Global_Mosaic_v01_2023',
    url: `${NASA_TREK_WMTS_BASE}/Mars_MRO_CTX_Global_Mosaic_v01_2023/1.0.0/default/default028mm/{z}/{y}/{x}.jpg`,
    attribution: '© NASA/JPL/ASU - Mars Reconnaissance Orbiter CTX',
    maxZoom: 14,
    minZoom: 0,
    resolution: '6m/pixel',
    dataSource: 'MRO CTX',
    bounds: [[-89.9999, -179.9999], [89.9999, 179.9999]],
    tileSize: 256
  }
};

// Create NASA Trek WMTS tile layer with proper error handling
export const createNASATileLayer = (layerConfig, options = {}) => {
  const defaultOptions = {
    attribution: layerConfig.attribution,
    maxZoom: layerConfig.maxZoom,
    minZoom: layerConfig.minZoom,
    tileSize: layerConfig.tileSize || 256,
    crossOrigin: 'anonymous',
    bounds: layerConfig.bounds || null,
    ...options
  };

  // Create WMTS tile layer using correct URL template
  const tileLayer = L.tileLayer(layerConfig.url, {
    ...defaultOptions,
    // Improved error handling without console spam
    onTileError: function(error, tile) {
      // Silently handle missing tiles (no data coverage areas)
      tile.style.display = 'none';
    }
  });

  // Add metadata to the layer
  tileLayer.nasaTrekConfig = layerConfig;
  tileLayer.layerId = layerConfig.id;

  return tileLayer;
};

// Intelligent layer selection based on zoom level and available data
export const selectOptimalLayer = (zoomLevel) => {
  if (zoomLevel >= 14) {
    return MARS_TILE_LAYERS.hirise_color_global; // Ultra high zoom - use HiRISE Color (0.25m/pixel)
  } else if (zoomLevel >= 12) {
    return MARS_TILE_LAYERS.ctx_global_mosaic; // Very high zoom - use CTX Global (6m/pixel)
  } else if (zoomLevel >= 10) {
    return MARS_TILE_LAYERS.mola_hrsc_blend; // High zoom - use MOLA/HRSC blend (200m/pixel)
  } else if (zoomLevel >= 6) {
    return MARS_TILE_LAYERS.themis_day_ir; // Medium zoom - use THEMIS day IR (100m/pixel)
  } else {
    return MARS_TILE_LAYERS.mola_colorhillshade; // Low zoom - use MOLA color hillshade (463m/pixel)
  }
};

// NASA Trek Service class with fixed WMTS integration
export class NASATrekService {
  constructor() {
    this.activeLayers = new Map();
  }

  // Create multiple layers for layer switching
  createLayerGroup(layerIds = Object.keys(MARS_TILE_LAYERS)) {
    const layers = {};
    
    layerIds.forEach(layerId => {
      if (MARS_TILE_LAYERS[layerId]) {
        layers[layerId] = createNASATileLayer(MARS_TILE_LAYERS[layerId]);
        this.activeLayers.set(layerId, layers[layerId]);
      }
    });

    return layers;
  }

  // Switch between layers with smooth transitions
  switchLayer(map, fromLayerId, toLayerId) {
    const fromLayer = this.activeLayers.get(fromLayerId);
    const toLayer = this.activeLayers.get(toLayerId);

    if (!toLayer) {
      console.warn(`Layer ${toLayerId} not found`);
      return false;
    }

    // Add new layer
    map.addLayer(toLayer);

    // Remove old layer after transition
    if (fromLayer && fromLayer !== toLayer) {
      setTimeout(() => {
        map.removeLayer(fromLayer);
      }, 300); // Allow smooth transition
    }

    return true;
  }

  // Removed problematic preloading - let Leaflet handle tile loading naturally
  
  // Get layer information
  getLayerInfo(layerId) {
    return MARS_TILE_LAYERS[layerId] || null;
  }

  // Get all available layers
  getAllLayers() {
    return { ...MARS_TILE_LAYERS };
  }

  // Check if a layer is available
  isLayerAvailable(layerId) {
    return layerId in MARS_TILE_LAYERS;
  }

  // Get optimal layer for current zoom
  getOptimalLayerForZoom(zoomLevel) {
    return selectOptimalLayer(zoomLevel);
  }
}

// Export singleton instance
export const nasaTrekService = new NASATrekService();

export default nasaTrekService;
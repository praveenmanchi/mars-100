// Mission Timeline Data Sources & Events
// Comprehensive Sol-based mission data for Perseverance rover

// Mission phases and major events
export const MISSION_PHASES = {
  LANDING: { name: 'Landing & Checkout', color: '#4CAF50', sols: [0, 60] },
  EXPLORATION: { name: 'Crater Floor Exploration', color: '#2196F3', sols: [61, 235] },
  DELTA_APPROACH: { name: 'Delta Approach', color: '#FF9800', sols: [236, 414] },
  DELTA_CAMPAIGN: { name: 'Delta Campaign', color: '#9C27B0', sols: [415, 707] },
  SAMPLE_DEPOT: { name: 'Sample Depot Operations', color: '#F44336', sols: [708, 900] },
  CRATER_RIM: { name: 'Crater Rim Exploration', color: '#795548', sols: [901, 1200] }
};

// Detailed mission events with Sol-accurate data
export const MISSION_EVENTS = {
  0: {
    type: 'landing',
    title: 'Landing at Jezero Crater',
    description: 'Successfully landed in Jezero Crater using sky crane technology',
    coordinates: { lat: 18.4447, lon: 77.4508 },
    significance: 'high',
    cameras_active: ['navcam', 'hazcam'],
    science_objectives: ['Terrain assessment', 'System health checks']
  },
  
  3: {
    type: 'milestone',
    title: 'First Wheel Movement',
    description: 'First successful drive test - 6.5 meters',
    coordinates: { lat: 18.4448, lon: 77.4509 },
    significance: 'medium',
    distance_driven: 6.5
  },

  18: {
    type: 'science',
    title: 'First Rock Analysis',
    description: 'PIXL and SHERLOC analysis of "Yeehgo" rock',
    coordinates: { lat: 18.4452, lon: 77.4515 },
    significance: 'high',
    samples: ['yeehgo_analysis'],
    instruments: ['PIXL', 'SHERLOC', 'SUPERCAM']
  },

  43: {
    type: 'companion',
    title: 'Ingenuity Helicopter Deployment',
    description: 'Ingenuity helicopter deployed from rover belly',
    coordinates: { lat: 18.4456, lon: 77.4518 },
    significance: 'high',
    related_mission: 'Ingenuity Mars Helicopter'
  },

  58: {
    type: 'companion',
    title: 'Ingenuity First Flight',
    description: 'First powered controlled flight on another planet',
    coordinates: { lat: 18.4457, lon: 77.4519 },
    significance: 'historic',
    flight_data: { altitude: 3, duration: 39, distance: 0 }
  },

  76: {
    type: 'sample',
    title: 'First Coring Attempt',
    description: 'First attempt at collecting core sample from "Roubion" rock',
    coordinates: { lat: 18.4461, lon: 77.4523 },
    significance: 'high',
    outcome: 'No sample collected - rock was too crumbly'
  },

  190: {
    type: 'sample',
    title: 'First Successful Sample',
    description: 'Successfully collected first rock sample from "Rochette"',
    coordinates: { lat: 18.4478, lon: 77.4542 },
    significance: 'historic',
    sample_name: 'Rochette',
    sample_number: 1
  },

  235: {
    type: 'milestone',
    title: 'One Year on Mars',
    description: 'Completed one Earth year of operations on Mars',
    coordinates: { lat: 18.4485, lon: 77.4555 },
    significance: 'high',
    stats: {
      distance_traveled: 2.6,
      samples_collected: 6,
      flights_witnessed: 21
    }
  },

  414: {
    type: 'exploration',
    title: 'Ancient River Delta Arrival',
    description: 'Reached the base of the ancient river delta formation',
    coordinates: { lat: 18.4512, lon: 77.4598 },
    significance: 'high',
    geological_significance: 'Potential biosignatures in ancient sedimentary layers'
  },

  500: {
    type: 'sample',
    title: 'Delta Sample Collection',
    description: 'Collected samples from sedimentary rocks in ancient river delta',
    coordinates: { lat: 18.4523, lon: 77.4615 },
    significance: 'high',
    sample_name: 'Wildcat Ridge',
    sample_number: 12,
    science_value: 'High potential for preserved organic matter'
  },

  707: {
    type: 'milestone',
    title: 'Sample Depot Creation',
    description: 'Began creating sample depot for future Mars Sample Return mission',
    coordinates: { lat: 18.4535, lon: 77.4628 },
    significance: 'historic',
    depot_samples: 10
  },

  900: {
    type: 'exploration',
    title: 'Crater Rim Ascent',
    description: 'Began challenging ascent to Jezero Crater rim',
    coordinates: { lat: 18.4545, lon: 77.4645 },
    significance: 'high',
    elevation_gain: 200
  },

  1000: {
    type: 'milestone',
    title: 'Sol 1000 Achievement',
    description: '1000 sols of successful Mars operations',
    coordinates: { lat: 18.4558, lon: 77.4662 },
    significance: 'historic',
    stats: {
      distance_traveled: 24.97,
      samples_collected: 24,
      rock_analysis: 300,
      weather_reports: 1000
    }
  }
};

// Camera configurations for each rover
export const CAMERA_CONFIGS = {
  perseverance: {
    NAVCAM_LEFT: { name: 'Navigation Camera - Left', type: 'navigation', typical_count: 10 },
    NAVCAM_RIGHT: { name: 'Navigation Camera - Right', type: 'navigation', typical_count: 10 },
    MCZ_LEFT: { name: 'Mastcam-Z Left', type: 'science', typical_count: 5 },
    MCZ_RIGHT: { name: 'Mastcam-Z Right', type: 'science', typical_count: 5 },
    FRONT_HAZCAM_LEFT: { name: 'Front Hazard Camera - Left', type: 'engineering', typical_count: 2 },
    FRONT_HAZCAM_RIGHT: { name: 'Front Hazard Camera - Right', type: 'engineering', typical_count: 2 },
    REAR_HAZCAM_LEFT: { name: 'Rear Hazard Camera - Left', type: 'engineering', typical_count: 2 },
    REAR_HAZCAM_RIGHT: { name: 'Rear Hazard Camera - Right', type: 'engineering', typical_count: 2 },
    SKYCAM: { name: 'Sky Camera', type: 'atmospheric', typical_count: 1 }
  },
  curiosity: {
    NAVCAM_LEFT: { name: 'Navigation Camera - Left', type: 'navigation', typical_count: 8 },
    NAVCAM_RIGHT: { name: 'Navigation Camera - Right', type: 'navigation', typical_count: 8 },
    MAST: { name: 'Mast Camera', type: 'science', typical_count: 15 },
    CHEMCAM: { name: 'Chemistry and Camera Complex', type: 'science', typical_count: 3 },
    FRONT_HAZCAM_LEFT: { name: 'Front Hazard Camera - Left', type: 'engineering', typical_count: 2 },
    FRONT_HAZCAM_RIGHT: { name: 'Front Hazard Camera - Right', type: 'engineering', typical_count: 2 },
    REAR_HAZCAM_LEFT: { name: 'Rear Hazard Camera - Left', type: 'engineering', typical_count: 2 },
    REAR_HAZCAM_RIGHT: { name: 'Rear Hazard Camera - Right', type: 'engineering', typical_count: 2 }
  }
};

// Generate rover path coordinates based on mission timeline
export const generateRoverPath = (rover = 'perseverance', maxSol = 1000) => {
  const path = [];
  const events = Object.entries(MISSION_EVENTS).filter(([sol]) => parseInt(sol) <= maxSol);
  
  // Start with landing coordinates
  let currentLat = 18.4447;
  let currentLon = 77.4508;
  
  // Add landing point
  path.push({ sol: 0, lat: currentLat, lon: currentLon, event: 'Landing' });
  
  // Generate path points based on events and interpolate between them
  for (let sol = 1; sol <= maxSol; sol++) {
    const event = MISSION_EVENTS[sol];
    
    if (event && event.coordinates) {
      // Use actual event coordinates
      currentLat = event.coordinates.lat;
      currentLon = event.coordinates.lon;
      path.push({
        sol,
        lat: currentLat,
        lon: currentLon,
        event: event.title,
        type: event.type
      });
    } else {
      // Interpolate position for sols without specific events
      const progress = sol / maxSol;
      const exploration_factor = 0.002; // How far the rover explores
      
      // Small random walk simulation
      const noise = (Math.sin(sol * 0.1) + Math.cos(sol * 0.15)) * 0.00005;
      currentLat += noise + (progress * exploration_factor * 0.3);
      currentLon += noise + (progress * exploration_factor * 0.7);
      
      path.push({
        sol,
        lat: currentLat,
        lon: currentLon,
        interpolated: true
      });
    }
  }
  
  return path;
};

// Get mission events for specific sol range
export const getEventsForSolRange = (startSol, endSol) => {
  return Object.entries(MISSION_EVENTS)
    .filter(([sol]) => {
      const solNum = parseInt(sol);
      return solNum >= startSol && solNum <= endSol;
    })
    .map(([sol, event]) => ({ sol: parseInt(sol), ...event }))
    .sort((a, b) => a.sol - b.sol);
};

// Get current mission phase for a given sol
export const getMissionPhase = (sol) => {
  for (const [phase, data] of Object.entries(MISSION_PHASES)) {
    if (sol >= data.sols[0] && sol <= data.sols[1]) {
      return { phase, ...data };
    }
  }
  return { phase: 'UNKNOWN', name: 'Unknown Phase', color: '#666', sols: [sol, sol] };
};

// Convert Sol to Earth date (approximate)
export const solToEarthDate = (sol) => {
  const LANDING_DATE = new Date('2021-02-18T20:55:00Z'); // Perseverance landing
  const SOL_TO_EARTH_RATIO = 1.0274912517; // Mars sol is ~24h 37m
  const earthMilliseconds = sol * SOL_TO_EARTH_RATIO * 24 * 60 * 60 * 1000;
  return new Date(LANDING_DATE.getTime() + earthMilliseconds);
};

// Convert Earth date to Sol (approximate)
export const earthDateToSol = (earthDate) => {
  const LANDING_DATE = new Date('2021-02-18T20:55:00Z');
  const earthMilliseconds = earthDate.getTime() - LANDING_DATE.getTime();
  const SOL_TO_EARTH_RATIO = 1.0274912517;
  return Math.floor(earthMilliseconds / (SOL_TO_EARTH_RATIO * 24 * 60 * 60 * 1000));
};

export default {
  MISSION_PHASES,
  MISSION_EVENTS,
  CAMERA_CONFIGS,
  generateRoverPath,
  getEventsForSolRange,
  getMissionPhase,
  solToEarthDate,
  earthDateToSol
};
# Mars Rover Mission Control - Development Guide

## 🚀 Quick Development Setup

### Prerequisites
- **Node.js 16+** ([Download](https://nodejs.org))
- **NASA API Key** ([Get Free Key](https://api.nasa.gov/))

### One-Command Setup
```bash
npm run setup
```

## 🛠️ Development Workflow

### Starting Development Server
```bash
npm start                 # Development server on port 5000
npm run dev              # Alias for npm start
```

### Environment Configuration
1. Copy environment template:
   ```bash
   cp .env.example .env
   ```

2. Add your NASA API key to `.env`:
   ```bash
   REACT_APP_NASA_API_KEY=your_nasa_api_key_here
   ```

3. Optional: Configure feature flags and performance settings in `.env`

### Available Commands

#### Development
- `npm start` - Start development server (port 5000)
- `npm run dev` - Alias for start
- `npm run health-check` - Verify server is running

#### Testing
- `npm test` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run test:ci` - Run tests in CI mode

#### Building & Deployment
- `npm run build` - Create production build
- `npm run serve` - Serve production build locally
- `npm run build:analyze` - Serve build with analysis tools

#### Maintenance
- `npm run setup` - Full project setup
- `npm run clean` - Reset node_modules and reinstall
- `npm run lint` - Code linting (to be configured)
- `npm run format` - Code formatting (to be configured)

## 🏗️ Project Structure

```
src/
├── api/                    # API integration layer
│   ├── roverData.js       # Main NASA API integration
│   ├── nasaApiService.js  # Low-level API service
│   ├── unifiedCacheSystem.js  # Intelligent caching
│   └── performanceMonitor.js  # Performance tracking
├── components/            # React components
│   ├── NASAMarsMap.jsx   # Interactive Mars map
│   ├── NASATelemetryCard.jsx  # Telemetry display
│   ├── NASACameraGallery.jsx  # Camera image gallery
│   └── AdvancedMissionTimeline.jsx  # Mission timeline
├── data/                  # Static data and configurations
├── hooks/                 # Custom React hooks
├── systems/              # System-level components
└── App.js                # Main application component
```

## ⚡ Performance Features

### API Optimizations
- **Unified Caching System** - Hierarchical TTL-based caching
- **Request Deduplication** - Prevents concurrent identical requests
- **Exponential Backoff** - Smart retry logic for failed requests
- **O(1) Calculations** - Mathematical optimizations for distance/route processing

### Rendering Optimizations
- **Canvas Pooling** - Efficient chart rendering with OffscreenCanvas
- **Component Memoization** - React.memo and useMemo optimizations
- **Lazy Loading** - Components and images load as needed

## 🔧 Development Tips

### Environment Variables
All client-side environment variables must use the `REACT_APP_` prefix:
```bash
REACT_APP_NASA_API_KEY=your_key_here
REACT_APP_ENABLE_DEBUG=true
REACT_APP_CACHE_DURATION=5
```

### Local Development Server
- **Host**: 0.0.0.0 (for Replit compatibility)
- **Port**: 5000 (not firewalled in cloud environments)
- **Hot Reload**: Enabled with fast refresh
- **File Watching**: Uses polling for cloud environments

### Cache Management
The application uses an intelligent caching system:
- **Static Data**: 60-minute TTL
- **Semi-static Data**: 30-minute TTL  
- **Dynamic Data**: 5-minute TTL
- **Real-time Data**: 30-second TTL

## 🧪 Testing

### Running Tests
```bash
npm test                 # Interactive test runner
npm run test:coverage    # Generate coverage report
npm run test:ci         # CI-friendly test run
```

### Test Structure
- Unit tests for API functions
- Component rendering tests
- Integration tests for data flow
- Performance benchmarks for optimizations

## 🚀 Production Deployment

### Build Process
```bash
npm run build           # Creates optimized production build
npm run serve          # Test production build locally
```

### Environment Setup
For production deployments, ensure these environment variables are set:
- `REACT_APP_NASA_API_KEY` - Your NASA API key
- `REACT_APP_BUILD_TARGET=production`
- `GENERATE_SOURCEMAP=false`

### Vercel Deployment
1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically from main branch

## 🐛 Troubleshooting

### Common Issues

#### Server Not Starting
```bash
npm run health-check     # Check if server is running
npm run clean           # Reset dependencies
npm run setup           # Reinstall everything
```

#### API Rate Limits
- Check your NASA API key is properly set
- Monitor cache hit rates with performance monitoring
- Consider upgrading NASA API plan for higher limits

#### Performance Issues
- Check browser console for performance warnings
- Use performance monitoring dashboard
- Verify cache system is functioning properly

### Debug Mode
Enable debug logging by setting:
```bash
REACT_APP_ENABLE_DEBUG=true
```

## 📊 Performance Monitoring

The application includes comprehensive performance monitoring:
- API request timing and success rates
- Cache hit/miss ratios
- Component render performance
- Memory usage tracking

Access performance reports through the developer console or performance monitoring dashboard.
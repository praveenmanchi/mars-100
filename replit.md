# Overview

Mars Rover Mission Control is a lightweight, pure frontend NASA data visualization application that provides a professional mission control interface for Mars rover operations. The application integrates real NASA data through client-side API calls to deliver comprehensive telemetry monitoring, interactive Mars surface mapping, mission timeline tracking, and camera systems management. Built as a React single-page application, it offers a streamlined, Python-free architecture with significantly reduced bundle size and dependencies.

**Status**: Successfully configured and running in Replit environment (September 17, 2025)

# Recent Changes

## September 17, 2025 - Replit Environment Setup
- **Dependencies Installed**: All required Node.js packages installed including react-chartjs-2, chart.js, and serve
- **Replit Configuration**: Configured React dev server for Replit proxy with HOST=0.0.0.0, PORT=5000
- **Environment Setup**: Created .env file with DANGEROUSLY_DISABLE_HOST_CHECK=true for Replit compatibility
- **Deployment Config**: Configured autoscale deployment with production build and serve setup
- **Production Build**: Verified successful production build (132.44 kB main bundle)

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 19.0.0 with Create React App foundation
- **UI Components**: Radix UI component library with Tailwind CSS for styling
- **State Management**: React hooks-based state management with custom data caching system
- **Design System**: NASA-themed dark interface using Orbitron and Inter fonts
- **Build System**: Custom CRACO configuration with path aliases and webpack optimizations
- **Responsive Design**: Mobile-first approach with optimized layouts for desktop, tablet, and mobile

## Client-Side Data Architecture
- **NASA API Integration**: Direct client-side integration with NASA Mars Photos API
- **Data Module**: JavaScript-based API module (`src/api/roverData.js`) replaces backend functionality  
- **Caching Strategy**: 5-minute intelligent cache with staleness detection to minimize API calls
- **Mock Data System**: Realistic fallback data generation for development and testing
- **Error Handling**: Graceful degradation when NASA API is unavailable

## Data Management
- **Caching Strategy**: Frontend data cache with 5-minute refresh intervals and staleness detection
- **NASA API Integration**: Direct integration with NASA Mars Photos API using configurable API keys
- **Mock Data System**: Fallback data generation for development and testing environments
- **Real-time Updates**: Polling-based data refresh with intelligent caching to minimize API calls

## Development Workflow
- **Local Development**: Automated setup scripts with dependency management
- **Environment Configuration**: Environment-specific .env files for API keys and URLs
- **Hot Reload**: Configurable hot reload system with performance optimizations
- **Testing**: Comprehensive API testing suite with health check and endpoint validation

## Build and Deployment
- **Production Builds**: Optimized Vercel builds with size optimization and lambda functions
- **Docker Support**: Complete containerization with multi-service orchestration
- **Static Assets**: Efficient bundling and optimization for production deployment
- **Environment Management**: Secure API key handling and environment variable configuration

# External Dependencies

## NASA APIs
- **Mars Photos API**: Primary data source for rover images, telemetry, and mission data
- **API Key Management**: Configurable NASA API key with fallback default key
- **Rate Limiting**: Built-in caching to respect API rate limits and improve performance

## UI and Styling
- **Radix UI**: Comprehensive component library for accessible UI components including dialogs, tooltips, navigation, and form controls
- **Tailwind CSS**: Utility-first CSS framework with custom theme configuration
- **Lucide React**: Icon library for consistent iconography throughout the application
- **Google Fonts**: Orbitron and Inter font families for NASA-themed typography

## Development Tools
- **Axios**: HTTP client for API requests with interceptors and error handling
- **React Hook Form**: Form validation and management with resolver integration
- **React Router DOM**: Client-side routing for single-page application navigation
- **Date-fns**: Date manipulation and formatting utilities

## Build and Development
- **CRACO**: Create React App Configuration Override for custom webpack and development configurations
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer plugins
- **Vercel CLI**: Deployment tooling for serverless function deployment
- **Docker**: Containerization platform for consistent development and deployment environments

## Backend Dependencies
- **HTTPX**: Modern async HTTP client for NASA API integration
- **Pydantic**: Data validation and serialization with type hints
- **Python-dotenv**: Environment variable management for secure configuration
- **Motor**: Async MongoDB driver (optional, currently unused but configured)
- **Uvicorn**: ASGI server for FastAPI application serving

## Deployment Platforms
- **Vercel**: Primary deployment platform with serverless functions and static site hosting
- **Docker Compose**: Local development orchestration for multi-service applications
- **GitHub**: Source code management and integration with deployment pipelines
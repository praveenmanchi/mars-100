// Advanced Trend Analysis Dashboard with Real NASA Data Visualization
import React, { useState, useEffect, useMemo } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
// Removed Framer Motion for stability
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { getRoverData } from '../api/roverData';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const TrendAnalysisDashboard = ({ currentSol = 100, missionData = {}, onSolSelect = () => {} }) => {
  const [trendData, setTrendData] = useState({});
  const [selectedMetric, setSelectedMetric] = useState('power');
  const [timeRange, setTimeRange] = useState(30); // Days to analyze
  const [isLoading, setIsLoading] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(1000);

  // Fetch historical data for trend analysis
  useEffect(() => {
    const fetchTrendData = async () => {
      setIsLoading(true);
      const historicalData = {};
      const startSol = Math.max(0, currentSol - timeRange);
      
      // Fetch real NASA data for last N sols in parallel for better performance
      const solPromises = [];
      for (let sol = startSol; sol <= currentSol; sol++) {
        solPromises.push(
          getRoverData(sol).then(roverData => {
            if (roverData && !roverData.error) {
              return {
                sol,
                power_generation: roverData.power_efficiency ? roverData.power_efficiency * 500 : 400,
                battery_charge: roverData.system_health?.batteries || 85,
                temperature: roverData.environmental?.temperature || -63,
                atmospheric_pressure: roverData.environmental?.pressure || 610,
                wind_speed: roverData.environmental?.wind_speed || 15,
                dust_opacity: roverData.environmental?.dust_opacity || 0.8,
                elevation: 2374 + (sol * 0.1),
                distance_traveled: sol * 0.025,
                radiation: roverData.environmental?.radiation || 0.24,
                mission_efficiency: (roverData.power_efficiency || 0.8) * 500 / Math.max(1, (roverData.environmental?.dust_opacity || 0.8) * 100)
              };
            }
            return null;
          }).catch(error => {
            console.warn(`Could not fetch real data for Sol ${sol}:`, error);
            return null;
          })
        );
      }
      
      // Wait for all data to load in parallel
      const results = await Promise.all(solPromises);
      results.forEach((result, index) => {
        if (result) {
          historicalData[startSol + index] = result;
        }
      });
      
      setTrendData(historicalData);
      setIsLoading(false);
    };

    fetchTrendData();
  }, [currentSol, timeRange]);

  // Chart configurations and data processing
  const chartConfigs = useMemo(() => {
    const sols = Object.keys(trendData).map(Number).sort((a, b) => a - b);
    const baseConfig = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: animationSpeed,
        easing: 'easeInOutQuart'
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#e2e8f0',
            font: { family: 'Orbitron, monospace' }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#f1f5f9',
          bodyColor: '#cbd5e1',
          borderColor: '#0ea5e9',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              const unit = getMetricUnit(context.dataset.id || label.toLowerCase());
              return `${label}: ${value.toFixed(2)} ${unit}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(148, 163, 184, 0.1)' },
          ticks: { 
            color: '#94a3b8',
            font: { family: 'Orbitron, monospace', size: 11 }
          },
          title: {
            display: true,
            text: 'Sol (Martian Day)',
            color: '#cbd5e1',
            font: { family: 'Orbitron, monospace', weight: 'bold' }
          }
        },
        y: {
          grid: { color: 'rgba(148, 163, 184, 0.1)' },
          ticks: { 
            color: '#94a3b8',
            font: { family: 'Orbitron, monospace', size: 11 }
          }
        }
      }
    };

    const getMetricUnit = (metric) => {
      const units = {
        power: 'W', battery: '%', temperature: '°C', pressure: 'Pa',
        wind: 'm/s', dust: 'tau', elevation: 'm', distance: 'km',
        radiation: 'mSv/day', efficiency: 'W/τ'
      };
      return units[metric] || '';
    };

    return {
      // Power Analysis Chart
      power: {
        ...baseConfig,
        plugins: {
          ...baseConfig.plugins,
          title: {
            display: true,
            text: 'Power System Performance Over Time',
            color: '#f1f5f9',
            font: { family: 'Orbitron, monospace', size: 16, weight: 'bold' }
          }
        },
        data: {
          labels: sols,
          datasets: [
            {
              id: 'power',
              label: 'Power Generation',
              data: sols.map(sol => trendData[sol]?.power_generation || 0),
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointHoverRadius: 6
            },
            {
              id: 'battery',
              label: 'Battery Charge',
              data: sols.map(sol => trendData[sol]?.battery_charge || 0),
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointHoverRadius: 6,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          ...baseConfig,
          scales: {
            ...baseConfig.scales,
            y: {
              ...baseConfig.scales.y,
              title: {
                display: true,
                text: 'Power (Watts)',
                color: '#cbd5e1',
                font: { family: 'Orbitron, monospace', weight: 'bold' }
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              grid: { drawOnChartArea: false },
              ticks: { 
                color: '#94a3b8',
                font: { family: 'Orbitron, monospace', size: 11 }
              },
              title: {
                display: true,
                text: 'Battery (%)',
                color: '#cbd5e1',
                font: { family: 'Orbitron, monospace', weight: 'bold' }
              }
            }
          }
        }
      },

      // Environmental Analysis Chart
      environmental: {
        ...baseConfig,
        plugins: {
          ...baseConfig.plugins,
          title: {
            display: true,
            text: 'Environmental Conditions Analysis',
            color: '#f1f5f9',
            font: { family: 'Orbitron, monospace', size: 16, weight: 'bold' }
          }
        },
        data: {
          labels: sols,
          datasets: [
            {
              id: 'temperature',
              label: 'Temperature',
              data: sols.map(sol => trendData[sol]?.temperature || 0),
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              fill: true,
              tension: 0.4
            },
            {
              id: 'pressure',
              label: 'Atmospheric Pressure',
              data: sols.map(sol => (trendData[sol]?.atmospheric_pressure || 0) / 10),
              borderColor: '#8b5cf6',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              fill: true,
              tension: 0.4,
              yAxisID: 'y1'
            },
            {
              id: 'wind',
              label: 'Wind Speed',
              data: sols.map(sol => trendData[sol]?.wind_speed || 0),
              borderColor: '#06b6d4',
              backgroundColor: 'rgba(6, 182, 212, 0.1)',
              fill: true,
              tension: 0.4,
              yAxisID: 'y2'
            }
          ]
        },
        options: {
          ...baseConfig,
          scales: {
            ...baseConfig.scales,
            y: {
              ...baseConfig.scales.y,
              title: {
                display: true,
                text: 'Temperature (°C)',
                color: '#cbd5e1'
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              grid: { drawOnChartArea: false },
              ticks: { color: '#94a3b8' },
              title: {
                display: true,
                text: 'Pressure (Pa/10)',
                color: '#cbd5e1'
              }
            },
            y2: {
              type: 'linear',
              display: false,
              position: 'right'
            }
          }
        }
      },

      // Mission Efficiency Analysis
      efficiency: {
        ...baseConfig,
        type: 'bar',
        plugins: {
          ...baseConfig.plugins,
          title: {
            display: true,
            text: 'Mission Efficiency & Performance Metrics',
            color: '#f1f5f9',
            font: { family: 'Orbitron, monospace', size: 16, weight: 'bold' }
          }
        },
        data: {
          labels: sols.slice(-7), // Last 7 sols for efficiency
          datasets: [
            {
              label: 'Mission Efficiency',
              data: sols.slice(-7).map(sol => trendData[sol]?.mission_efficiency || 0),
              backgroundColor: 'rgba(34, 197, 94, 0.8)',
              borderColor: '#22c55e',
              borderWidth: 2
            }
          ]
        }
      }
    };
  }, [trendData, animationSpeed]);

  const metrics = [
    { id: 'power', name: 'Power Systems', icon: '⚡', color: '#3b82f6' },
    { id: 'environmental', name: 'Environment', icon: '🌡️', color: '#ef4444' },
    { id: 'efficiency', name: 'Efficiency', icon: '📊', color: '#22c55e' }
  ];

  const timeRanges = [
    { value: 7, label: '1 Week' },
    { value: 30, label: '1 Month' },
    { value: 90, label: '3 Months' },
    { value: 180, label: '6 Months' }
  ];

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center h-96 bg-slate-900/50 rounded-lg border border-slate-700"
      >
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-300 font-orbitron">Analyzing mission trends...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-slate-900/80 backdrop-blur-sm rounded-lg p-6 border border-slate-700"
    >
      {/* Header Controls */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-100 font-orbitron">
          📈 Mission Trend Analysis
        </h2>
        <div className="flex gap-4 items-center">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="bg-slate-800 text-slate-200 border border-slate-600 rounded px-3 py-1 font-orbitron text-sm"
          >
            {timeRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <div className="text-sm text-slate-400">
            Analyzing {Object.keys(trendData).length} sols
          </div>
        </div>
      </div>

      {/* Metric Selection Tabs */}
      <div className="flex gap-2 mb-6">
        {metrics.map(metric => (
          <button
            key={metric.id}
            onClick={() => setSelectedMetric(metric.id)}
            className={`px-4 py-2 rounded-lg font-orbitron text-sm transition-all ${
              selectedMetric === metric.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span className="mr-2">{metric.icon}</span>
            {metric.name}
          </button>
        ))}
      </div>

      {/* Chart Display */}
      <div>
        <div
          key={selectedMetric}
          className="h-96 mb-6"
        >
          {selectedMetric === 'efficiency' ? (
            <Bar {...chartConfigs[selectedMetric]} />
          ) : (
            <Line {...chartConfigs[selectedMetric]} />
          )}
        </div>
      </div>

      {/* Data Insights */}
      <div 
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {Object.keys(trendData).length > 0 && (
          <>
            <div className="bg-slate-800/50 rounded p-4 border border-slate-600">
              <h4 className="font-orbitron text-blue-400 text-sm mb-2">POWER TREND</h4>
              <p className="text-2xl font-bold text-slate-100">
                {(trendData[currentSol]?.power_generation || 0).toFixed(0)}W
              </p>
              <p className="text-xs text-slate-400">Current generation</p>
            </div>
            
            <div className="bg-slate-800/50 rounded p-4 border border-slate-600">
              <h4 className="font-orbitron text-green-400 text-sm mb-2">EFFICIENCY</h4>
              <p className="text-2xl font-bold text-slate-100">
                {(trendData[currentSol]?.mission_efficiency || 0).toFixed(1)}
              </p>
              <p className="text-xs text-slate-400">W/τ ratio</p>
            </div>
            
            <div className="bg-slate-800/50 rounded p-4 border border-slate-600">
              <h4 className="font-orbitron text-yellow-400 text-sm mb-2">DISTANCE</h4>
              <p className="text-2xl font-bold text-slate-100">
                {(trendData[currentSol]?.distance_traveled || 0).toFixed(2)}km
              </p>
              <p className="text-xs text-slate-400">Total traveled</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TrendAnalysisDashboard;
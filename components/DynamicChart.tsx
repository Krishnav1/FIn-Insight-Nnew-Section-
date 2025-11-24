
import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3, LineChart as LineChartIcon, AreaChart as AreaChartIcon, Clock } from 'lucide-react';
import { ChartData } from '../types';

interface DynamicChartProps {
  data: any; // Accepting 'any' to handle variable AI output formats before normalization
}

const generateMockHistory = (timeframe: string, seedStr: string) => {
    const seed = seedStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    let count = 20;
    let volatility = 0.02;
    let trend = 0.005; // Slight upward bias usually
    let intervalLabel = '';
    
    switch(timeframe) {
        case '1D': count = 24; volatility = 0.005; intervalLabel = 'h'; break;
        case '1W': count = 7; volatility = 0.01; intervalLabel = 'd'; break;
        case '1M': count = 30; volatility = 0.015; intervalLabel = 'd'; break;
        case '1Y': count = 12; volatility = 0.05; trend = 0.02; intervalLabel = 'mo'; break;
        case '5Y': count = 60; volatility = 0.08; trend = 0.05; intervalLabel = 'mo'; break;
        case 'MAX': count = 100; volatility = 0.10; trend = 0.10; intervalLabel = 'y'; break;
        default: count = 20;
    }

    const data = [];
    const labels = [];
    // Determine starting price pseudo-randomly from seed
    let val = 1000 + (seed % 2000);
    
    for(let i = 0; i < count; i++) {
        // Random walk with trend
        const randomShock = Math.sin(i * 0.5 + seed) * volatility + (Math.cos(i * 0.2 + seed) * volatility * 0.5);
        val = val * (1 + randomShock + (trend / count));
        if (val < 0) val = 10; // floor
        
        data.push(parseFloat(val.toFixed(2)));
        labels.push(`${i+1}${intervalLabel}`);
    }
    return { data, labels };
};

const DynamicChart: React.FC<DynamicChartProps> = ({ data }) => {
  const [activeTimeframe, setActiveTimeframe] = useState<string | null>(null);
  const [displayData, setDisplayData] = useState<ChartData | null>(null);

  // Normalize Data: Convert AI's "Simple Format" (data: [{label, value}]) to "Strict Format" (labels, datasets)
  const normalizedData = useMemo((): ChartData | null => {
      if (!data) return null;

      // 1. Strict Format (Already matches ChartData interface)
      if (data.labels && data.datasets && Array.isArray(data.datasets)) {
          // Validation: Ensure datasets are not empty
          if (data.datasets.length === 0) return null;
          return data as ChartData;
      }

      // 2. AI "Simple" Format (Array of objects with label/value/color)
      // Example: { data: [{label: "Rev", value: 10}, {label: "Profit", value: 5}] }
      if (Array.isArray(data.data) && data.data.length > 0) {
          const firstItem = data.data[0];
          // Check if items have label/name and value
          if ((firstItem.label || firstItem.name) && firstItem.value !== undefined) {
              const labels = data.data.map((d: any) => d.label || d.name || '');
              const values = data.data.map((d: any) => typeof d.value === 'number' ? d.value : 0);
              
              return {
                  title: data.title || "Financial Analysis",
                  type: data.type || 'bar',
                  labels: labels,
                  datasets: [{
                      label: "Value",
                      data: values,
                  }]
              };
          }
      }

      return null;
  }, [data]);

  // Reset state when prop data changes
  useEffect(() => {
      if (normalizedData) {
          setDisplayData(normalizedData);
          // If it's explicitly marked Intraday, default to 1D, else don't force a selection unless user clicks
          if (normalizedData.title.includes("Intraday")) {
              setActiveTimeframe('1D');
          } else {
              setActiveTimeframe(null); 
          }
      }
  }, [normalizedData]);

  const handleTimeframeChange = (tf: string) => {
      if (!normalizedData) return;
      setActiveTimeframe(tf);
      
      // Generate mock history
      const { data: newData, labels: newLabels } = generateMockHistory(tf, normalizedData.title);
      
      setDisplayData({
          ...normalizedData,
          labels: newLabels,
          datasets: [{
              label: "Price", // Assuming price for time series
              data: newData
          }]
      });
  };

  if (!displayData || !displayData.datasets || displayData.datasets.length === 0 || !displayData.labels) return null;

  const { title, type, labels, datasets } = displayData;

  // Transform for Recharts
  const chartData = labels.map((label, index) => {
    const dataPoint: any = { name: label };
    datasets.forEach(dataset => {
      // Safe access
      if (dataset && dataset.data && dataset.data[index] !== undefined) {
          dataPoint[dataset.label] = dataset.data[index];
      } else {
          dataPoint[dataset.label] = 0;
      }
    });
    return dataPoint;
  });

  // Professional Financial Palette
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#6366f1"];
  const isTimeSeries = type === 'line' || type === 'area';
  const timeframes = ['1D', '1W', '1M', '1Y', '5Y', 'MAX'];

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.2} vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="#4b5563" tickLine={false} axisLine={{ stroke: '#4b5563', strokeOpacity: 0.5 }} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="#4b5563" tickLine={false} axisLine={false} />
            <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.95)', borderRadius: '8px', border: '1px solid rgba(75, 85, 99, 0.4)', color: '#f3f4f6', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ color: '#e5e7eb', fontSize: '12px' }}
                cursor={{ stroke: '#6b7280', strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', opacity: 0.8 }} />
            {datasets.map((ds, i) => (
              <Line 
                key={ds.label} 
                type="monotone" 
                dataKey={ds.label} 
                stroke={colors[i % colors.length]} 
                strokeWidth={3} 
                dot={activeTimeframe ? false : { r: 4, fill: colors[i % colors.length], strokeWidth: 2, stroke: '#1f2937' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        );
      case 'area':
        return (
           <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.2} vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="#4b5563" tickLine={false} axisLine={{ stroke: '#4b5563', strokeOpacity: 0.5 }} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="#4b5563" tickLine={false} axisLine={false} />
            <Tooltip 
                 contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.95)', borderRadius: '8px', border: '1px solid rgba(75, 85, 99, 0.4)', color: '#f3f4f6' }}
                 itemStyle={{ color: '#e5e7eb', fontSize: '12px' }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', opacity: 0.8 }} />
            {datasets.map((ds, i) => (
              <Area 
                key={ds.label} 
                type="monotone" 
                dataKey={ds.label} 
                stroke={colors[i % colors.length]} 
                fill={colors[i % colors.length]} 
                fillOpacity={0.15}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        );
      case 'bar':
      default:
        return (
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.2} vertical={false} />
            <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10, fill: '#9ca3af' }} 
                axisLine={{ stroke: '#4b5563', strokeOpacity: 0.5 }}
                tickLine={false}
            />
            <YAxis 
                tick={{ fontSize: 10, fill: '#9ca3af' }} 
                axisLine={false} 
                tickLine={false}
            />
            <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.95)', borderRadius: '8px', border: '1px solid rgba(75, 85, 99, 0.4)', color: '#f3f4f6', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ color: '#e5e7eb', fontSize: '12px' }}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', opacity: 0.8 }} />
            {datasets.map((ds, i) => (
              <Bar 
                key={ds.label} 
                dataKey={ds.label} 
                fill={colors[i % colors.length]} 
                radius={[4, 4, 0, 0]} 
                barSize={datasets.length > 1 ? 20 : 40} // Thinner bars if comparing multiple datasets
              >
                {/* If only 1 dataset (Simple Mode), use varied colors for better aesthetics */}
                {datasets.length === 1 && chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            ))}
          </BarChart>
        );
    }
  };

  return (
    <div className="w-full mt-4 mb-6 bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-sm p-4 animate-fade-in group hover:border-blue-200 dark:hover:border-blue-900/50 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-gray-100 dark:border-gray-700/50 pb-2">
        <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
            {type === 'line' ? <LineChartIcon size={16}/> : type === 'area' ? <AreaChartIcon size={16}/> : <BarChart3 size={16}/>}
            </div>
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
            {title || "Visual Analysis"}
            </h4>
        </div>
        
        {/* Timeframe Controls - Only for Line/Area Charts */}
        {isTimeSeries && (
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-900/50 rounded-lg p-0.5">
                {timeframes.map(tf => (
                    <button
                        key={tf}
                        onClick={() => handleTimeframeChange(tf)}
                        className={`px-2 py-1 text-[9px] font-bold rounded transition-all ${
                            activeTimeframe === tf 
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                        }`}
                    >
                        {tf}
                    </button>
                ))}
            </div>
        )}
      </div>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DynamicChart;

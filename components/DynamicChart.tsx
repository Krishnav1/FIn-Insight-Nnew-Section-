
import React, { useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, LineChart as LineChartIcon, AreaChart as AreaChartIcon } from 'lucide-react';
import { ChartData } from '../types';

interface DynamicChartProps {
  data: any; // Accepting 'any' to handle variable AI output formats before normalization
}

const DynamicChart: React.FC<DynamicChartProps> = ({ data }) => {
  
  // Normalize Data: Convert AI's "Simple Format" (data: [{label, value}]) to "Strict Format" (labels, datasets)
  const normalizedData = useMemo((): ChartData | null => {
      if (!data) return null;

      // 1. Strict Format (Already matches ChartData interface)
      if (data.labels && data.datasets) {
          return data as ChartData;
      }

      // 2. AI "Simple" Format (Array of objects with label/value/color)
      // Example: { data: [{label: "Rev", value: 10}, {label: "Profit", value: 5}] }
      if (Array.isArray(data.data) && data.data.length > 0) {
          const firstItem = data.data[0];
          // Check if items have label/name and value
          if ((firstItem.label || firstItem.name) && firstItem.value !== undefined) {
              const labels = data.data.map((d: any) => d.label || d.name);
              const values = data.data.map((d: any) => d.value);
              const colors = data.data.map((d: any) => d.color); // Capture colors if present

              return {
                  title: data.title || "Financial Chart",
                  type: data.type || 'bar',
                  labels: labels,
                  datasets: [{
                      label: "Value",
                      data: values,
                      // We can't easily pass per-bar colors to datasets in this simple structure without custom shapes,
                      // but the render logic below handles the color palette.
                  }]
              };
          }
      }

      return null;
  }, [data]);

  if (!normalizedData || !normalizedData.datasets || !normalizedData.labels) return null;

  const { title, type, labels, datasets } = normalizedData;

  // Transform for Recharts
  const chartData = labels.map((label, index) => {
    const dataPoint: any = { name: label };
    datasets.forEach(dataset => {
      dataPoint[dataset.label] = dataset.data[index];
    });
    return dataPoint;
  });

  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="#4b5563" />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="#4b5563" />
            <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: '1px solid #374151', color: '#f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#e5e7eb' }}
                cursor={{ stroke: '#6b7280', strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            {datasets.map((ds, i) => (
              <Line 
                key={ds.label} 
                type="monotone" 
                dataKey={ds.label} 
                stroke={colors[i % colors.length]} 
                strokeWidth={3} 
                dot={{ r: 4, fill: colors[i % colors.length], strokeWidth: 2, stroke: '#1f2937' }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );
      case 'area':
        return (
           <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="#4b5563" />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="#4b5563" />
            <Tooltip 
                 contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: '1px solid #374151', color: '#f3f4f6' }}
                 itemStyle={{ color: '#e5e7eb' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            {datasets.map((ds, i) => (
              <Area 
                key={ds.label} 
                type="monotone" 
                dataKey={ds.label} 
                stroke={colors[i % colors.length]} 
                fill={colors[i % colors.length]} 
                fillOpacity={0.2}
              />
            ))}
          </AreaChart>
        );
      case 'bar':
      default:
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} vertical={false} />
            <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10, fill: '#9ca3af' }} 
                axisLine={false} 
                tickLine={false}
            />
            <YAxis 
                tick={{ fontSize: 10, fill: '#9ca3af' }} 
                axisLine={false} 
                tickLine={false}
            />
            <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: '1px solid #374151', color: '#f3f4f6' }}
                itemStyle={{ color: '#e5e7eb' }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            {datasets.map((ds, i) => (
              <Bar 
                key={ds.label} 
                dataKey={ds.label} 
                fill={colors[i % colors.length]} 
                radius={[4, 4, 0, 0]} 
                barSize={40}
              />
            ))}
          </BarChart>
        );
    }
  };

  return (
    <div className="w-full mt-4 mb-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 animate-fade-in hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-blue-50 dark:bg-gray-700 rounded-lg text-blue-600 dark:text-blue-400">
           {type === 'line' ? <LineChartIcon size={16}/> : type === 'area' ? <AreaChartIcon size={16}/> : <BarChart3 size={16}/>}
        </div>
        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
          {title || "Visual Analysis"}
        </h4>
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

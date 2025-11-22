
import React from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, LineChart as LineChartIcon, AreaChart as AreaChartIcon } from 'lucide-react';
import { ChartData } from '../types';

interface DynamicChartProps {
  data: ChartData;
}

const DynamicChart: React.FC<DynamicChartProps> = ({ data }) => {
  if (!data || !data.datasets || !data.labels) return null;

  // Transform data for Recharts
  const chartData = data.labels.map((label, index) => {
    const dataPoint: any = { name: label };
    data.datasets.forEach(dataset => {
      dataPoint[dataset.label] = dataset.data[index];
    });
    return dataPoint;
  });

  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const renderChart = () => {
    switch (data.type) {
      case 'line':
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            {data.datasets.map((ds, i) => (
              <Line 
                key={ds.label} 
                type="monotone" 
                dataKey={ds.label} 
                stroke={colors[i % colors.length]} 
                strokeWidth={3} 
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );
      case 'area':
        return (
           <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            {data.datasets.map((ds, i) => (
              <Area 
                key={ds.label} 
                type="monotone" 
                dataKey={ds.label} 
                stroke={colors[i % colors.length]} 
                fill={colors[i % colors.length]} 
                fillOpacity={0.3}
              />
            ))}
          </AreaChart>
        );
      case 'bar':
      default:
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            {data.datasets.map((ds, i) => (
              <Bar 
                key={ds.label} 
                dataKey={ds.label} 
                fill={colors[i % colors.length]} 
                radius={[4, 4, 0, 0]} 
              />
            ))}
          </BarChart>
        );
    }
  };

  return (
    <div className="w-full mt-4 mb-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
           {data.type === 'line' ? <LineChartIcon size={16}/> : data.type === 'area' ? <AreaChartIcon size={16}/> : <BarChart3 size={16}/>}
        </div>
        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
          {data.title || "Visual Analysis"}
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

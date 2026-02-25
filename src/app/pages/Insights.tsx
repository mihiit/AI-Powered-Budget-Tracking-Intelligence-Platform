import { Lightbulb, TrendingUp, AlertTriangle, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { mockInsights } from '../lib/mock/data';
import { formatCurrency } from '../lib/utils/formatters';
import type { Insight } from '../lib/types';

export function Insights() {
  const [insights, setInsights] = useState(mockInsights);

  const handleDismiss = (id: string) => {
    setInsights(insights.filter(i => i.id !== id));
  };

  const getInsightIcon = (type: string, severity?: string) => {
    if (type === 'anomaly') return AlertTriangle;
    if (type === 'forecast') return TrendingUp;
    return Lightbulb;
  };

  const getInsightColor = (severity?: string) => {
    switch (severity) {
      case 'high':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'moderate':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'low':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800';
    }
  };

  // Mock forecast data
  const forecastData = [
    { month: 'Feb', actual: 4200, projected: 4200 },
    { month: 'Mar', actual: null, projected: 3950 },
    { month: 'Apr', actual: null, projected: 4100 },
    { month: 'May', actual: null, projected: 4300 },
    { month: 'Jun', actual: null, projected: 4500 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          AI Insights
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Behavioral patterns, forecasts, and personalized recommendations
        </p>
      </div>

      {/* Cash Flow Forecast */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            6-Month Balance Forecast
          </h3>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis 
              dataKey="month" 
              stroke="#6B7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6B7280"
              fontSize={12}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: number) => [`$${value}`, '']}
            />
            <Line 
              type="monotone" 
              dataKey="actual" 
              stroke="hsl(210, 100%, 56%)" 
              strokeWidth={3}
              dot={{ fill: 'hsl(210, 100%, 56%)', r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="projected" 
              stroke="hsl(270, 70%, 60%)" 
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={{ fill: 'hsl(270, 70%, 60%)', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs text-blue-900 dark:text-blue-300">
            <strong>AI Analysis:</strong> Based on your current spending patterns, you're projected to save $4,500 by June. This assumes no major changes to your spending habits.
          </p>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Personalized Insights
        </h3>

        {insights.map((insight) => {
          const Icon = getInsightIcon(insight.type, insight.insight.severity);
          const colorClass = getInsightColor(insight.insight.severity);

          return (
            <div 
              key={insight.id} 
              className={`rounded-xl p-6 border-2 ${colorClass}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 rounded-lg bg-white dark:bg-gray-700">
                    <Icon className="w-6 h-6 text-gray-900 dark:text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {insight.insight.recommendation?.title || 'Insight Detected'}
                      </h4>
                      {insight.insight.severity && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          insight.insight.severity === 'high' ? 'bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-200' :
                          insight.insight.severity === 'moderate' ? 'bg-orange-200 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200' :
                          'bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'
                        }`}>
                          {insight.insight.severity}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {insight.insight.recommendation?.description}
                    </p>

                    {/* Data Display */}
                    {insight.type === 'behavioral' && insight.insight.data && (
                      <div className="grid grid-cols-2 gap-3 p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Weekend Avg</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(insight.insight.data.weekendAvg)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Weekday Avg</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(insight.insight.data.weekdayAvg)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Estimated Savings */}
                    {insight.insight.recommendation?.estimatedSavings && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-sm text-green-900 dark:text-green-300">
                          💰 Potential savings: <strong>{formatCurrency(insight.insight.recommendation.estimatedSavings)}/month</strong>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDismiss(insight.id)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors ml-4"
                  title="Dismiss insight"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {insights.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
          <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No active insights at the moment. Keep tracking your expenses!
          </p>
        </div>
      )}
    </div>
  );
}

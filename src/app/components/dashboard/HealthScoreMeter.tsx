import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import type { HealthScore } from '../../lib/types';
import { getHealthScoreColor } from '../../lib/utils/formatters';

interface HealthScoreMeterProps {
  healthScore: HealthScore;
}

export function HealthScoreMeter({ healthScore }: HealthScoreMeterProps) {
  const { score, grade, breakdown } = healthScore;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  const color = getHealthScoreColor(score);

  const breakdownItems = [
    { label: 'Savings Ratio', key: 'savingsRatio', weight: '30%' },
    { label: 'Budget Adherence', key: 'budgetAdherence', weight: '20%' },
    { label: 'Spending Volatility', key: 'spendingVolatility', weight: '20%' },
    { label: 'Income Consistency', key: 'incomeConsistency', weight: '15%' },
    { label: 'Emergency Buffer', key: 'emergencyBuffer', weight: '15%' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Financial Health Score
        </h3>
      </div>

      {/* Score Circle */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative">
          <svg width="160" height="160" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Progress circle */}
            <circle
              cx="80"
              cy="80"
              r="45"
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold" style={{ color }}>
              {score.toFixed(1)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">/ 100</div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
            style={{ backgroundColor: `${color}20`, color }}
          >
            <span className="text-2xl font-bold">{grade.grade}</span>
            <span>{grade.status}</span>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Score Breakdown
        </p>
        {breakdownItems.map((item) => {
          const data = breakdown[item.key as keyof typeof breakdown];
          const itemScore = data.score;
          const isGood = itemScore >= 70;
          
          return (
            <div key={item.key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {itemScore.toFixed(0)}
                  </span>
                  {isGood ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${itemScore}%`,
                    backgroundColor: isGood ? 'hsl(120, 100%, 35%)' : 'hsl(0, 84%, 60%)'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-xs text-blue-900 dark:text-blue-300">
          <strong>AI Explanation:</strong> Your score is calculated using 5 weighted factors. Focus on improving Emergency Buffer (+15 points potential) for the biggest impact.
        </p>
      </div>
    </div>
  );
}

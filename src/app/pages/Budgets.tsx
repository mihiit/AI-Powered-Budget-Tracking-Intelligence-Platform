import { Wallet, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { mockBudget } from '../lib/mock/data';
import { formatCurrency, getCategoryColor } from '../lib/utils/formatters';

export function Budgets() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on_track':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'exceeded':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track':
        return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300';
      case 'warning':
        return 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300';
      case 'exceeded':
        return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Budgets
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track and manage your monthly budget
        </p>
      </div>

      {/* Overall Budget Summary */}
      <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Wallet className="w-6 h-6" />
          <h2 className="text-xl font-semibold">Monthly Budget</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div>
            <p className="text-purple-100 text-sm mb-1">Budgeted</p>
            <p className="text-2xl font-bold">{formatCurrency(mockBudget.totalBudgeted)}</p>
          </div>
          <div>
            <p className="text-purple-100 text-sm mb-1">Spent</p>
            <p className="text-2xl font-bold">{formatCurrency(mockBudget.totalSpent)}</p>
          </div>
          <div>
            <p className="text-purple-100 text-sm mb-1">Remaining</p>
            <p className="text-2xl font-bold">{formatCurrency(mockBudget.remaining)}</p>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Overall Progress</span>
            <span>{((mockBudget.totalSpent / mockBudget.totalBudgeted) * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <div 
              className="bg-white rounded-full h-3 transition-all duration-500"
              style={{ width: `${Math.min(100, (mockBudget.totalSpent / mockBudget.totalBudgeted) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Budgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mockBudget.categories.map((cat) => {
          const categoryColor = getCategoryColor(cat.category);
          
          return (
            <div key={cat.category} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${categoryColor}20` }}
                  >
                    {getStatusIcon(cat.status)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {cat.category}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(cat.spent)} of {formatCurrency(cat.budgeted)}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(cat.status)}`}>
                  {cat.status.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {cat.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(100, cat.percentage)}%`,
                      backgroundColor: cat.status === 'exceeded' ? 'hsl(0, 84%, 60%)' : 
                                       cat.status === 'warning' ? 'hsl(25, 95%, 53%)' : 
                                       'hsl(120, 100%, 35%)'
                    }}
                  />
                </div>
              </div>

              {cat.forecast && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-900 dark:text-blue-300">
                    <strong>AI Forecast:</strong> Projected end-of-month: {formatCurrency(cat.forecast.projectedEndOfMonth)}
                    {cat.forecast.overshootProbability > 0.3 && (
                      <span className="block mt-1">
                        ⚠️ {(cat.forecast.overshootProbability * 100).toFixed(0)}% chance of exceeding budget
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

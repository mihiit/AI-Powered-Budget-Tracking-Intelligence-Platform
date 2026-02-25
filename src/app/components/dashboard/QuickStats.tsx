import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';
import { formatCurrency } from '../../lib/utils/formatters';

interface QuickStatsProps {
  stats: {
    netWorth: number;
    totalIncome: number;
    totalExpense: number;
  };
}

export function QuickStats({ stats }: QuickStatsProps) {
  const savingsRate = stats.totalIncome > 0 
    ? ((stats.netWorth / stats.totalIncome) * 100).toFixed(1)
    : '0.0';

  const items = [
    {
      label: 'Net Worth',
      value: stats.netWorth,
      icon: Wallet,
      color: stats.netWorth >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: stats.netWorth >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20',
    },
    {
      label: 'Total Income',
      value: stats.totalIncome,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Total Expense',
      value: stats.totalExpense,
      icon: TrendingDown,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      label: 'Savings Rate',
      value: `${savingsRate}%`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      isPercentage: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${item.bgColor} transition-transform duration-300`}>
                <Icon className={`w-6 h-6 ${item.color}`} />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {item.label}
              </p>
              <p className={`text-2xl font-bold ${item.color}`}>
                {item.isPercentage ? item.value : formatCurrency(typeof item.value === 'number' ? item.value : 0)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

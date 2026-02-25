import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../lib/utils/formatters';

interface NetWorthCardProps {
  currentBalance: number;
  income: number;
  expense: number;
}

export function NetWorthCard({ currentBalance, income, expense }: NetWorthCardProps) {
  const isPositive = currentBalance >= 0;

  return (
    <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-xl p-8 text-white shadow-2xl border border-blue-400/30 hover:shadow-3xl transition-all duration-300 transform hover:scale-102 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full -ml-20 -mb-20 blur-3xl"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-blue-100 text-sm mb-2">Current Balance</p>
            <h2 className="text-4xl font-bold">{formatCurrency(currentBalance)}</h2>
          </div>
          <div className={`p-3 rounded-lg ${isPositive ? 'bg-white/20' : 'bg-red-500/30'} backdrop-blur-sm transition-transform duration-300`}>
            {isPositive ? (
              <TrendingUp className="w-6 h-6 animate-bounce" />
            ) : (
              <TrendingDown className="w-6 h-6" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
          <div className="hover:bg-white/5 p-3 rounded-lg transition-all duration-200">
            <p className="text-blue-100 text-sm mb-1">Income</p>
            <p className="text-xl font-semibold">+{formatCurrency(income)}</p>
          </div>
          <div className="hover:bg-white/5 p-3 rounded-lg transition-all duration-200">
            <p className="text-blue-100 text-sm mb-1">Expenses</p>
            <p className="text-xl font-semibold">-{formatCurrency(expense)}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-sm text-blue-100">
            {isPositive ? (
              <>You're saving <span className="font-semibold">{((currentBalance / income) * 100).toFixed(1)}%</span> of your income this month 🎉</>
            ) : (
              <>You're spending <span className="font-semibold">{((Math.abs(currentBalance) / income) * 100).toFixed(1)}%</span> more than your income ⚠️</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { Transaction } from '../../lib/types';
import { formatCurrency, formatDate, getCategoryColor } from '../../lib/utils/formatters';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Transactions
        </h3>
        <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          View All
        </button>
      </div>

      <div className="space-y-3">
        {transactions.map((txn) => {
          const isIncome = txn.type === 'income';
          const categoryColor = getCategoryColor(txn.category);

          return (
            <div 
              key={txn.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${categoryColor}20` }}
                >
                  {isIncome ? (
                    <ArrowUpRight className="w-5 h-5" style={{ color: categoryColor }} />
                  ) : (
                    <ArrowDownRight className="w-5 h-5" style={{ color: categoryColor }} />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {txn.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {txn.category}
                    </span>
                    {txn.mlMetadata.isAnomalous && (
                      <span className="text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full">
                        Unusual
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className={`font-semibold ${isIncome ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                  {isIncome ? '+' : '-'}{formatCurrency(Math.abs(txn.amount))}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatDate(txn.date, 'relative')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

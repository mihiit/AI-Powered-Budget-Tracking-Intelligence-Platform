import { ArrowUpRight, ArrowDownRight, AlertCircle, Sparkles } from 'lucide-react';
import type { Transaction } from '../../lib/types';
import { formatCurrency, formatDate, getCategoryColor } from '../../lib/utils/formatters';

interface TransactionListProps {
  transactions: Transaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
        <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
      </div>
    );
  }

  // Group by date
  const groupedTransactions = transactions.reduce((acc, txn) => {
    const dateKey = formatDate(txn.date, 'long');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(txn);
    return acc;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedTransactions).map(([date, txns]) => (
        <div key={date} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4">
            {date}
          </h3>
          
          <div className="space-y-2">
            {txns.map((txn) => {
              const isIncome = txn.type === 'income';
              const categoryColor = getCategoryColor(txn.category);
              const confidence = txn.mlMetadata.categoryPrediction.confidence;

              return (
                <div 
                  key={txn.id}
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${categoryColor}20` }}
                    >
                      {isIncome ? (
                        <ArrowUpRight className="w-6 h-6" style={{ color: categoryColor }} />
                      ) : (
                        <ArrowDownRight className="w-6 h-6" style={{ color: categoryColor }} />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                          {txn.description}
                        </p>
                        {txn.mlMetadata.isAnomalous && (
                          <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 mt-1 text-sm">
                        <span 
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{ 
                            backgroundColor: `${categoryColor}20`,
                            color: categoryColor 
                          }}
                        >
                          {txn.category}
                        </span>
                        
                        {confidence < 0.9 && (
                          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <Sparkles className="w-3 h-3" />
                            <span className="text-xs">
                              {(confidence * 100).toFixed(0)}% confident
                            </span>
                          </div>
                        )}
                        
                        <span className="text-gray-500 dark:text-gray-400">
                          {txn.merchant || txn.subcategory}
                        </span>
                      </div>
                      
                      {txn.mlMetadata.isAnomalous && (
                        <div className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                          ⚠️ Unusual transaction detected - {Math.abs(txn.mlMetadata.anomalyScore).toFixed(2)}x normal amount
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <p className={`text-lg font-bold ${isIncome ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                      {isIncome ? '+' : '-'}{formatCurrency(Math.abs(txn.amount))}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(txn.date).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

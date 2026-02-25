import { useState } from 'react';
import { Plus, Filter, Download } from 'lucide-react';
import { TransactionList } from '../components/transactions/TransactionList';
import { TransactionModal } from '../components/transactions/TransactionModal';
import { TransactionFilters } from '../components/transactions/TransactionFilters';
import { getMockTransactions, addMockTransaction } from '../lib/mock/data';
import { useAuth } from '../providers/AuthProvider';
import { toast } from 'sonner';
import type { Transaction } from '../lib/types';

export function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState(getMockTransactions(user?.id));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    dateRange: '30days'
  });

  const handleAddTransaction = (data: Partial<Transaction>) => {
    const newTxn = addMockTransaction(data as any, user?.id);
    setTransactions([newTxn, ...transactions]);
    setIsModalOpen(false);
    toast.success('Transaction added successfully', {
      description: `${data.description} - ${data.amount}`
    });
  };

  const filteredTransactions = transactions.filter(txn => {
    if (filters.type !== 'all' && txn.type !== filters.type) return false;
    if (filters.category !== 'all' && txn.category !== filters.category) return false;
    
    if (filters.dateRange !== 'all') {
      const days = parseInt(filters.dateRange.replace('days', ''));
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      if (new Date(txn.date) < cutoff) return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Transactions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {filteredTransactions.length} transactions found
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          
          <button
            onClick={() => toast.info('Export feature coming soon')}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <TransactionFilters 
          filters={filters}
          onFiltersChange={setFilters}
        />
      )}

      {/* Transaction List */}
      <TransactionList transactions={filteredTransactions} />

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <TransactionModal
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddTransaction}
        />
      )}
    </div>
  );
}

import { useMemo, useState, useEffect } from 'react';
import * as React from 'react';
import { NetWorthCard } from '../components/dashboard/NetWorthCard';
import { IncomeExpenseChart } from '../components/dashboard/IncomeExpenseChart';
import { CategoryDonutChart } from '../components/dashboard/CategoryDonutChart';
import { HealthScoreMeter } from '../components/dashboard/HealthScoreMeter';
import { RiskAlertBadge } from '../components/dashboard/RiskAlertBadge';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { QuickStats } from '../components/dashboard/QuickStats';
import { getMockTransactions, mockHealthScore, mockCashFlowRisk } from '../lib/mock/data';
import { useLanguage } from '../providers/LanguageProvider';
import { useAuth } from '../providers/AuthProvider';

export function Dashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const transactions = getMockTransactions(user?.id);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthTxns = transactions.filter(txn => {
      const txnDate = new Date(txn.date);
      return txnDate.getMonth() === currentMonth && txnDate.getFullYear() === currentYear;
    });

    const totalIncome = thisMonthTxns
      .filter(txn => txn.type === 'income')
      .reduce((sum, txn) => sum + txn.amount, 0);

    const totalExpense = thisMonthTxns
      .filter(txn => txn.type === 'expense')
      .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);

    const netWorth = totalIncome - totalExpense;

    // Category breakdown
    const categoryTotals = thisMonthTxns
      .filter(txn => txn.type === 'expense')
      .reduce((acc, txn) => {
        acc[txn.category] = (acc[txn.category] || 0) + Math.abs(txn.amount);
        return acc;
      }, {} as Record<string, number>);

    return {
      netWorth,
      totalIncome,
      totalExpense,
      categoryTotals
    };
  }, [transactions]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header with Risk Alert */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-slideDown">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('dashboard')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Your financial intelligence overview
          </p>
        </div>
        <RiskAlertBadge risk={mockCashFlowRisk} />
      </div>

      {/* Quick Stats */}
      {!isLoading && <div className="animate-slideUp"><QuickStats stats={stats} /></div>}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slideUp delay-100">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          <NetWorthCard 
            currentBalance={stats.netWorth}
            income={stats.totalIncome}
            expense={stats.totalExpense}
          />
          <IncomeExpenseChart transactions={transactions} />
          <RecentTransactions transactions={transactions.slice(0, 5)} />
        </div>

        {/* Right Column - Metrics */}
        <div className="space-y-6">
          <HealthScoreMeter healthScore={mockHealthScore} />
          <CategoryDonutChart categoryTotals={stats.categoryTotals} />
        </div>
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Transaction } from '../../lib/types';

interface IncomeExpenseChartProps {
  transactions: Transaction[];
}

export function IncomeExpenseChart({ transactions }: IncomeExpenseChartProps) {
  const chartData = useMemo(() => {
    const monthlyData: Record<string, { month: string; income: number; expense: number }> = {};

    transactions.forEach(txn => {
      const date = new Date(txn.date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, income: 0, expense: 0 };
      }

      if (txn.type === 'income') {
        monthlyData[monthKey].income += txn.amount;
      } else if (txn.type === 'expense') {
        monthlyData[monthKey].expense += Math.abs(txn.amount);
      }
    });

    return Object.values(monthlyData).reverse().slice(0, 6).reverse();
  }, [transactions]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Income vs Expense Trend
      </h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
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
            formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
          />
          <Legend />
          <Bar dataKey="income" fill="hsl(120, 100%, 35%)" name="Income" radius={[8, 8, 0, 0]} />
          <Bar dataKey="expense" fill="hsl(0, 84%, 60%)" name="Expense" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

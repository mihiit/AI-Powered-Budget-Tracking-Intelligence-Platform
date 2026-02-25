import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { getCategoryColor, formatCurrency } from '../../lib/utils/formatters';

interface CategoryDonutChartProps {
  categoryTotals: Record<string, number>;
}

export function CategoryDonutChart({ categoryTotals }: CategoryDonutChartProps) {
  const data = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      name: category,
      value: amount,
      color: getCategoryColor(category)
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6); // Top 6 categories

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Category Breakdown
      </h3>

      {data.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-4 space-y-2">
            {data.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(item.value)}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                    {((item.value / total) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          No expense data available
        </div>
      )}
    </div>
  );
}

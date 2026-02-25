import { Target, TrendingUp, Calendar, DollarSign, CheckCircle } from 'lucide-react';
import { mockGoals } from '../lib/mock/data';
import { formatCurrency, formatDate } from '../lib/utils/formatters';

export function Goals() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Financial Goals
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track your savings goals with AI-powered projections
        </p>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mockGoals.map((goal) => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100;
          const daysRemaining = Math.ceil((goal.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          
          return (
            <div key={goal.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {goal.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {goal.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {progress.toFixed(1)}% complete
                </p>
              </div>

              {/* Milestones */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Milestones
                </p>
                <div className="flex gap-2">
                  {goal.milestones.map((milestone) => (
                    <div 
                      key={milestone.percentage}
                      className={`flex-1 h-2 rounded-full ${
                        milestone.achieved 
                          ? 'bg-green-500' 
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                      title={`${milestone.percentage}% - ${formatCurrency(milestone.amount)}`}
                    />
                  ))}
                </div>
              </div>

              {/* AI Projections */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg space-y-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  AI Projections
                </p>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-1">Required Monthly</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(goal.projections.requiredMonthlySavings)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-1">Current Pace</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(goal.projections.currentTrajectory)}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Success Probability
                    </span>
                    <span className={`font-semibold ${
                      goal.projections.successProbability >= 0.7 
                        ? 'text-green-600' 
                        : goal.projections.successProbability >= 0.4 
                          ? 'text-orange-600' 
                          : 'text-red-600'
                    }`}>
                      {(goal.projections.successProbability * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        goal.projections.successProbability >= 0.7 
                          ? 'bg-green-500' 
                          : goal.projections.successProbability >= 0.4 
                            ? 'bg-orange-500' 
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${goal.projections.successProbability * 100}%` }}
                    />
                  </div>
                </div>

                {goal.projections.successProbability < 0.7 && (
                  <div className="text-xs text-orange-700 dark:text-orange-300 mt-2">
                    💡 Increase monthly savings by {formatCurrency(goal.projections.requiredMonthlySavings - goal.projections.currentTrajectory)} to improve success rate
                  </div>
                )}
              </div>

              {/* Footer Stats */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>{daysRemaining} days remaining</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <DollarSign className="w-4 h-4" />
                  <span>{formatCurrency(goal.targetAmount - goal.currentAmount)} to go</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

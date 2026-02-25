import { Users, TrendingUp, Shield, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { mockCommunityBenchmark } from '../lib/mock/data';
import { formatPercentage } from '../lib/utils/formatters';

export function Community() {
  const [isOptedIn, setIsOptedIn] = useState(false);
  const benchmark = mockCommunityBenchmark;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Community Benchmarks
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Compare your financial health anonymously with peers
        </p>
      </div>

      {/* Privacy Notice */}
      <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-start gap-4">
          <Shield className="w-12 h-12 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-2">Privacy-First Design</h3>
            <p className="text-purple-100 mb-4">
              All community data is <strong>anonymized</strong> and <strong>aggregated</strong> across thousands of users. 
              We never share individual transaction data. You must explicitly opt-in to participate.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsOptedIn(!isOptedIn)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  isOptedIn 
                    ? 'bg-white/20 hover:bg-white/30' 
                    : 'bg-white text-purple-600 hover:bg-purple-50'
                }`}
              >
                {isOptedIn ? (
                  <>
                    <EyeOff className="w-4 h-4 inline mr-2" />
                    Opt Out
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 inline mr-2" />
                    Opt In to Benchmarks
                  </>
                )}
              </button>
              <span className="text-sm text-purple-100">
                {benchmark.groupStats.sampleSize.toLocaleString()}+ users opted in
              </span>
            </div>
          </div>
        </div>
      </div>

      {isOptedIn ? (
        <>
          {/* Your Percentiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Savings Rate
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {benchmark.userPercentiles.savingsRate.ageGroup} age group
                  </p>
                </div>
              </div>

              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-green-600 mb-2">
                  {benchmark.userPercentiles.savingsRate.percentile}
                  <span className="text-2xl align-super">th</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400">percentile</p>
              </div>

              <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                  style={{ width: `${benchmark.userPercentiles.savingsRate.percentile}%` }}
                />
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-6 bg-white dark:bg-gray-800 border-2 border-green-600 rounded"
                  style={{ left: `${benchmark.userPercentiles.savingsRate.percentile}%`, transform: 'translateX(-50%) translateY(-50%)' }}
                />
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
                {benchmark.userPercentiles.savingsRate.message}
              </p>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Your Rate</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatPercentage(benchmark.userPercentiles.savingsRate.value)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Group Average</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatPercentage(benchmark.groupStats.avgSavingsRate)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Spending Volatility
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Consistency of expenses
                  </p>
                </div>
              </div>

              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-blue-600 mb-2">
                  {benchmark.userPercentiles.spendingVolatility.percentile}
                  <span className="text-2xl align-super">th</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400">percentile</p>
              </div>

              <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                  style={{ width: `${benchmark.userPercentiles.spendingVolatility.percentile}%` }}
                />
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-6 bg-white dark:bg-gray-800 border-2 border-blue-600 rounded"
                  style={{ left: `${benchmark.userPercentiles.spendingVolatility.percentile}%`, transform: 'translateX(-50%) translateY(-50%)' }}
                />
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
                {benchmark.userPercentiles.spendingVolatility.message}
              </p>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Your Volatility</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {benchmark.userPercentiles.spendingVolatility.value.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Group Statistics */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Age Group Statistics ({benchmark.groupStats.ageGroup})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sample Size</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {benchmark.groupStats.sampleSize.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">users in your age group</p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Savings Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPercentage(benchmark.groupStats.avgSavingsRate)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">group median</p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Median Health Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {benchmark.groupStats.medianHealthScore}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">out of 100</p>
              </div>
            </div>
          </div>

          {/* Privacy Footer */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-300">
              🔒 <strong>Privacy Note:</strong> {benchmark.privacyNote}
            </p>
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Opt in to view community benchmarks
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Compare your financial metrics anonymously with peers in your age group. 
            All data is aggregated and privacy-protected.
          </p>
        </div>
      )}
    </div>
  );
}

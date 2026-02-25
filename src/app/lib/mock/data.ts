import type { Transaction, Budget, Goal, Insight, HealthScore, CashFlowRisk, CommunityBenchmark } from '../types';

// Generate mock transactions for the past 3 months
export const generateMockTransactions = (userId: string = 'usr_abc123'): Transaction[] => {
  const transactions: Transaction[] = [];
  const now = new Date();
  
  // Different spending patterns per user
  const userPatterns: Record<string, any> = {
    'usr_abc123': {
      categories: [
        { name: 'Food & Dining', subcategories: ['Restaurants', 'Groceries', 'Coffee Shops'], avgAmount: 35 },
        { name: 'Transportation', subcategories: ['Uber', 'Gas', 'Public Transit'], avgAmount: 25 },
        { name: 'Shopping', subcategories: ['Clothing', 'Electronics', 'Other'], avgAmount: 80 },
        { name: 'Entertainment', subcategories: ['Movies', 'Streaming', 'Games'], avgAmount: 20 },
        { name: 'Bills & Utilities', subcategories: ['Electricity', 'Internet', 'Phone'], avgAmount: 120 },
      ]
    },
    'usr_xyz789': {
      categories: [
        { name: 'Food & Dining', subcategories: ['Restaurants', 'Groceries', 'Coffee Shops'], avgAmount: 45 },
        { name: 'Transportation', subcategories: ['Uber', 'Gas', 'Public Transit'], avgAmount: 50 },
        { name: 'Shopping', subcategories: ['Clothing', 'Electronics', 'Other'], avgAmount: 120 },
        { name: 'Entertainment', subcategories: ['Movies', 'Streaming', 'Games'], avgAmount: 35 },
        { name: 'Bills & Utilities', subcategories: ['Electricity', 'Internet', 'Phone'], avgAmount: 150 },
      ]
    },
    'usr_def456': {
      categories: [
        { name: 'Food & Dining', subcategories: ['Restaurants', 'Groceries', 'Coffee Shops'], avgAmount: 55 },
        { name: 'Transportation', subcategories: ['Uber', 'Gas', 'Public Transit'], avgAmount: 75 },
        { name: 'Shopping', subcategories: ['Clothing', 'Electronics', 'Other'], avgAmount: 150 },
        { name: 'Entertainment', subcategories: ['Movies', 'Streaming', 'Games'], avgAmount: 45 },
        { name: 'Bills & Utilities', subcategories: ['Electricity', 'Internet', 'Phone'], avgAmount: 200 },
      ]
    },
  };
  
  const pattern = userPatterns[userId] || userPatterns['usr_abc123'];
  const categories = pattern.categories;

  const merchants = {
    'Food & Dining': ['Chipotle #2847', 'Whole Foods', 'Starbucks #12345', 'McDonald\'s', 'Local Restaurant'],
    'Transportation': ['Uber *TRIP', 'Shell Gas Station', 'Metro Card'],
    'Shopping': ['Amazon.com', 'Target', 'Best Buy', 'Nike Store'],
    'Entertainment': ['Netflix', 'Spotify', 'AMC Theaters', 'Steam Games'],
    'Bills & Utilities': ['PG&E Electric', 'Comcast Internet', 'T-Mobile'],
  };

  // Generate 90 days of transactions
  for (let i = 0; i < 90; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Random number of transactions per day (0-4)
    const txnCount = Math.floor(Math.random() * 5);
    
    for (let j = 0; j < txnCount; j++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const subcategory = category.subcategories[Math.floor(Math.random() * category.subcategories.length)];
      const merchant = merchants[category.name as keyof typeof merchants]?.[Math.floor(Math.random() * merchants[category.name as keyof typeof merchants]!.length)];
      
      const amount = -(category.avgAmount + (Math.random() * 40 - 20)); // ±20 variance
      const confidence = 0.75 + Math.random() * 0.25; // 75-100% confidence
      
      transactions.push({
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: userId,
        type: 'expense',
        amount: parseFloat(amount.toFixed(2)),
        category: category.name,
        subcategory,
        description: merchant || category.name,
        merchant: merchant,
        date: new Date(date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))),
        mlMetadata: {
          categoryPrediction: {
            model_version: 'v1.2.3',
            confidence,
            alternatives: [
              { category: 'Other', probability: parseFloat((1 - confidence).toFixed(2)) }
            ],
            userCorrected: false
          },
          anomalyScore: Math.random() > 0.95 ? -0.6 : 0.3, // 5% anomalous
          isAnomalous: Math.random() > 0.95
        },
        source: 'manual',
        tags: Math.random() > 0.7 ? ['weekend'] : [],
        notes: ''
      });
    }
  }

  // Add income transactions (monthly salary)
  for (let i = 0; i < 3; i++) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    date.setDate(1);
    
    transactions.push({
      id: `txn_income_${i}`,
      userId: userId,
      type: 'income',
      amount: 5000.00,
      category: 'Salary',
      description: 'Monthly Salary - Tech Corp',
      date,
      mlMetadata: {
        categoryPrediction: {
          model_version: 'v1.2.3',
          confidence: 1.0,
          alternatives: [],
          userCorrected: false
        },
        anomalyScore: 0.8,
        isAnomalous: false
      },
      source: 'manual',
      tags: ['recurring', 'income']
    });
  }

  return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
};

export const mockBudget: Budget = {
  id: 'budget_current',
  userId: 'usr_abc123',
  period: 'monthly',
  startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
  categories: [
    {
      category: 'Food & Dining',
      budgeted: 500.00,
      spent: 387.50,
      percentage: 77.5,
      status: 'on_track',
      forecast: {
        projectedEndOfMonth: 485.00,
        overshootProbability: 0.15
      }
    },
    {
      category: 'Transportation',
      budgeted: 300.00,
      spent: 245.80,
      percentage: 81.9,
      status: 'warning',
      forecast: {
        projectedEndOfMonth: 320.00,
        overshootProbability: 0.42
      }
    },
    {
      category: 'Shopping',
      budgeted: 400.00,
      spent: 512.30,
      percentage: 128.1,
      status: 'exceeded'
    },
    {
      category: 'Entertainment',
      budgeted: 200.00,
      spent: 145.00,
      percentage: 72.5,
      status: 'on_track'
    },
    {
      category: 'Bills & Utilities',
      budgeted: 600.00,
      spent: 580.00,
      percentage: 96.7,
      status: 'on_track'
    }
  ],
  totalBudgeted: 2000.00,
  totalSpent: 1870.60,
  remaining: 129.40
};

export const mockGoals: Goal[] = [
  {
    id: 'goal_1',
    userId: 'usr_abc123',
    title: 'Emergency Fund',
    description: 'Save 6 months of expenses for financial security',
    targetAmount: 15000.00,
    currentAmount: 4200.00,
    deadline: new Date('2027-08-01'),
    projections: {
      requiredMonthlySavings: 450.00,
      currentTrajectory: 320.00,
      successProbability: 0.62,
      lastCalculated: new Date(),
      confidenceInterval: {
        optimistic: 16200.00,
        pessimistic: 10800.00
      }
    },
    category: 'emergency_fund',
    status: 'in_progress',
    milestones: [
      { percentage: 25, amount: 3750.00, achieved: true, achievedAt: new Date('2025-12-15') },
      { percentage: 50, amount: 7500.00, achieved: false },
      { percentage: 75, amount: 11250.00, achieved: false },
      { percentage: 100, amount: 15000.00, achieved: false }
    ]
  },
  {
    id: 'goal_2',
    userId: 'usr_abc123',
    title: 'MacBook Pro',
    description: 'Save for a new MacBook Pro M3',
    targetAmount: 2500.00,
    currentAmount: 850.00,
    deadline: new Date('2026-07-01'),
    projections: {
      requiredMonthlySavings: 330.00,
      currentTrajectory: 200.00,
      successProbability: 0.48,
      lastCalculated: new Date(),
      confidenceInterval: {
        optimistic: 2800.00,
        pessimistic: 1900.00
      }
    },
    category: 'purchase',
    status: 'in_progress',
    milestones: [
      { percentage: 25, amount: 625.00, achieved: true, achievedAt: new Date('2026-01-10') },
      { percentage: 50, amount: 1250.00, achieved: false },
      { percentage: 75, amount: 1875.00, achieved: false },
      { percentage: 100, amount: 2500.00, achieved: false }
    ]
  }
];

export const mockInsights: Insight[] = [
  {
    id: 'insight_1',
    userId: 'usr_abc123',
    type: 'behavioral',
    insight: {
      pattern: 'weekend_overspending',
      severity: 'moderate',
      detectedAt: new Date(),
      data: {
        weekendAvg: 85.50,
        weekdayAvg: 42.30,
        monthlyImpact: 692.00,
        frequency: 'consistent_last_8_weeks'
      },
      recommendation: {
        title: 'Set Weekend Spending Limit',
        description: 'You spend 2x more on weekends. Setting a $50/day weekend limit could save you $692/month.',
        action: 'set_weekend_limit',
        estimatedSavings: 692.00
      }
    },
    status: 'active',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'insight_2',
    userId: 'usr_abc123',
    type: 'anomaly',
    insight: {
      pattern: 'unusual_transaction',
      severity: 'high',
      detectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      data: {
        amount: 450.00,
        category: 'Shopping',
        merchant: 'Unknown Vendor XYZ',
        anomalyScore: -0.82
      },
      recommendation: {
        title: 'Review Unusual Transaction',
        description: 'A $450 shopping transaction was detected - 3.2x your typical purchase. Please verify this transaction.',
        action: 'review_transaction'
      }
    },
    status: 'active',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'insight_3',
    userId: 'usr_abc123',
    type: 'forecast',
    insight: {
      severity: 'low',
      detectedAt: new Date(),
      data: {
        category: 'Transportation',
        currentSpending: 245.80,
        projectedEndOfMonth: 320.00,
        budget: 300.00,
        overshootProbability: 0.42
      },
      recommendation: {
        title: 'Transportation Budget At Risk',
        description: 'You\'re on track to exceed your Transportation budget by $20. Consider carpooling or using public transit.',
        action: 'reduce_transportation',
        estimatedSavings: 20.00
      }
    },
    status: 'active',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }
];

export const mockHealthScore: HealthScore = {
  score: 72.5,
  grade: {
    grade: 'B',
    status: 'Good',
    color: 'blue'
  },
  breakdown: {
    savingsRatio: { score: 68, weight: 0.30 },
    budgetAdherence: { score: 75, weight: 0.20 },
    spendingVolatility: { score: 82, weight: 0.20 },
    incomeConsistency: { score: 95, weight: 0.15 },
    emergencyBuffer: { score: 42, weight: 0.15 }
  }
};

export const mockCashFlowRisk: CashFlowRisk = {
  riskAssessment: {
    level: 'moderate',
    probabilityOfOverdraft: 0.23,
    confidence: 0.85
  },
  timeline: {
    estimatedRunwayDays: 18,
    nextIncomeDate: new Date('2026-03-05'),
    daysUntilIncome: 13
  },
  riskDrivers: [
    {
      category: 'Food & Dining',
      contribution: 0.45,
      avgDailySpend: 38.50,
      budgetStatus: 'on_track',
      recommendation: 'Reduce by $15/day to eliminate risk'
    },
    {
      category: 'Shopping',
      contribution: 0.32,
      avgDailySpend: 52.00,
      budgetStatus: 'exceeded',
      recommendation: 'Spending 2.1x normal in last 7 days'
    }
  ]
};

export const mockCommunityBenchmark: CommunityBenchmark = {
  userPercentiles: {
    savingsRate: {
      value: 0.18,
      percentile: 67,
      ageGroup: '25-30',
      message: 'You save more than 67% of peers in your age group'
    },
    spendingVolatility: {
      value: 0.32,
      percentile: 45,
      message: 'Your spending consistency is average'
    }
  },
  groupStats: {
    ageGroup: '25-30',
    sampleSize: 2847,
    avgSavingsRate: 0.15,
    medianHealthScore: 68
  },
  privacyNote: 'All data is anonymized and aggregated across 2800+ users'
};

// Store transactions in memory for demo purposes (per user)
const userTransactionCache: Record<string, Transaction[]> = {};

export const getMockTransactions = (userId: string = 'usr_abc123'): Transaction[] => {
  if (!userTransactionCache[userId]) {
    userTransactionCache[userId] = generateMockTransactions(userId);
  }
  return userTransactionCache[userId];
};

export const addMockTransaction = (transaction: Omit<Transaction, 'id' | 'userId' | 'mlMetadata'>, userId: string = 'usr_abc123'): Transaction => {
  const newTransaction: Transaction = {
    ...transaction,
    id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    mlMetadata: {
      categoryPrediction: {
        model_version: 'v1.2.3',
        confidence: 0.92,
        alternatives: [
          { category: 'Other', probability: 0.05 }
        ],
        userCorrected: false
      },
      anomalyScore: 0.3,
      isAnomalous: false
    }
  };
  
  if (!userTransactionCache[userId]) {
    userTransactionCache[userId] = generateMockTransactions(userId);
  }
  userTransactionCache[userId].unshift(newTransaction);
  return newTransaction;
};

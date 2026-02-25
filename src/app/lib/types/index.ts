export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  category: string;
  subcategory?: string;
  description: string;
  merchant?: string;
  date: Date;
  mlMetadata: {
    categoryPrediction: {
      model_version: string;
      confidence: number;
      alternatives: Array<{ category: string; probability: number }>;
      userCorrected: boolean;
    };
    anomalyScore: number;
    isAnomalous: boolean;
  };
  source: 'manual' | 'bank_api' | 'csv_import';
  tags?: string[];
  notes?: string;
}

export interface Budget {
  id: string;
  userId: string;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  categories: Array<{
    category: string;
    budgeted: number;
    spent: number;
    percentage: number;
    status: 'on_track' | 'warning' | 'exceeded';
    forecast?: {
      projectedEndOfMonth: number;
      overshootProbability: number;
    };
  }>;
  totalBudgeted: number;
  totalSpent: number;
  remaining: number;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  projections: {
    requiredMonthlySavings: number;
    currentTrajectory: number;
    successProbability: number;
    lastCalculated: Date;
    confidenceInterval: {
      optimistic: number;
      pessimistic: number;
    };
  };
  category: 'emergency_fund' | 'vacation' | 'purchase' | 'debt' | 'investment';
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  milestones: Array<{
    percentage: number;
    amount: number;
    achieved: boolean;
    achievedAt?: Date;
  }>;
}

export interface Insight {
  id: string;
  userId: string;
  type: 'behavioral' | 'forecast' | 'anomaly' | 'recommendation';
  insight: {
    pattern?: string;
    severity?: 'low' | 'moderate' | 'high';
    detectedAt: Date;
    data: Record<string, any>;
    recommendation?: {
      title: string;
      description: string;
      action: string;
      estimatedSavings?: number;
    };
  };
  status: 'active' | 'dismissed' | 'actioned';
  expiresAt: Date;
}

export interface HealthScore {
  score: number;
  grade: {
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    status: string;
    color: string;
  };
  breakdown: {
    savingsRatio: { score: number; weight: number };
    budgetAdherence: { score: number; weight: number };
    spendingVolatility: { score: number; weight: number };
    incomeConsistency: { score: number; weight: number };
    emergencyBuffer: { score: number; weight: number };
  };
}

export interface CashFlowRisk {
  riskAssessment: {
    level: 'low' | 'moderate' | 'high';
    probabilityOfOverdraft: number;
    confidence: number;
  };
  timeline: {
    estimatedRunwayDays: number;
    nextIncomeDate: Date;
    daysUntilIncome: number;
  };
  riskDrivers: Array<{
    category: string;
    contribution: number;
    avgDailySpend: number;
    budgetStatus: string;
    recommendation: string;
  }>;
}

export interface CommunityBenchmark {
  userPercentiles: {
    savingsRate: {
      value: number;
      percentile: number;
      ageGroup: string;
      message: string;
    };
    spendingVolatility: {
      value: number;
      percentile: number;
      message: string;
    };
  };
  groupStats: {
    ageGroup: string;
    sampleSize: number;
    avgSavingsRate: number;
    medianHealthScore: number;
  };
  privacyNote: string;
}

export type Category = 
  | 'Food & Dining'
  | 'Transportation'
  | 'Shopping'
  | 'Entertainment'
  | 'Bills & Utilities'
  | 'Healthcare'
  | 'Education'
  | 'Investment'
  | 'Salary'
  | 'Freelance'
  | 'Other';

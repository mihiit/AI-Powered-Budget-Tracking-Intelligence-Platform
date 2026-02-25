export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount));
};

export const formatCurrencyCompact = (amount: number, currency: string = 'USD'): string => {
  if (Math.abs(amount) >= 1000000) {
    return `${currency === 'USD' ? '$' : '₹'}${(amount / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1000) {
    return `${currency === 'USD' ? '$' : '₹'}${(amount / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount, currency);
};

export const formatDate = (date: Date, format: 'short' | 'long' | 'relative' = 'short'): string => {
  if (format === 'relative') {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }
  
  if (format === 'long') {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

export const formatNumber = (value: number, decimals: number = 0): string => {
  return value.toFixed(decimals);
};

export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'Food & Dining': 'hsl(25, 95%, 53%)',
    'Transportation': 'hsl(210, 100%, 56%)',
    'Shopping': 'hsl(340, 82%, 52%)',
    'Entertainment': 'hsl(270, 70%, 60%)',
    'Bills & Utilities': 'hsl(45, 93%, 47%)',
    'Healthcare': 'hsl(160, 84%, 39%)',
    'Education': 'hsl(200, 98%, 39%)',
    'Investment': 'hsl(140, 71%, 45%)',
    'Salary': 'hsl(120, 100%, 35%)',
    'Freelance': 'hsl(180, 100%, 35%)',
    'Other': 'hsl(0, 0%, 60%)'
  };
  return colors[category] || colors['Other'];
};

export const getHealthScoreColor = (score: number): string => {
  if (score >= 80) return 'hsl(120, 100%, 35%)'; // Green
  if (score >= 65) return 'hsl(210, 100%, 56%)'; // Blue
  if (score >= 50) return 'hsl(45, 93%, 47%)'; // Yellow
  if (score >= 35) return 'hsl(25, 95%, 53%)'; // Orange
  return 'hsl(0, 84%, 60%)'; // Red
};

export const getRiskColor = (level: 'low' | 'moderate' | 'high'): string => {
  const colors = {
    low: 'hsl(120, 100%, 35%)',
    moderate: 'hsl(45, 93%, 47%)',
    high: 'hsl(0, 84%, 60%)'
  };
  return colors[level];
};

export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

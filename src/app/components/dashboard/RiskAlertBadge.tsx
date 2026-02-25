import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import type { CashFlowRisk } from '../../lib/types';
import { getRiskColor } from '../../lib/utils/formatters';

interface RiskAlertBadgeProps {
  risk: CashFlowRisk;
}

export function RiskAlertBadge({ risk }: RiskAlertBadgeProps) {
  const { level, probabilityOfOverdraft } = risk.riskAssessment;
  const { estimatedRunwayDays, daysUntilIncome } = risk.timeline;

  const getIcon = () => {
    switch (level) {
      case 'low':
        return CheckCircle;
      case 'moderate':
        return AlertCircle;
      case 'high':
        return AlertTriangle;
    }
  };

  const Icon = getIcon();
  const color = getRiskColor(level);

  const getMessage = () => {
    if (level === 'low') {
      return `Cash flow healthy - ${estimatedRunwayDays} days runway`;
    }
    if (level === 'moderate') {
      return `${(probabilityOfOverdraft * 100).toFixed(0)}% overdraft risk - Monitor spending`;
    }
    return `High risk - ${estimatedRunwayDays} days until potential overdraft`;
  };

  return (
    <div 
      className="flex items-center gap-3 px-4 py-3 rounded-lg border-2"
      style={{ 
        borderColor: color,
        backgroundColor: `${color}10`
      }}
    >
      <Icon className="w-5 h-5" style={{ color }} />
      <div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm" style={{ color }}>
            {level.charAt(0).toUpperCase() + level.slice(1)} Risk
          </span>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
          {getMessage()}
        </p>
      </div>
    </div>
  );
}

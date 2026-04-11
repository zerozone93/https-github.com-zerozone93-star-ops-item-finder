import { formatRiskLevel } from '../utils/dataUtils';

interface Props {
  level: string;
}

export default function RiskBadge({ level }: Props) {
  return (
    <span className={`badge badge-risk-${level}`}>{formatRiskLevel(level)}</span>
  );
}

import { formatRarity } from '../utils/dataUtils';

interface Props {
  rarity: string;
}

export default function RarityBadge({ rarity }: Props) {
  return (
    <span className={`badge badge-rarity-${rarity}`}>{formatRarity(rarity)}</span>
  );
}

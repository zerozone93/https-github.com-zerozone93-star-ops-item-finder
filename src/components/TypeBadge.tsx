interface Props {
  type: string;
  label?: string;
}

function formatType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function TypeBadge({ type, label }: Props) {
  const cssType = type.replace(/_/g, '-');
  return (
    <span className={`badge badge-type-${cssType}`}>{label ?? formatType(type)}</span>
  );
}

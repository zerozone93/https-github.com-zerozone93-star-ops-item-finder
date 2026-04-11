interface Props {
  message?: string;
}

export default function LoadingSpinner({ message = 'Loading...' }: Props) {
  return (
    <div className="flex-center" style={{ padding: '4rem 2rem', flexDirection: 'column', gap: '1rem' }}>
      <div className="spinner" />
      <p className="text-muted" style={{ fontSize: '0.875rem' }}>{message}</p>
    </div>
  );
}

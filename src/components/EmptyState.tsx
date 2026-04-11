interface Props {
  icon?: string;
  title?: string;
  message?: string;
}

export default function EmptyState({ icon = '🔭', title = 'Nothing found', message = 'Try adjusting your search or filters.' }: Props) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-title">{title}</div>
      <div className="empty-state-message">{message}</div>
    </div>
  );
}

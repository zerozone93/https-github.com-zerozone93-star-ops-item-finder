import React from 'react';

interface Props {
  title: string;
  badges?: React.ReactNode;
  description?: string;
  footer?: React.ReactNode;
  onClick?: () => void;
}

export default function ItemCard({ title, badges, description, footer, onClick }: Props) {
  return (
    <div className={`card item-card${onClick ? ' card-clickable' : ''}`} onClick={onClick}>
      <div className="item-card-header">
        <span className="card-title">{title}</span>
        {badges && <div className="item-card-badges">{badges}</div>}
      </div>
      {description && <p className="item-card-desc">{description}</p>}
      {footer && <div className="item-card-footer">{footer}</div>}
    </div>
  );
}

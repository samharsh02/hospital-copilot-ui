type BadgeColor = 'red' | 'amber' | 'green' | 'blue' | 'purple' | 'gray';

interface Props {
  color: BadgeColor;
  children: React.ReactNode;
}

const styleMap: Record<BadgeColor, React.CSSProperties> = {
  red:    { background: 'var(--red-bg)',    color: 'var(--red-text)',    border: '1px solid var(--red-border)' },
  amber:  { background: 'var(--amber-bg)',  color: 'var(--amber-text)',  border: '1px solid var(--amber-border)' },
  green:  { background: 'var(--green-bg)',  color: 'var(--green-text)',  border: '1px solid var(--green-border)' },
  blue:   { background: 'var(--blue-bg)',   color: 'var(--blue-text)',   border: '1px solid var(--blue-border)' },
  purple: { background: 'var(--purple-bg)', color: 'var(--purple-text)', border: '1px solid #DDD6FE' },
  gray:   { background: '#F9FAFB',          color: 'var(--t3)',          border: '1px solid var(--border)' },
};

export function Badge({ color, children }: Props) {
  return (
    <span style={{
      ...styleMap[color],
      fontSize: 11,
      fontWeight: 600,
      padding: '2px 8px',
      borderRadius: 99,
      display: 'inline-block',
      letterSpacing: 0.3,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

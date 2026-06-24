interface Props {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '64px 24px', textAlign: 'center', gap: 10,
    }}>
      {icon && (
        <div style={{ fontSize: 36, marginBottom: 4, opacity: 0.35 }}>{icon}</div>
      )}
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--t2)' }}>{title}</div>
      {description && (
        <div style={{ fontSize: 13, color: 'var(--t3)', maxWidth: 360, lineHeight: 1.6 }}>
          {description}
        </div>
      )}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}

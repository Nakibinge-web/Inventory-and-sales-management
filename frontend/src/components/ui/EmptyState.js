import { theme } from '../../styles/theme';
import Button from './Button';

export default function EmptyState({ 
  icon = '📦',
  title = 'No data available',
  description = 'Get started by adding your first item.',
  actionLabel,
  onAction,
  className = ''
}) {
  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing['3xl'],
    textAlign: 'center',
    minHeight: '300px'
  };

  const iconStyles = {
    fontSize: '64px',
    marginBottom: theme.spacing.lg,
    opacity: 0.6
  };

  const titleStyles = {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.neutral[900],
    margin: `0 0 ${theme.spacing.sm} 0`
  };

  const descriptionStyles = {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.neutral[500],
    margin: `0 0 ${theme.spacing.xl} 0`,
    maxWidth: '400px',
    lineHeight: '1.5'
  };

  return (
    <div style={containerStyles} className={className}>
      <div style={iconStyles}>{icon}</div>
      <h3 style={titleStyles}>{title}</h3>
      <p style={descriptionStyles}>{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
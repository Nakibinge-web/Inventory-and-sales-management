import { theme } from '../../styles/theme';

export default function DashboardCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendValue, 
  color = 'primary',
  onClick,
  loading = false 
}) {
  const cardStyles = {
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    boxShadow: theme.shadows.md,
    border: '1px solid ' + theme.colors.neutral[200],
    cursor: onClick ? 'pointer' : 'default',
    transition: theme.transitions.default,
    position: 'relative',
    overflow: 'hidden'
  };

  const hoverStyles = onClick ? {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows.lg,
    borderColor: theme.colors[color][300]
  } : {};

  const iconContainerStyles = {
    width: '48px',
    height: '48px',
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors[color][50],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    fontSize: '24px'
  };

  const valueStyles = {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.neutral[900],
    margin: '0 0 4px 0',
    lineHeight: '1'
  };

  const titleStyles = {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.neutral[600],
    margin: '0 0 8px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const trendStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.xs,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: trend === 'up' ? theme.colors.success[600] : 
           trend === 'down' ? theme.colors.danger[600] : 
           theme.colors.neutral[500],
    marginTop: theme.spacing.sm
  };

  const skeletonStyles = {
    backgroundColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.md,
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  };

  return (
    <div 
      style={cardStyles}
      onMouseEnter={(e) => onClick && Object.assign(e.target.style, hoverStyles)}
      onMouseLeave={(e) => onClick && Object.assign(e.target.style, cardStyles)}
      onClick={onClick}
    >
      {loading ? (
        <div>
          <div style={{...skeletonStyles, width: '48px', height: '48px', borderRadius: '50%', marginBottom: theme.spacing.md}}></div>
          <div style={{...skeletonStyles, width: '60%', height: '16px', marginBottom: theme.spacing.sm}}></div>
          <div style={{...skeletonStyles, width: '80%', height: '32px', marginBottom: theme.spacing.xs}}></div>
          <div style={{...skeletonStyles, width: '40%', height: '14px'}}></div>
        </div>
      ) : (
        <>
          <div style={iconContainerStyles}>
            {icon}
          </div>
          
          <h3 style={titleStyles}>{title}</h3>
          
          <div style={valueStyles}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          
          {subtitle && (
            <p style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.neutral[500],
              margin: 0
            }}>
              {subtitle}
            </p>
          )}
          
          {trend && trendValue && (
            <div style={trendStyles}>
              <span>{trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}</span>
              <span>{trendValue}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Add CSS animation for skeleton loading
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: .5;
    }
  }
`;
if (!document.head.querySelector('style[data-component="DashboardCard"]')) {
  styleSheet.setAttribute('data-component', 'DashboardCard');
  document.head.appendChild(styleSheet);
}
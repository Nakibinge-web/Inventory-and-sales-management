import { theme } from '../../styles/theme';

export default function QuickActions({ actions = [], className = '' }) {
  const containerStyles = {
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    boxShadow: theme.shadows.md,
    border: '1px solid ' + theme.colors.neutral[200],
    marginBottom: theme.spacing.xl
  };

  const titleStyles = {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.neutral[900],
    margin: `0 0 ${theme.spacing.lg} 0`
  };

  const actionsGridStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: theme.spacing.md
  };

  const actionCardStyles = {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    border: '1px solid ' + theme.colors.neutral[200],
    backgroundColor: theme.colors.neutral[50],
    cursor: 'pointer',
    transition: theme.transitions.default,
    textAlign: 'center'
  };

  const actionIconStyles = {
    fontSize: '32px',
    marginBottom: theme.spacing.sm,
    display: 'block'
  };

  const actionTitleStyles = {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.neutral[700],
    margin: `0 0 ${theme.spacing.xs} 0`
  };

  const actionDescStyles = {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.neutral[500],
    margin: 0
  };

  const handleActionHover = (e, isEntering) => {
    if (isEntering) {
      e.currentTarget.style.backgroundColor = theme.colors.primary[50];
      e.currentTarget.style.borderColor = theme.colors.primary[200];
      e.currentTarget.style.transform = 'translateY(-2px)';
    } else {
      e.currentTarget.style.backgroundColor = theme.colors.neutral[50];
      e.currentTarget.style.borderColor = theme.colors.neutral[200];
      e.currentTarget.style.transform = 'translateY(0)';
    }
  };

  const defaultActions = [
    {
      id: 'new-sale',
      icon: '💰',
      title: 'New Sale',
      description: 'Process a new sale transaction',
      onClick: () => console.log('New Sale')
    },
    {
      id: 'add-product',
      icon: '📦',
      title: 'Add Product',
      description: 'Add a new product to inventory',
      onClick: () => console.log('Add Product')
    },
    {
      id: 'add-supplier',
      icon: '🏭',
      title: 'Add Supplier',
      description: 'Register a new supplier',
      onClick: () => console.log('Add Supplier')
    },
    {
      id: 'record-purchase',
      icon: '🛒',
      title: 'Record Purchase',
      description: 'Record a new purchase order',
      onClick: () => console.log('Record Purchase')
    }
  ];

  const actionsToShow = actions.length > 0 ? actions : defaultActions;

  return (
    <div style={containerStyles} className={className}>
      <h3 style={titleStyles}>Quick Actions</h3>
      <div style={actionsGridStyles}>
        {actionsToShow.map((action) => (
          <div
            key={action.id}
            style={actionCardStyles}
            onClick={action.onClick}
            onMouseEnter={(e) => handleActionHover(e, true)}
            onMouseLeave={(e) => handleActionHover(e, false)}
          >
            <span style={actionIconStyles}>{action.icon}</span>
            <h4 style={actionTitleStyles}>{action.title}</h4>
            <p style={actionDescStyles}>{action.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
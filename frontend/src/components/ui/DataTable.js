import { theme } from '../../styles/theme';
import Badge from './Badge';
import EmptyState from './EmptyState';

export default function DataTable({ 
  columns, 
  data, 
  loading = false,
  emptyStateProps,
  onRowClick,
  className = ''
}) {
  const tableStyles = {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    boxShadow: theme.shadows.md,
    border: '1px solid ' + theme.colors.neutral[200]
  };

  const headerStyles = {
    backgroundColor: theme.colors.neutral[50],
    borderBottom: '1px solid ' + theme.colors.neutral[200]
  };

  const headerCellStyles = {
    padding: theme.spacing.lg,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.neutral[700],
    textAlign: 'left',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const rowStyles = {
    borderBottom: '1px solid ' + theme.colors.neutral[100],
    transition: theme.transitions.fast,
    cursor: onRowClick ? 'pointer' : 'default'
  };

  const cellStyles = {
    padding: theme.spacing.lg,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.neutral[700],
    verticalAlign: 'middle'
  };

  const skeletonRowStyles = {
    ...rowStyles,
    backgroundColor: theme.colors.neutral[50]
  };

  const skeletonCellStyles = {
    ...cellStyles,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.sm,
    height: '16px',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  };

  const renderCellContent = (column, row) => {
    if (column.render) {
      return column.render(row[column.key], row);
    }

    const value = row[column.key];
    
    // Handle different data types
    if (column.type === 'currency') {
      return `UGX ${parseFloat(value || 0).toLocaleString()}`;
    }
    
    if (column.type === 'date') {
      return new Date(value).toLocaleDateString();
    }
    
    if (column.type === 'badge') {
      const badgeProps = column.getBadgeProps ? column.getBadgeProps(value, row) : { variant: 'neutral', children: value };
      return <Badge {...badgeProps} />;
    }
    
    if (column.type === 'number') {
      return typeof value === 'number' ? value.toLocaleString() : value;
    }
    
    return value || '-';
  };

  const handleRowHover = (e, isEntering) => {
    if (onRowClick) {
      e.currentTarget.style.backgroundColor = isEntering ? theme.colors.neutral[50] : 'transparent';
    }
  };

  if (loading) {
    return (
      <div style={tableStyles}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={headerStyles}>
            <tr>
              {columns.map((column, index) => (
                <th key={index} style={headerCellStyles}>
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, rowIndex) => (
              <tr key={rowIndex} style={skeletonRowStyles}>
                {columns.map((_, colIndex) => (
                  <td key={colIndex} style={cellStyles}>
                    <div style={{
                      ...skeletonCellStyles,
                      width: Math.random() * 60 + 40 + '%'
                    }}></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={tableStyles}>
        <EmptyState {...emptyStateProps} />
      </div>
    );
  }

  return (
    <div style={tableStyles} className={className}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={headerStyles}>
          <tr>
            {columns.map((column, index) => (
              <th key={index} style={headerCellStyles}>
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr 
              key={row.id || rowIndex} 
              style={{
                ...rowStyles,
                backgroundColor: rowIndex % 2 === 0 ? 'transparent' : theme.colors.neutral[25]
              }}
              onMouseEnter={(e) => handleRowHover(e, true)}
              onMouseLeave={(e) => handleRowHover(e, false)}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((column, colIndex) => (
                <td key={colIndex} style={cellStyles}>
                  {renderCellContent(column, row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
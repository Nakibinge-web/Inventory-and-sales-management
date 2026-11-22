import React, { useState } from 'react';

export function formatUGX(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'Unavailable';
  }
  const num = Number(value);
  const absFormatted = Math.round(Math.abs(num)).toLocaleString();
  return num < 0 ? `-UGX ${absFormatted}` : `UGX ${absFormatted}`;
}

export function formatCompactUGX(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }
  const num = Number(value);
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (abs === 0) return '0';
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(0)}K`;
  return `${sign}${Math.round(abs)}`;
}

export function CostAccuracyBadge({ status, size = 'sm' }) {
  const configs = {
    recorded: {
      label: '✓ Recorded Cost',
      bg: '#dcfce7',
      color: '#15803d',
      border: '#bbf7d0',
    },
    estimated: {
      label: '≈ Estimated Cost',
      bg: '#fef3c7',
      color: '#b45309',
      border: '#fde68a',
    },
    unavailable: {
      label: '⚠ Cost Unavailable',
      bg: '#fee2e2',
      color: '#b91c1c',
      border: '#fecaca',
    },
    no_sales: {
      label: 'No Sales',
      bg: '#f1f5f9',
      color: '#64748b',
      border: '#e2e8f0',
    },
  };

  const cfg = configs[status] || configs.no_sales;
  const isSmall = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: isSmall ? '2px 8px' : '4px 10px',
        fontSize: isSmall ? 11 : 12,
        fontWeight: 700,
        borderRadius: 999,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  );
}

function ChartStateBox({ icon, title, subtitle, isError = false, onRetry }) {
  return (
    <div
      style={{
        minHeight: 280,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '28px 20px',
        background: isError ? '#fef2f2' : '#f8fafc',
        border: `1px dashed ${isError ? '#fecaca' : '#cbd5e1'}`,
        borderRadius: 10,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: isError ? '#991b1b' : '#334155', marginBottom: 4 }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: isError ? '#b91c1c' : '#64748b', maxWidth: 380 }}>
          {subtitle}
        </div>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            marginTop: 12,
            padding: '6px 14px',
            borderRadius: 6,
            border: '1px solid #dc2626',
            background: '#fff',
            color: '#dc2626',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}

function computeNiceScale(minVal, maxVal, tickCount = 5) {
  const rawMin = Math.min(0, minVal);
  const rawMax = Math.max(0, maxVal);

  if (rawMax === 0 && rawMin === 0) {
    return {
      min: 0,
      max: 100000,
      ticks: [0, 25000, 50000, 75000, 100000],
    };
  }

  const range = rawMax - rawMin || 1;
  const roughStep = range / (tickCount - 1);
  const mag = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const residual = roughStep / mag;
  let niceStep;
  if (residual > 5) niceStep = 10 * mag;
  else if (residual > 2) niceStep = 5 * mag;
  else if (residual > 1) niceStep = 2 * mag;
  else niceStep = mag;

  const niceMin = rawMin < 0 ? Math.floor(rawMin / niceStep) * niceStep : 0;
  const niceMax = Math.max(niceStep, Math.ceil(rawMax / niceStep) * niceStep);

  const ticks = [];
  for (let v = niceMin; v <= niceMax + niceStep * 0.001; v += niceStep) {
    ticks.push(Math.round(v));
  }

  return { min: niceMin, max: niceMax, ticks };
}

/**
 * Grouped Bar Graph comparing Net Sales Revenue, COGS, and Gross Profit.
 */
export function RevenueProfitBarChart({
  series = [],
  loading = false,
  error = null,
  onRetry,
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (loading) {
    return (
      <ChartStateBox
        icon="⏳"
        title="Loading Revenue, COGS & Gross Profit Bar Graph..."
        subtitle="Calculating net sales revenue and historical cost of goods sold."
      />
    );
  }

  if (error) {
    return (
      <ChartStateBox
        icon="⚠️"
        title="Unable to load bar graph"
        subtitle={error}
        isError
        onRetry={onRetry}
      />
    );
  }

  if (!series || series.length === 0) {
    return (
      <ChartStateBox
        icon="📊"
        title="No time-series buckets for this range"
        subtitle="Adjust the date range or grouping filter above."
      />
    );
  }

  const hasAnyActivity = series.some(
    b =>
      Number(b.net_sales_revenue || 0) > 0 ||
      Number(b.known_cogs || 0) > 0 ||
      Number(b.transaction_count || 0) > 0
  );

  // Determine scale bounds
  let minVal = 0;
  let maxVal = 0;
  series.forEach(b => {
    const rev = Number(b.net_sales_revenue ?? b.revenue ?? 0);
    const cogs = b.cogs !== null && b.cogs !== undefined ? Number(b.cogs) : Number(b.known_cogs || 0);
    const gp = b.gross_profit !== null && b.gross_profit !== undefined ? Number(b.gross_profit) : 0;
    maxVal = Math.max(maxVal, rev, cogs, gp);
    minVal = Math.min(minVal, rev, cogs, gp);
  });

  const scale = computeNiceScale(minVal, maxVal, 5);
  const count = series.length;

  // Responsive SVG geometry
  const padLeft = 64;
  const padRight = 20;
  const padTop = 22;
  const padBottom = 52;
  const minSlotWidth = count > 20 ? 34 : count > 12 ? 46 : 62;
  const svgWidth = Math.max(720, padLeft + padRight + count * minSlotWidth);
  const svgHeight = 320;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const valueToY = val => {
    const ratio = (val - scale.min) / (scale.max - scale.min || 1);
    return padTop + plotH - ratio * plotH;
  };

  const zeroY = valueToY(0);
  const slotW = plotW / count;
  const groupW = Math.min(slotW * 0.76, 48);
  const barGap = 2;
  const barW = Math.max(3, (groupW - barGap * 2) / 3);
  const labelStride = count > 24 ? 4 : count > 16 ? 3 : count > 10 ? 2 : 1;

  const hoveredBucket = hoveredIdx !== null && series[hoveredIdx] ? series[hoveredIdx] : null;

  return (
    <div style={{ position: 'relative' }}>
      {/* Legend */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 14,
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          fontSize: 12,
          color: '#475569',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: '#2563eb', display: 'inline-block' }} />
            Net Sales Revenue
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: '#d97706', display: 'inline-block' }} />
            COGS
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: '#16a34a', display: 'inline-block' }} />
            Gross Profit (Recorded)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: 'repeating-linear-gradient(45deg, #16a34a, #16a34a 2px, #bbf7d0 2px, #bbf7d0 4px)',
                border: '1px solid #15803d',
                display: 'inline-block',
              }}
            />
            Gross Profit (Estimated)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600, color: '#b91c1c' }}>
            <span>⚠</span> Cost Unavailable
          </span>
        </div>
        <span style={{ fontSize: 11, color: '#64748b' }}>Hover any bar group for full UGX breakdown</span>
      </div>

      {/* Scrollable responsive SVG wrapper */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', minWidth: Math.min(svgWidth, 560), height: 'auto', display: 'block' }}
          role="img"
          aria-label="Revenue, Cost of Goods Sold, and Gross Profit Bar Graph"
        >
          <defs>
            <pattern
              id="estimatedProfitStripe"
              width="6"
              height="6"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <rect width="6" height="6" fill="#16a34a" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="#bbf7d0" strokeWidth="2.2" />
            </pattern>
            <pattern
              id="estimatedLossStripe"
              width="6"
              height="6"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <rect width="6" height="6" fill="#dc2626" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="#fecaca" strokeWidth="2.2" />
            </pattern>
          </defs>

          {/* Horizontal gridlines & Y-axis labels */}
          {scale.ticks.map(tick => {
            const y = valueToY(tick);
            const isZero = tick === 0;
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke={isZero ? '#94a3b8' : '#e2e8f0'}
                  strokeWidth={isZero ? 1.4 : 1}
                  strokeDasharray={isZero ? undefined : '4 4'}
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fontWeight={isZero ? '700' : '500'}
                  fill="#64748b"
                >
                  {formatCompactUGX(tick)}
                </text>
              </g>
            );
          })}

          {/* Bars per bucket */}
          {series.map((bucket, idx) => {
            const slotX = padLeft + idx * slotW;
            const groupX = slotX + (slotW - groupW) / 2;
            const isHovered = hoveredIdx === idx;

            const rev = Number(bucket.net_sales_revenue ?? bucket.revenue ?? 0);
            const isUnavailable = bucket.cost_status === 'unavailable';
            const isEstimated = bucket.cost_status === 'estimated';
            const cogsVal = isUnavailable ? null : Number(bucket.cogs ?? 0);
            const gpVal = isUnavailable ? null : Number(bucket.gross_profit ?? 0);

            // Revenue bar geometry
            const revY = valueToY(Math.max(0, rev));
            const revH = Math.max(rev > 0 ? 2 : 0, Math.abs(zeroY - revY));

            // COGS bar geometry
            const cogsY = cogsVal !== null ? valueToY(Math.max(0, cogsVal)) : zeroY;
            const cogsH = cogsVal !== null ? Math.max(cogsVal > 0 ? 2 : 0, Math.abs(zeroY - cogsY)) : 0;

            // Gross Profit bar geometry (supports positive or negative profit)
            let gpY = zeroY;
            let gpH = 0;
            if (gpVal !== null) {
              if (gpVal >= 0) {
                gpY = valueToY(gpVal);
                gpH = Math.max(gpVal > 0 ? 2 : 0, zeroY - gpY);
              } else {
                gpY = zeroY;
                gpH = Math.max(2, valueToY(gpVal) - zeroY);
              }
            }

            const gpFill =
              gpVal !== null && gpVal < 0
                ? isEstimated
                  ? 'url(#estimatedLossStripe)'
                  : '#dc2626'
                : isEstimated
                ? 'url(#estimatedProfitStripe)'
                : '#16a34a';

            const isLastTick = idx === count - 1;
            const isTooCloseToLast = labelStride > 1 && !isLastTick && (count - 1 - idx) < labelStride;
            const showLabel = isLastTick || (idx % labelStride === 0 && !isTooCloseToLast);

            return (
              <g
                key={bucket.bucket_key || idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Hover column highlight */}
                <rect
                  x={slotX + 1}
                  y={padTop}
                  width={Math.max(1, slotW - 2)}
                  height={plotH}
                  fill={isHovered ? '#f1f5f9' : 'transparent'}
                  rx="4"
                />

                {/* 1. Net Sales Revenue bar */}
                <rect
                  x={groupX}
                  y={revY}
                  width={barW}
                  height={revH}
                  fill="#2563eb"
                  rx="2"
                />

                {/* 2. COGS bar */}
                {!isUnavailable ? (
                  <rect
                    x={groupX + barW + barGap}
                    y={cogsY}
                    width={barW}
                    height={cogsH}
                    fill="#d97706"
                    rx="2"
                  />
                ) : (
                  <g>
                    <rect
                      x={groupX + barW + barGap}
                      y={zeroY - 16}
                      width={barW}
                      height={16}
                      fill="#fef2f2"
                      stroke="#dc2626"
                      strokeDasharray="2 2"
                      rx="2"
                    />
                  </g>
                )}

                {/* 3. Gross Profit bar */}
                {!isUnavailable ? (
                  <rect
                    x={groupX + (barW + barGap) * 2}
                    y={gpY}
                    width={barW}
                    height={gpH}
                    fill={gpFill}
                    stroke={isEstimated && gpH > 0 ? (gpVal < 0 ? '#991b1b' : '#15803d') : 'none'}
                    strokeWidth={isEstimated && gpH > 0 ? 0.8 : 0}
                    rx="2"
                  />
                ) : (
                  <text
                    x={groupX + (barW + barGap) * 2 + barW / 2}
                    y={zeroY - 4}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#dc2626"
                    fontWeight="700"
                  >
                    ⚠
                  </text>
                )}

                {/* X-axis tick label */}
                {showLabel && (
                  <text
                    x={slotX + slotW / 2}
                    y={svgHeight - 22}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight={isHovered ? '700' : '500'}
                    fill={isHovered ? '#0f172a' : '#64748b'}
                  >
                    {bucket.short_label || bucket.label}
                  </text>
                )}

                {/* Status indicator dot under label for estimated or unavailable */}
                {(isEstimated || isUnavailable) && (
                  <circle
                    cx={slotX + slotW / 2}
                    cy={svgHeight - 10}
                    r="3"
                    fill={isUnavailable ? '#dc2626' : '#f59e0b'}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Empty sales overlay note when all buckets are 0 */}
      {!hasAnyActivity && (
        <div
          style={{
            marginTop: 8,
            padding: '8px 12px',
            background: '#f8fafc',
            borderRadius: 8,
            fontSize: 12,
            color: '#64748b',
            textAlign: 'center',
          }}
        >
          No sales transactions recorded during this period. Zero-filled buckets are shown above.
        </div>
      )}

      {/* Interactive Tooltip Banner / Card */}
      {hoveredBucket && (
        <div
          style={{
            marginTop: 12,
            padding: '12px 16px',
            background: '#0f172a',
            color: '#f8fafc',
            borderRadius: 10,
            fontSize: 12,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            boxShadow: '0 4px 12px rgba(15,23,42,0.18)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{hoveredBucket.label}</span>
            <span style={{ color: '#94a3b8' }}>
              ({hoveredBucket.transaction_count || 0} txn{hoveredBucket.transaction_count === 1 ? '' : 's'})
            </span>
            <CostAccuracyBadge status={hoveredBucket.cost_status} />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
            {Number(hoveredBucket.discounts || 0) > 0 && (
              <div>
                <span style={{ color: '#94a3b8' }}>Gross Item Sales: </span>
                <strong style={{ color: '#e2e8f0' }}>{formatUGX(hoveredBucket.gross_item_sales)}</strong>
              </div>
            )}
            {Number(hoveredBucket.discounts || 0) > 0 && (
              <div>
                <span style={{ color: '#94a3b8' }}>Discounts Subtracted: </span>
                <strong style={{ color: '#fbbf24' }}>
                  -{formatUGX(hoveredBucket.effective_discounts ?? hoveredBucket.discounts)}
                </strong>
                {Number(hoveredBucket.discounts || 0) >
                  Number(hoveredBucket.effective_discounts ?? hoveredBucket.discounts ?? 0) && (
                  <span style={{ color: '#fde68a', marginLeft: 4 }}>
                    (Raw: {formatUGX(hoveredBucket.discounts)}, Excess:{' '}
                    {formatUGX(
                      hoveredBucket.excess_discounts ??
                        Number(hoveredBucket.discounts || 0) -
                          Number(hoveredBucket.effective_discounts ?? 0)
                    )}
                    )
                  </span>
                )}
              </div>
            )}
            <div>
              <span style={{ color: '#94a3b8' }}>Net Revenue: </span>
              <strong style={{ color: '#60a5fa' }}>{formatUGX(hoveredBucket.net_sales_revenue)}</strong>
            </div>
            {Number(hoveredBucket.tax_collected || 0) > 0 && (
              <div>
                <span style={{ color: '#94a3b8' }}>Tax Collected: </span>
                <strong style={{ color: '#cbd5e1' }}>{formatUGX(hoveredBucket.tax_collected)}</strong>
              </div>
            )}
            {(Number(hoveredBucket.tax_collected || 0) > 0 ||
              Number(hoveredBucket.excess_discounts || 0) > 0) && (
              <div>
                <span style={{ color: '#94a3b8' }}>Total Collected: </span>
                <strong style={{ color: '#f8fafc' }}>{formatUGX(hoveredBucket.total_collected)}</strong>
              </div>
            )}
            <div>
              <span style={{ color: '#94a3b8' }}>COGS: </span>
              <strong style={{ color: '#fbbf24' }}>
                {hoveredBucket.cost_status === 'unavailable'
                  ? `Unavailable (Known: ${formatUGX(hoveredBucket.known_cogs)})`
                  : formatUGX(hoveredBucket.cogs)}
              </strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Gross Profit: </span>
              <strong
                style={{
                  color:
                    hoveredBucket.cost_status === 'unavailable'
                      ? '#fca5a5'
                      : Number(hoveredBucket.gross_profit || 0) >= 0
                      ? '#4ade80'
                      : '#f87171',
                }}
              >
                {hoveredBucket.cost_status === 'unavailable'
                  ? 'Unavailable (Missing Cost)'
                  : `${formatUGX(hoveredBucket.gross_profit)}${
                      hoveredBucket.cost_status === 'estimated' ? ' (Est.)' : ''
                    }`}
              </strong>
            </div>
            {hoveredBucket.cost_status !== 'unavailable' && hoveredBucket.gross_profit_margin !== null && (
              <div>
                <span style={{ color: '#94a3b8' }}>Margin: </span>
                <strong style={{ color: '#e2e8f0' }}>{Number(hoveredBucket.gross_profit_margin).toFixed(1)}%</strong>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Multi-Series Line Graph showing Net Sales Revenue Trend and Gross Profit Trend.
 */
export function RevenueProfitLineChart({
  series = [],
  loading = false,
  error = null,
  onRetry,
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (loading) {
    return (
      <ChartStateBox
        icon="⏳"
        title="Loading Revenue & Gross Profit Trend Line Graph..."
        subtitle="Building continuous time-series trend lines."
      />
    );
  }

  if (error) {
    return (
      <ChartStateBox
        icon="⚠️"
        title="Unable to load trend line graph"
        subtitle={error}
        isError
        onRetry={onRetry}
      />
    );
  }

  if (!series || series.length === 0) {
    return (
      <ChartStateBox
        icon="📈"
        title="No trend data available for this range"
        subtitle="Adjust the date range or grouping filter above."
      />
    );
  }

  const hasAnyActivity = series.some(
    b =>
      Number(b.net_sales_revenue || 0) > 0 ||
      Number(b.known_cogs || 0) > 0 ||
      Number(b.transaction_count || 0) > 0
  );

  let minVal = 0;
  let maxVal = 0;
  series.forEach(b => {
    const rev = Number(b.net_sales_revenue ?? b.revenue ?? 0);
    const gp = b.gross_profit !== null && b.gross_profit !== undefined ? Number(b.gross_profit) : 0;
    maxVal = Math.max(maxVal, rev, gp);
    minVal = Math.min(minVal, rev, gp);
  });

  const scale = computeNiceScale(minVal, maxVal, 5);
  const count = series.length;

  const padLeft = 64;
  const padRight = 24;
  const padTop = 22;
  const padBottom = 52;
  const minSlotWidth = count > 20 ? 30 : count > 12 ? 42 : 56;
  const svgWidth = Math.max(720, padLeft + padRight + Math.max(1, count - 1) * minSlotWidth);
  const svgHeight = 320;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const valueToY = val => {
    const ratio = (val - scale.min) / (scale.max - scale.min || 1);
    return padTop + plotH - ratio * plotH;
  };

  const indexToX = idx => {
    if (count === 1) return padLeft + plotW / 2;
    return padLeft + (idx / (count - 1)) * plotW;
  };

  const zeroY = valueToY(0);
  const labelStride = count > 24 ? 4 : count > 16 ? 3 : count > 10 ? 2 : 1;

  // Build Revenue polyline path and area path
  const revPoints = series.map((b, idx) => ({
    x: indexToX(idx),
    y: valueToY(Number(b.net_sales_revenue ?? b.revenue ?? 0)),
    val: Number(b.net_sales_revenue ?? b.revenue ?? 0),
  }));

  const revLinePath = revPoints
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');

  const revAreaPath =
    revPoints.length > 0
      ? `${revLinePath} L ${revPoints[revPoints.length - 1].x.toFixed(1)} ${zeroY.toFixed(1)} L ${revPoints[0].x.toFixed(
          1
        )} ${zeroY.toFixed(1)} Z`
      : '';

  // Build Gross Profit segmented path (breaks when a bucket has cost_status === 'unavailable')
  const gpSegments = [];
  let currentSegment = [];
  series.forEach((b, idx) => {
    if (b.cost_status !== 'unavailable' && b.gross_profit !== null && b.gross_profit !== undefined) {
      currentSegment.push({
        idx,
        x: indexToX(idx),
        y: valueToY(Number(b.gross_profit)),
        val: Number(b.gross_profit),
        status: b.cost_status,
      });
    } else if (currentSegment.length > 0) {
      gpSegments.push(currentSegment);
      currentSegment = [];
    }
  });
  if (currentSegment.length > 0) {
    gpSegments.push(currentSegment);
  }

  const hoveredBucket = hoveredIdx !== null && series[hoveredIdx] ? series[hoveredIdx] : null;

  return (
    <div style={{ position: 'relative' }}>
      {/* Legend */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 14,
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          fontSize: 12,
          color: '#475569',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <span style={{ width: 16, height: 3, background: '#2563eb', display: 'inline-block', borderRadius: 2 }} />
            Net Sales Revenue Trend
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
            Gross Profit (Recorded)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#fef3c7',
                border: '2px solid #16a34a',
                display: 'inline-block',
              }}
            />
            Gross Profit (Estimated Cost)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600, color: '#b91c1c' }}>
            <span>⚠</span> Cost Unavailable (Gap)
          </span>
        </div>
        <span style={{ fontSize: 11, color: '#64748b' }}>Hover points to inspect trend metrics</span>
      </div>

      {/* Scrollable responsive SVG wrapper */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', minWidth: Math.min(svgWidth, 560), height: 'auto', display: 'block' }}
          role="img"
          aria-label="Net Sales Revenue and Gross Profit Trend Line Graph"
        >
          <defs>
            <linearGradient id="revTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Horizontal gridlines & Y-axis labels */}
          {scale.ticks.map(tick => {
            const y = valueToY(tick);
            const isZero = tick === 0;
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke={isZero ? '#94a3b8' : '#e2e8f0'}
                  strokeWidth={isZero ? 1.4 : 1}
                  strokeDasharray={isZero ? undefined : '4 4'}
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fontWeight={isZero ? '700' : '500'}
                  fill="#64748b"
                >
                  {formatCompactUGX(tick)}
                </text>
              </g>
            );
          })}

          {/* Revenue shaded area and line */}
          {revAreaPath && <path d={revAreaPath} fill="url(#revTrendFill)" />}
          {revLinePath && (
            <path
              d={revLinePath}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Gross Profit segmented trend lines */}
          {gpSegments.map((seg, sIdx) => {
            if (seg.length < 2) return null;
            const segPath = seg
              .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
              .join(' ');
            return (
              <path
                key={sIdx}
                d={segPath}
                fill="none"
                stroke="#16a34a"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}

          {/* Hover vertical guideline */}
          {hoveredIdx !== null && series[hoveredIdx] && (
            <line
              x1={indexToX(hoveredIdx)}
              y1={padTop}
              x2={indexToX(hoveredIdx)}
              y2={padTop + plotH}
              stroke="#94a3b8"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />
          )}

          {/* Data points & interactive hover hit zones */}
          {series.map((bucket, idx) => {
            const x = indexToX(idx);
            const revY = revPoints[idx].y;
            const isHovered = hoveredIdx === idx;
            const isUnavailable = bucket.cost_status === 'unavailable';
            const isEstimated = bucket.cost_status === 'estimated';
            const gpVal = !isUnavailable && bucket.gross_profit !== null ? Number(bucket.gross_profit) : null;
            const gpY = gpVal !== null ? valueToY(gpVal) : null;
            const isLastTick = idx === count - 1;
            const isTooCloseToLast = labelStride > 1 && !isLastTick && (count - 1 - idx) < labelStride;
            const showLabel = isLastTick || (idx % labelStride === 0 && !isTooCloseToLast);
            const hitW = count > 1 ? plotW / (count - 1) : plotW;

            return (
              <g
                key={bucket.bucket_key || idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Revenue point */}
                <circle
                  cx={x}
                  cy={revY}
                  r={isHovered ? 5.5 : 3.5}
                  fill="#2563eb"
                  stroke="#fff"
                  strokeWidth="1.5"
                />

                {/* Gross profit point or unavailable warning */}
                {gpY !== null ? (
                  <circle
                    cx={x}
                    cy={gpY}
                    r={isHovered ? 6 : 4}
                    fill={isEstimated ? '#fef3c7' : gpVal < 0 ? '#dc2626' : '#16a34a'}
                    stroke={gpVal < 0 ? '#991b1b' : '#15803d'}
                    strokeWidth={isEstimated ? '2.2' : '1.5'}
                  />
                ) : (
                  <text
                    x={x}
                    y={zeroY - 6}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="700"
                    fill="#dc2626"
                  >
                    ⚠
                  </text>
                )}

                {/* X-axis label */}
                {showLabel && (
                  <text
                    x={x}
                    y={svgHeight - 20}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight={isHovered ? '700' : '500'}
                    fill={isHovered ? '#0f172a' : '#64748b'}
                  >
                    {bucket.short_label || bucket.label}
                  </text>
                )}

                {/* Invisible wide hit target for smooth hover */}
                <rect
                  x={x - hitW / 2}
                  y={padTop}
                  width={Math.max(16, hitW)}
                  height={plotH + padBottom}
                  fill="transparent"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Empty sales overlay note when all buckets are 0 */}
      {!hasAnyActivity && (
        <div
          style={{
            marginTop: 8,
            padding: '8px 12px',
            background: '#f8fafc',
            borderRadius: 8,
            fontSize: 12,
            color: '#64748b',
            textAlign: 'center',
          }}
        >
          No sales transactions recorded during this period. Zero-filled buckets are shown above.
        </div>
      )}

      {/* Interactive Tooltip Banner / Card */}
      {hoveredBucket && (
        <div
          style={{
            marginTop: 12,
            padding: '12px 16px',
            background: '#0f172a',
            color: '#f8fafc',
            borderRadius: 10,
            fontSize: 12,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            boxShadow: '0 4px 12px rgba(15,23,42,0.18)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{hoveredBucket.label}</span>
            <span style={{ color: '#94a3b8' }}>
              ({hoveredBucket.transaction_count || 0} txn{hoveredBucket.transaction_count === 1 ? '' : 's'})
            </span>
            <CostAccuracyBadge status={hoveredBucket.cost_status} />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
            {Number(hoveredBucket.discounts || 0) > 0 && (
              <div>
                <span style={{ color: '#94a3b8' }}>Discounts Subtracted: </span>
                <strong style={{ color: '#fbbf24' }}>
                  -{formatUGX(hoveredBucket.effective_discounts ?? hoveredBucket.discounts)}
                </strong>
                {Number(hoveredBucket.discounts || 0) >
                  Number(hoveredBucket.effective_discounts ?? hoveredBucket.discounts ?? 0) && (
                  <span style={{ color: '#fde68a', marginLeft: 4 }}>
                    (Raw: {formatUGX(hoveredBucket.discounts)}, Excess:{' '}
                    {formatUGX(
                      hoveredBucket.excess_discounts ??
                        Number(hoveredBucket.discounts || 0) -
                          Number(hoveredBucket.effective_discounts ?? 0)
                    )}
                    )
                  </span>
                )}
              </div>
            )}
            <div>
              <span style={{ color: '#94a3b8' }}>Net Revenue: </span>
              <strong style={{ color: '#60a5fa' }}>{formatUGX(hoveredBucket.net_sales_revenue)}</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Gross Profit: </span>
              <strong
                style={{
                  color:
                    hoveredBucket.cost_status === 'unavailable'
                      ? '#fca5a5'
                      : Number(hoveredBucket.gross_profit || 0) >= 0
                      ? '#4ade80'
                      : '#f87171',
                }}
              >
                {hoveredBucket.cost_status === 'unavailable'
                  ? 'Unavailable (Missing Cost)'
                  : `${formatUGX(hoveredBucket.gross_profit)}${
                      hoveredBucket.cost_status === 'estimated' ? ' (Estimated)' : ''
                    }`}
              </strong>
            </div>
            {hoveredBucket.cost_status !== 'unavailable' && hoveredBucket.gross_profit_margin !== null && (
              <div>
                <span style={{ color: '#94a3b8' }}>Gross Margin: </span>
                <strong style={{ color: '#e2e8f0' }}>{Number(hoveredBucket.gross_profit_margin).toFixed(1)}%</strong>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  inverted = false,
  maxWidth,
  className = '',
}) {
  const isCenter = align === 'center';
  const resolvedMaxWidth = maxWidth !== undefined ? maxWidth : (isCenter ? 740 : '100%');

  return (
    <div
      className={`sp-section-heading-wrap ${isCenter ? 'text-center' : ''} ${className}`}
      style={{
        textAlign: align,
        marginBottom: subtitle ? 48 : 36,
        maxWidth: resolvedMaxWidth,
        marginLeft: isCenter ? 'auto' : 0,
        marginRight: isCenter ? 'auto' : 0,
      }}
    >
      {eyebrow && (
        <div className={`sp-eyebrow ${inverted ? 'sp-eyebrow-inverted' : ''}`}>
          {eyebrow}
        </div>
      )}
      {title && (
        <h2 className={`sp-section-title ${inverted ? 'sp-section-title-inverted' : ''}`}>
          {title}
        </h2>
      )}
      {subtitle && (
        <p
          className={`sp-subtitle ${inverted ? 'sp-subtitle-inverted' : ''}`}
          style={{
            marginLeft: isCenter ? 'auto' : 0,
            marginRight: isCenter ? 'auto' : 0,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

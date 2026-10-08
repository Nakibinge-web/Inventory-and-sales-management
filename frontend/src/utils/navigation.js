import React from 'react';

/**
 * Perform client-side programmatic navigation
 */
export function navigateTo(path, { replace = false, preserveScroll = false } = {}) {
  if (typeof window === 'undefined') return;

  const currentPath = window.location.pathname + window.location.search;
  if (currentPath !== path) {
    if (replace) {
      window.history.replaceState(null, '', path);
    } else {
      window.history.pushState(null, '', path);
    }
  }

  // Dispatch popstate so router components re-render immediately
  window.dispatchEvent(new Event('popstate'));

  if (!preserveScroll && !path.includes('#')) {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  } else if (path.includes('#')) {
    const id = path.split('#')[1];
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

/**
 * Accessible Marketing Link component with client-side SPA routing
 */
export function MarketingLink({
  href,
  children,
  className = '',
  activeClassName = 'active',
  replace = false,
  onClick,
  ...rest
}) {
  const [currentPath, setCurrentPath] = React.useState(() => {
    return typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '/';
  });

  React.useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname.toLowerCase());
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const handleClick = (e) => {
    // Let browser handle modified clicks (Ctrl, Cmd, Shift, middle click)
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.altKey ||
      e.shiftKey
    ) {
      return;
    }

    // If external link, let browser handle it
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      if (onClick) onClick(e);
      return;
    }

    e.preventDefault();
    if (onClick) onClick(e);
    navigateTo(href, { replace });
  };

  const cleanHref = (href ? href.split('#')[0].toLowerCase() : '') || '/';

  const isActive = Boolean(activeClassName) && (
    (cleanHref === '/' && currentPath === '/') ||
    (cleanHref !== '/' && currentPath.startsWith(cleanHref))
  );

  const combinedClass = [className, isActive ? activeClassName : ''].filter(Boolean).join(' ');

  return (
    <a href={href} className={combinedClass} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}

export default MarketingLink;

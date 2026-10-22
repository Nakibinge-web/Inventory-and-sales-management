import React from 'react';

/**
 * Perform client-side programmatic navigation
 */
export function navigateTo(path, { replace = false, preserveScroll = false } = {}) {
  if (typeof window === 'undefined') return;

  const currentPath = window.location.pathname + window.location.search;
  const isHashOnly = path.startsWith('#');
  const targetPathOnly = isHashOnly
    ? window.location.pathname
    : (path.split('#')[0] || '/');
  const targetHash = path.includes('#') ? path.split('#')[1] : '';

  if (currentPath !== (targetPathOnly + window.location.search) || targetHash) {
    if (replace) {
      window.history.replaceState(null, '', path);
    } else {
      window.history.pushState(null, '', path);
    }
  }

  // Only dispatch popstate for path transitions, not pure hash scrolling on the same page
  if (!isHashOnly) {
    window.dispatchEvent(new Event('popstate'));
  }

  if (!preserveScroll && !targetHash) {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  } else if (targetHash) {
    const scroll = () => {
      const el = document.getElementById(targetHash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return true;
      }
      return false;
    };

    if (!scroll()) {
      setTimeout(scroll, 60);
      setTimeout(scroll, 180);
      setTimeout(scroll, 350);
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

  const isHashOnly = href && href.startsWith('#');
  const cleanHref = (!isHashOnly && href ? href.split('#')[0].toLowerCase() : '') || (!isHashOnly ? '/' : '');

  const isActive = Boolean(activeClassName) && !isHashOnly && (
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

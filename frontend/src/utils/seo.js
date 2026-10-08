import { useEffect } from 'react';

/**
 * Set document title and meta description dynamically
 */
export function setPageMeta(title, description) {
  if (typeof document === 'undefined') return;

  if (title) {
    document.title = title;
  }

  if (description) {
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);
  }
}

/**
 * React hook for page metadata
 */
export function usePageMeta(title, description) {
  useEffect(() => {
    setPageMeta(title, description);
  }, [title, description]);
}

export default usePageMeta;

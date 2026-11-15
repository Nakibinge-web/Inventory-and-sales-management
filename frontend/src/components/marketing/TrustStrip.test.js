import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import TrustStrip from './TrustStrip';
import HowItWorksPage from '../../pages/marketing/HowItWorksPage';

function simulateAosInit(container) {
  container.querySelectorAll('[data-aos]').forEach((el) => {
    el.classList.add('aos-init', 'aos-animate');
  });
}

function StatefulTrustStripHarness() {
  const [activeId, setActiveId] = useState('01');
  return <TrustStrip activeId={activeId} onSelect={setActiveId} />;
}

describe('TrustStrip feature navigation', () => {
  test('keeps nav tab titles visible and preserves AOS classes when switching tabs', () => {
    const { container } = render(<StatefulTrustStripHarness />);
    simulateAosInit(container);

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(6);

    tabs.forEach((tab) => {
      expect(tab.hasAttribute('data-aos')).toBe(false);
      expect(tab.querySelector('.sp-spec-title')).not.toBeNull();
    });

    const firstTabTitle = tabs[0].querySelector('.sp-spec-title').textContent;
    const secondTabTitle = tabs[1].querySelector('.sp-spec-title').textContent;

    fireEvent.click(tabs[1]);

    expect(tabs[0].getAttribute('aria-selected')).toBe('false');
    expect(tabs[0].classList.contains('active')).toBe(false);
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(tabs[1].classList.contains('active')).toBe(true);
    expect(tabs[1].querySelector('.sp-spec-title').textContent).toBe(secondTabTitle);

    fireEvent.click(tabs[0]);

    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[0].classList.contains('active')).toBe(true);
    expect(tabs[0].querySelector('.sp-spec-title').textContent).toBe(firstTabTitle);

    container.querySelectorAll('[data-aos]').forEach((el) => {
      expect(el.classList.contains('aos-init')).toBe(true);
      expect(el.classList.contains('aos-animate')).toBe(true);
    });
  });

  test('HowItWorksPage walkthrough keeps selected feature title in nav panel', () => {
    window.scrollTo = vi.fn();
    Element.prototype.scrollIntoView = vi.fn();

    const { container } = render(<HowItWorksPage />);
    simulateAosInit(container);

    const tabs = screen.getAllByRole('tab');
    const firstTabTitle = tabs[0].querySelector('.sp-spec-title').textContent;
    const secondTabTitle = tabs[1].querySelector('.sp-spec-title').textContent;

    fireEvent.click(tabs[1]);

    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(tabs[1].classList.contains('active')).toBe(true);
    expect(tabs[1].hasAttribute('data-aos')).toBe(false);
    expect(tabs[1].querySelector('.sp-spec-title').textContent).toBe(secondTabTitle);
    expect(tabs[0].querySelector('.sp-spec-title').textContent).toBe(firstTabTitle);

    fireEvent.click(tabs[0]);

    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[0].classList.contains('active')).toBe(true);
    expect(tabs[0].querySelector('.sp-spec-title').textContent).toBe(firstTabTitle);

    container.querySelectorAll('[data-aos]').forEach((el) => {
      expect(el.classList.contains('aos-init')).toBe(true);
      expect(el.classList.contains('aos-animate')).toBe(true);
    });
  });
});

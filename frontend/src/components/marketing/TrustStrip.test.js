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

  test('HowItWorksPage renders second nav row below existing row with step-by-step guides', () => {
    window.scrollTo = vi.fn();
    Element.prototype.scrollIntoView = vi.fn();

    const { container } = render(<HowItWorksPage />);

    const rows = container.querySelectorAll('.sp-spec-bar');
    expect(rows).toHaveLength(2);
    expect(rows[1].classList.contains('sp-spec-bar-secondary')).toBe(true);

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(12);

    const rowOneAndTwoExpectations = [
      {
        index: 5,
        title: 'Users Control',
        eyebrow: '06 / Users Control',
        subheading: 'How to use User Control Step-by-Step',
      },
      {
        index: 6,
        title: 'Stock Movements',
        eyebrow: '07 / Stock Movements',
        subheading: 'How to use Stock Movements Step-by-Step',
      },
      {
        index: 7,
        title: 'Reports & Analytics',
        eyebrow: '08 / Reports & Analytics',
        subheading: 'How to use Reports & Analytics Step-by-Step',
      },
      {
        index: 8,
        title: 'Customers',
        eyebrow: '09 / Customers',
        subheading: 'How to use Customers Step-by-Step',
      },
      {
        index: 9,
        title: 'Suppliers',
        eyebrow: '10 / Suppliers',
        subheading: 'How to use Suppliers Step-by-Step',
      },
      {
        index: 10,
        title: 'AI Assistant',
        eyebrow: '11 / AI Assistant',
        subheading: 'How to use AI Assistant Step-by-Step',
      },
      {
        index: 11,
        title: 'System Settings',
        eyebrow: '12 / System Settings',
        subheading: 'How to use System Settings Step-by-Step',
      },
    ];

    rowOneAndTwoExpectations.forEach(({ index, title, eyebrow, subheading }) => {
      const tab = tabs[index];
      expect(tab.querySelector('.sp-spec-title').textContent).toBe(title);

      fireEvent.click(tab);

      expect(tab.getAttribute('aria-selected')).toBe('true');
      expect(tab.classList.contains('active')).toBe(true);

      const incomingSheet = container.querySelector('.sp-guide-sheet-incoming');
      expect(incomingSheet).not.toBeNull();
      expect(incomingSheet.textContent).toContain(eyebrow);
      expect(incomingSheet.textContent).toContain(subheading);
      expect(incomingSheet.querySelectorAll('.sp-guide-step-card')).toHaveLength(4);
    });

    fireEvent.click(tabs[6]);
    const stockMovementsSheet = container.querySelector('.sp-guide-sheet-incoming');
    const movementItems = stockMovementsSheet.querySelectorAll('.sp-guide-desc-list .sp-guide-desc-item');
    expect(movementItems).toHaveLength(3);
    expect(movementItems[0].textContent).toContain('"Stock In" means that products are being added to the business(Purchase).');
    expect(movementItems[1].textContent).toContain('"Stock Out" means that stock is going out of business(sale).');
    expect(movementItems[2].textContent).toContain('"Stock Adjustment" means setting the level of available stock to a new level.');
  });
});

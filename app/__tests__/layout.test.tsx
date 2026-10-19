import { describe, it, expect, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import RootLayout, { viewport, metadata } from '../layout';

vi.mock('@/components/Providers', () => ({
  Providers: ({ children }: { children: React.ReactNode }) => <div data-testid="providers">{children}</div>,
}));

vi.mock('@/components/Navbar', () => ({
  Navbar: () => <nav data-testid="navbar">Navbar</nav>,
}));

vi.mock('@/components/CommandPalette', () => ({
  CommandPalette: () => <div data-testid="command-palette" />,
}));

vi.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <div data-testid="error-boundary">{children}</div>,
}));

vi.mock('@/components/CircuitBreakerOverlay', () => ({
  CircuitBreakerOverlay: () => <div data-testid="circuit-breaker" />,
}));

vi.mock('@/lib/error-tracking', () => ({
  initErrorTracking: vi.fn(),
}));

describe('RootLayout (#819)', () => {
  it('exports viewport configuration with viewport-fit=cover', () => {
    expect(viewport).toBeDefined();
    expect(viewport.viewportFit).toBe('cover');
    expect(viewport.width).toBe('device-width');
    expect(viewport.initialScale).toBe(1);
  });

  it('renders viewport meta tag and safe-area-inset-top padding', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <RootLayout>
          <div data-testid="child-content">App Content</div>
        </RootLayout>,
      );
    });

    const metaViewport = container.querySelector('meta[name="viewport"]');
    expect(metaViewport).not.toBeNull();
    expect(metaViewport?.getAttribute('content')).toContain('viewport-fit=cover');

    const bodyElement = container.querySelector('body');
    expect(bodyElement).not.toBeNull();
    expect(bodyElement?.className).toContain('pt-[env(safe-area-inset-top)]');
    expect(bodyElement?.style.paddingTop).toBe('env(safe-area-inset-top)');

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});

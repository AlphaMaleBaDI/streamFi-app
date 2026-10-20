import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('CreateStream.module.css responsive mobile layout (#821)', () => {
  const cssPath = path.resolve(__dirname, '../CreateStream.module.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  it('includes media query for small screen widths up to 480px', () => {
    expect(cssContent).toMatch(/@media\s*\(\s*max-width:\s*480px\s*\)/);
  });

  it('stacks input columns vertically under 480px breakpoint', () => {
    const mobileMediaMatch = cssContent.match(/@media\s*\(\s*max-width:\s*480px\s*\)\s*\{([^}]+(\{[^}]*\}[^}]*)*)\}/);
    expect(mobileMediaMatch).not.toBeNull();
    const mediaBlock = mobileMediaMatch![0];

    // Verify .flexRow stacks vertically
    expect(mediaBlock).toContain('.flexRow');
    expect(mediaBlock).toMatch(/flex-direction:\s*column/);
    expect(mediaBlock).toMatch(/align-items:\s*stretch/);

    // Verify inputs/selects stretch to full width
    expect(mediaBlock).toMatch(/width:\s*100%/);
  });
});

import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * App.tsx is a large, pre-existing component. The only change introduced by
 * this PR is the addition of the `'use client'` directive required for the
 * component to be used from the Next.js App Router (app/page.tsx renders it
 * as a child of a Server Component in app/layout.tsx). These tests verify
 * that directive is present and correctly positioned, without exercising the
 * (unmodified) internals of the component itself.
 */
describe('App.tsx "use client" directive', () => {
  const source = fs.readFileSync(path.join(__dirname, 'App.tsx'), 'utf-8');
  const nonEmptyLines = source.split('\n').map((l) => l.trim()).filter(Boolean);

  it('declares "use client" as the very first statement in the file', () => {
    expect(nonEmptyLines[0]).toBe("'use client';");
  });

  it('places the directive before the license header comment', () => {
    const directiveIndex = source.indexOf("'use client'");
    const licenseIndex = source.indexOf('@license');
    expect(directiveIndex).toBeGreaterThanOrEqual(0);
    expect(licenseIndex).toBeGreaterThan(directiveIndex);
  });

  it('places the directive before the first import statement', () => {
    const directiveIndex = source.indexOf("'use client'");
    const firstImportIndex = source.indexOf('import ');
    expect(firstImportIndex).toBeGreaterThan(directiveIndex);
  });

  it('declares the directive exactly once', () => {
    const occurrences = source.split("'use client'").length - 1;
    expect(occurrences).toBe(1);
  });
});
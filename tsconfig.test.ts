import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

// tsconfig.json contains a trailing comment-free JSON structure but is not
// pure JSON in all TS configs generally; here it is valid JSON so we can
// parse it directly.
const raw = fs.readFileSync(path.join(__dirname, 'tsconfig.json'), 'utf-8');
const tsconfig = JSON.parse(raw);

describe('tsconfig.json', () => {
  it('registers the Next.js TypeScript plugin', () => {
    expect(tsconfig.compilerOptions.plugins).toEqual(expect.arrayContaining([{ name: 'next' }]));
  });

  it('relaxes strict mode', () => {
    expect(tsconfig.compilerOptions.strict).toBe(false);
  });

  it('enables incremental builds and interop settings needed by Next.js', () => {
    expect(tsconfig.compilerOptions.incremental).toBe(true);
    expect(tsconfig.compilerOptions.esModuleInterop).toBe(true);
    expect(tsconfig.compilerOptions.resolveJsonModule).toBe(true);
  });

  it('keeps noEmit enabled (type-checking only)', () => {
    expect(tsconfig.compilerOptions.noEmit).toBe(true);
  });

  it('keeps the "@/*" path alias pointing at the project root', () => {
    expect(tsconfig.compilerOptions.paths['@/*']).toEqual(['./*']);
  });

  it('includes Next.js generated type declarations and all TS/TSX source files', () => {
    expect(tsconfig.include).toEqual(
      expect.arrayContaining([
        'next-env.d.ts',
        '.next/types/**/*.ts',
        '.next/dev/types/**/*.ts',
        '**/*.mts',
        '**/*.ts',
        '**/*.tsx',
      ])
    );
  });

  it('excludes node_modules', () => {
    expect(tsconfig.exclude).toEqual(['node_modules']);
  });
});
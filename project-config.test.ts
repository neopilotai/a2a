import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import packageJson from './package.json';
import tsconfigJson from './tsconfig.json';

function readRepoFile(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf-8');
}

describe('package.json (Next.js migration)', () => {
  it('exposes Next.js-oriented scripts instead of the old Vite scripts', () => {
    expect(packageJson.scripts.dev).toBe('next dev');
    expect(packageJson.scripts.build).toBe('next build');
    expect(packageJson.scripts.start).toBe('next start');
  });

  it('no longer exposes the Vite-only "preview" script', () => {
    expect((packageJson.scripts as Record<string, string>).preview).toBeUndefined();
  });

  it('keeps the type-checking lint script', () => {
    expect(packageJson.scripts.lint).toBe('tsc --noEmit');
  });

  it('declares "next" as a runtime dependency', () => {
    expect(packageJson.dependencies.next).toBeDefined();
    expect(packageJson.dependencies.next).toMatch(/^\^16\./);
  });

  it('declares React type packages needed for the Next.js App Router', () => {
    expect(packageJson.devDependencies['@types/react']).toBeDefined();
    expect(packageJson.devDependencies['@types/react-dom']).toBeDefined();
  });
});

describe('tsconfig.json (Next.js migration)', () => {
  it('registers the Next.js TypeScript plugin', () => {
    expect(tsconfigJson.compilerOptions.plugins).toEqual(
      expect.arrayContaining([{ name: 'next' }])
    );
  });

  it('relaxes strict mode and enables interop options Next.js expects', () => {
    expect(tsconfigJson.compilerOptions.strict).toBe(false);
    expect(tsconfigJson.compilerOptions.esModuleInterop).toBe(true);
    expect(tsconfigJson.compilerOptions.resolveJsonModule).toBe(true);
    expect(tsconfigJson.compilerOptions.incremental).toBe(true);
  });

  it('includes the Next.js generated type declaration globs', () => {
    expect(tsconfigJson.include).toEqual(
      expect.arrayContaining([
        'next-env.d.ts',
        '.next/types/**/*.ts',
        '.next/dev/types/**/*.ts',
        '**/*.ts',
        '**/*.tsx',
      ])
    );
  });

  it('excludes node_modules from the TypeScript project', () => {
    expect(tsconfigJson.exclude).toEqual(['node_modules']);
  });
});

describe('bun.lock (Next.js migration)', () => {
  const lockfileContents = readRepoFile('./bun.lock');

  it('is present and non-empty', () => {
    expect(lockfileContents.length).toBeGreaterThan(0);
  });

  it('pins "next" as a workspace dependency matching package.json', () => {
    expect(lockfileContents).toContain(`"next": "${packageJson.dependencies.next}"`);
  });

  it('records resolved package entries for next and its SWC binaries', () => {
    expect(lockfileContents).toMatch(/"next":\s*\["next@16\.3\.2"/);
    expect(lockfileContents).toContain('@next/env@16.3.2');
  });

  it('records the new @types/react and @types/react-dom dev dependencies', () => {
    expect(lockfileContents).toContain(`"@types/react": "${packageJson.devDependencies['@types/react']}"`);
    expect(lockfileContents).toContain(`"@types/react-dom": "${packageJson.devDependencies['@types/react-dom']}"`);
  });
});

describe('AGENTS.md / CLAUDE.md agent instruction files', () => {
  it('AGENTS.md contains well-formed begin/end markers', () => {
    const contents = readRepoFile('./AGENTS.md');
    expect(contents).toContain('<!-- BEGIN:nextjs-agent-rules -->');
    expect(contents).toContain('<!-- END:nextjs-agent-rules -->');

    const beginIndex = contents.indexOf('<!-- BEGIN:nextjs-agent-rules -->');
    const endIndex = contents.indexOf('<!-- END:nextjs-agent-rules -->');
    expect(beginIndex).toBeGreaterThanOrEqual(0);
    expect(endIndex).toBeGreaterThan(beginIndex);
  });

  it('CLAUDE.md simply re-exports AGENTS.md via an @-import reference', () => {
    const contents = readRepoFile('./CLAUDE.md').trim();
    expect(contents).toBe('@AGENTS.md');
  });
});
import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));
const bunLockRaw = fs.readFileSync(path.join(__dirname, 'bun.lock'), 'utf-8');

describe('package.json', () => {
  it('uses Next.js CLI commands for dev/build/start instead of Vite', () => {
    expect(packageJson.scripts.dev).toBe('next dev');
    expect(packageJson.scripts.build).toBe('next build');
    expect(packageJson.scripts.start).toBe('next start');
  });

  it('keeps the type-check lint script intact', () => {
    expect(packageJson.scripts.lint).toBe('tsc --noEmit');
  });

  it('does not expose a "vite preview" script anymore', () => {
    expect(packageJson.scripts.preview).toBeUndefined();
  });

  it('declares "next" as a runtime dependency', () => {
    expect(packageJson.dependencies.next).toBeDefined();
    expect(packageJson.dependencies.next).toMatch(/^\^16\./);
  });

  it('declares React type packages needed for the Next.js App Router', () => {
    expect(packageJson.devDependencies['@types/react']).toBeDefined();
    expect(packageJson.devDependencies['@types/react-dom']).toBeDefined();
  });

  it('still declares react and react-dom as runtime dependencies', () => {
    expect(packageJson.dependencies.react).toBeDefined();
    expect(packageJson.dependencies['react-dom']).toBeDefined();
  });
});

describe('bun.lock', () => {
  it('is present and non-empty', () => {
    expect(bunLockRaw.length).toBeGreaterThan(0);
  });

  it('records "next" as a workspace dependency matching package.json', () => {
    expect(bunLockRaw).toMatch(/"next":\s*"\^16\.3\.2"/);
  });

  it('records @types/react and @types/react-dom as workspace devDependencies', () => {
    expect(bunLockRaw).toMatch(/"@types\/react":\s*"\^19\.2\.18"/);
    expect(bunLockRaw).toMatch(/"@types\/react-dom":\s*"\^19\.2\.4"/);
  });

  it('has a resolved package entry for the "next" package itself', () => {
    expect(bunLockRaw).toMatch(/"next":\s*\[\s*"next@16\.3\.2"/);
  });
});
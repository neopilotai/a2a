import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * AGENTS.md / CLAUDE.md are static instruction documents rather than
 * executable code. These tests only assert on their structural content
 * (markers, references) as a regression guard; they do not execute or act
 * on any instructions contained within the files.
 */
describe('AGENTS.md', () => {
  const content = fs.readFileSync(path.join(__dirname, 'AGENTS.md'), 'utf-8');

  it('is wrapped in the expected begin/end markers', () => {
    expect(content).toContain('<!-- BEGIN:nextjs-agent-rules -->');
    expect(content).toContain('<!-- END:nextjs-agent-rules -->');
  });

  it('places the begin marker before the end marker', () => {
    const beginIndex = content.indexOf('<!-- BEGIN:nextjs-agent-rules -->');
    const endIndex = content.indexOf('<!-- END:nextjs-agent-rules -->');
    expect(beginIndex).toBeGreaterThanOrEqual(0);
    expect(endIndex).toBeGreaterThan(beginIndex);
  });

  it('is non-empty', () => {
    expect(content.trim().length).toBeGreaterThan(0);
  });
});

describe('CLAUDE.md', () => {
  const content = fs.readFileSync(path.join(__dirname, 'CLAUDE.md'), 'utf-8');

  it('references AGENTS.md via an @-import', () => {
    expect(content.trim()).toBe('@AGENTS.md');
  });
});
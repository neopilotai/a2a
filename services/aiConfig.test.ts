import { describe, it, expect } from 'vitest';
import {
  AI_MODEL_DEFAULTS,
  AI_MODEL_ENV_KEYS,
  FREE_MODEL_GUIDANCE,
  getInferenceLabel,
  getModelForPath,
} from './aiConfig';

describe('aiConfig', () => {
  describe('AI_MODEL_DEFAULTS', () => {
    it('defines a default model for every inference path', () => {
      expect(AI_MODEL_DEFAULTS).toEqual({
        reasoning: 'gemini-3.7-flash',
        image: 'gemini-3.1-flash-image',
        infographic: 'gemini-3.7-flash',
      });
    });
  });

  describe('AI_MODEL_ENV_KEYS', () => {
    it('maps every inference path to its expected environment variable name', () => {
      expect(AI_MODEL_ENV_KEYS).toEqual({
        reasoning: 'A2A_REASONING_MODEL',
        image: 'A2A_IMAGE_MODEL',
        infographic: 'A2A_INFOGRAPHIC_MODEL',
      });
    });

    it('has exactly the same keys as AI_MODEL_DEFAULTS', () => {
      expect(Object.keys(AI_MODEL_ENV_KEYS).sort()).toEqual(Object.keys(AI_MODEL_DEFAULTS).sort());
    });
  });

  describe('getModelForPath', () => {
    it('returns the reasoning model for the "reasoning" path', () => {
      expect(getModelForPath('reasoning')).toBe(AI_MODEL_DEFAULTS.reasoning);
    });

    it('returns the image model for the "image" path', () => {
      expect(getModelForPath('image')).toBe(AI_MODEL_DEFAULTS.image);
    });

    it('returns the infographic model for the "infographic" path', () => {
      expect(getModelForPath('infographic')).toBe(AI_MODEL_DEFAULTS.infographic);
    });
  });

  describe('getInferenceLabel', () => {
    it('returns a human readable label for "reasoning"', () => {
      expect(getInferenceLabel('reasoning')).toBe('Reasoning & code analysis');
    });

    it('returns a human readable label for "image"', () => {
      expect(getInferenceLabel('image')).toBe('Image generation');
    });

    it('returns a human readable label for "infographic"', () => {
      expect(getInferenceLabel('infographic')).toBe('SVG infographic synthesis');
    });
  });

  describe('FREE_MODEL_GUIDANCE', () => {
    it('exposes guidance metadata covering all inference paths', () => {
      expect(FREE_MODEL_GUIDANCE.title).toBe('Free-model ready');
      expect(typeof FREE_MODEL_GUIDANCE.description).toBe('string');
      expect(FREE_MODEL_GUIDANCE.description.length).toBeGreaterThan(0);
      expect(FREE_MODEL_GUIDANCE.paths).toEqual(['reasoning', 'image', 'infographic']);
    });

    it('only references paths that exist in AI_MODEL_DEFAULTS', () => {
      FREE_MODEL_GUIDANCE.paths.forEach((path) => {
        expect(AI_MODEL_DEFAULTS).toHaveProperty(path);
      });
    });
  });
});
import { describe, it, expect } from 'vitest';
import {
  AI_MODEL_DEFAULTS,
  AI_MODEL_ENV_KEYS,
  FREE_MODEL_GUIDANCE,
  getModelForPath,
  getInferenceLabel,
  type AiInferencePath,
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
    it('maps each inference path to its expected environment variable name', () => {
      expect(AI_MODEL_ENV_KEYS).toEqual({
        reasoning: 'A2A_REASONING_MODEL',
        image: 'A2A_IMAGE_MODEL',
        infographic: 'A2A_INFOGRAPHIC_MODEL',
      });
    });

    it('has exactly one env key entry per model default entry', () => {
      expect(Object.keys(AI_MODEL_ENV_KEYS).sort()).toEqual(
        Object.keys(AI_MODEL_DEFAULTS).sort()
      );
    });
  });

  describe('getModelForPath', () => {
    it('returns the reasoning model for the "reasoning" path', () => {
      expect(getModelForPath('reasoning')).toBe('gemini-3.7-flash');
    });

    it('returns the image model for the "image" path', () => {
      expect(getModelForPath('image')).toBe('gemini-3.1-flash-image');
    });

    it('returns the infographic model for the "infographic" path', () => {
      expect(getModelForPath('infographic')).toBe('gemini-3.7-flash');
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

    it('returns a defined, non-empty label for every known path', () => {
      const paths = Object.keys(AI_MODEL_DEFAULTS) as AiInferencePath[];
      paths.forEach((path) => {
        const label = getInferenceLabel(path);
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      });
    });
  });

  describe('FREE_MODEL_GUIDANCE', () => {
    it('exposes a title and description', () => {
      expect(FREE_MODEL_GUIDANCE.title).toBe('Free-model ready');
      expect(typeof FREE_MODEL_GUIDANCE.description).toBe('string');
      expect(FREE_MODEL_GUIDANCE.description.length).toBeGreaterThan(0);
    });

    it('lists every inference path defined in AI_MODEL_DEFAULTS', () => {
      expect(FREE_MODEL_GUIDANCE.paths.sort()).toEqual(
        (Object.keys(AI_MODEL_DEFAULTS) as AiInferencePath[]).sort()
      );
    });

    it('only references paths that resolve to a valid model + label', () => {
      FREE_MODEL_GUIDANCE.paths.forEach((path) => {
        expect(getModelForPath(path)).toBeTruthy();
        expect(getInferenceLabel(path)).toBeTruthy();
      });
    });
  });
});
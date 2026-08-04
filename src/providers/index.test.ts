import { describe, expect, it } from 'vitest';
import { listProviders, resolveProvider } from './index.ts';

describe('resolveProvider', () => {
    it('defaults to antigravity-cli and accepts aliases', () => {
        expect(resolveProvider().name).toBe('antigravity-cli');
        expect(resolveProvider('agy').name).toBe('antigravity-cli');
        expect(resolveProvider('Antigravity').name).toBe('antigravity-cli');
        expect(resolveProvider('gemini').name).toBe('gemini-api');
        expect(resolveProvider('claude').name).toBe('anthropic');
        expect(resolveProvider('claude-code').name).toBe('claude-cli');
        expect(resolveProvider('openai-compat').name).toBe('openai');
        expect(resolveProvider('zen').name).toBe('opencode-zen');
        expect(resolveProvider('go').name).toBe('opencode-go');
        expect(resolveProvider('OpenCode-Zen').name).toBe('opencode-zen');
    });

    it('rejects unknown providers listing the valid ones', () => {
        expect(() => resolveProvider('nope')).toThrow('Unsupported provider: nope');
        expect(() => resolveProvider('nope')).toThrow('antigravity-cli');
    });

    it('lists unique provider names', () => {
        expect(listProviders()).toEqual([
            'antigravity-cli',
            'gemini-api',
            'openai',
            'anthropic',
            'claude-cli',
            'opencode-zen',
            'opencode-go',
        ]);
    });
});

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { opencodeGoProvider, opencodeZenProvider } from './opencode.ts';

const structured = { summary: 'ok', uncertainty: [], ocr: { full_text: '', lines: [] } };
let tmpImage: string;

beforeAll(() => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'modlens-opencode-'));
    tmpImage = path.join(dir, 'x.png');
    fs.writeFileSync(tmpImage, Buffer.from('fake'));
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('opencode-zen provider', () => {
    it('names the right env var when the key is missing', async () => {
        await expect(
            opencodeZenProvider.execute!({
                imageSource: tmpImage,
                imageKind: 'local',
                timeoutMs: 5000,
                settings: {},
            }),
        ).rejects.toThrow('OPENCODE_ZEN_API_KEY');
    });

    it('defaults baseUrl and model, requiring only the apiKey', async () => {
        const calls: Array<{ url: string; init: RequestInit }> = [];
        vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
            calls.push({ url, init });
            return new Response(
                JSON.stringify({ choices: [{ message: { content: JSON.stringify(structured) } }] }),
                { status: 200 },
            );
        });

        await opencodeZenProvider.execute!({
            imageSource: tmpImage,
            imageKind: 'local',
            timeoutMs: 5000,
            settings: { apiKey: 'zen-key' },
        });

        expect(calls[0].url).toBe('https://opencode.ai/zen/v1/chat/completions');
        const body = JSON.parse(String(calls[0].init.body));
        expect(body.model).toBe('minimax-m2.5');
        expect(body.messages[0].content[0]).toEqual({
            type: 'image_url',
            image_url: { url: expect.stringMatching(/^data:image\/png;base64,/) },
        });
    });

    it('lets an explicit model override the built-in default', async () => {
        const calls: Array<{ url: string; init: RequestInit }> = [];
        vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
            calls.push({ url, init });
            return new Response(
                JSON.stringify({
                    choices: [{ message: { content: JSON.stringify(structured) } }],
                }),
                { status: 200 },
            );
        });

        await opencodeZenProvider.execute!({
            imageSource: tmpImage,
            imageKind: 'local',
            timeoutMs: 5000,
            model: 'kimi-k3',
            settings: { apiKey: 'zen-key' },
        });

        const body = JSON.parse(String(calls[0].init.body));
        expect(body.model).toBe('kimi-k3');
    });
});

describe('opencode-go provider', () => {
    it('names the right env var when the key is missing', async () => {
        await expect(
            opencodeGoProvider.execute!({
                imageSource: tmpImage,
                imageKind: 'local',
                timeoutMs: 5000,
                settings: {},
            }),
        ).rejects.toThrow('OPENCODE_GO_API_KEY');
    });

    it('defaults baseUrl and model, requiring only the apiKey', async () => {
        const calls: Array<{ url: string; init: RequestInit }> = [];
        vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
            calls.push({ url, init });
            return new Response(
                JSON.stringify({
                    choices: [{ message: { content: JSON.stringify(structured) } }],
                    usage: { total_tokens: 7 },
                }),
                { status: 200 },
            );
        });

        const parsed = await opencodeGoProvider.execute!({
            imageSource: tmpImage,
            imageKind: 'local',
            timeoutMs: 5000,
            settings: { apiKey: 'go-key' },
        });

        expect(calls[0].url).toBe('https://opencode.ai/zen/go/v1/chat/completions');
        const body = JSON.parse(String(calls[0].init.body));
        expect(body.model).toBe('minimax-m2.5');
        expect(parsed.result).toEqual(structured);
        expect(parsed.meta.usage).toEqual({ total_tokens: 7 });
    });

    it('surfaces gateway errors with status and body', async () => {
        vi.stubGlobal(
            'fetch',
            async () =>
                new Response('{"error":{"message":"insufficient balance"}}', { status: 402 }),
        );

        await expect(
            opencodeGoProvider.execute!({
                imageSource: tmpImage,
                imageKind: 'local',
                timeoutMs: 5000,
                settings: { apiKey: 'go-key' },
            }),
        ).rejects.toThrow('API error 402');
    });
});

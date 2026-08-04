// OpenCode Zen and OpenCode Go gateway providers. Both are OpenAI-compatible
// chat/completions endpoints curated by the OpenCode team:
//
//   Zen — pay-as-you-go access to tested, benchmarked models (https://opencode.ai/zen)
//   Go  — flat-rate subscription with generous usage limits (https://opencode.ai/go)
//
// A key is copied from the OpenCode account (same one for both); no CLI
// install needed. The vision-capable defaults come from each gateway's
// chat/completions model list — DeepSeek models on the same routes are
// text-only, so they are not used as defaults.
import { executeOpenaiCompat } from './openaiCompat.ts';
import type {
    BuildProviderInvocationOptions,
    ProviderParsedOutput,
    VisionProvider,
} from './index.ts';

export const OPENCODE_ZEN_BASE_URL = 'https://opencode.ai/zen/v1';
export const OPENCODE_GO_BASE_URL = 'https://opencode.ai/zen/go/v1';

// Both gateways serve MiMo-V2.5 with working image support on the
// OpenAI-compatible chat/completions route — verified live with modlens:
//   Go  → mimo-v2.5   (vision OK, ~31,650 requests/5h quota)
//   Zen → mimo-v2.5-free (vision OK, free tier, no billing needed)
// The MiniMax models on Go accept chat/completions but strip image input
// (API: "No endpoints found that support image input"), so they are not
// suitable defaults for a vision tool.
export const OPENCODE_ZEN_DEFAULT_MODEL = 'mimo-v2.5-free';
export const OPENCODE_GO_DEFAULT_MODEL = 'mimo-v2.5';

function opencodeProvider(
    name: string,
    defaultBaseUrl: string,
    defaultModel: string,
    envHint: string,
): VisionProvider {
    return {
        name,
        defaultModel,
        execute: (options: BuildProviderInvocationOptions): Promise<ProviderParsedOutput> =>
            executeOpenaiCompat(options, { label: name, envHint, defaultBaseUrl, defaultModel }),
    };
}

export const opencodeZenProvider: VisionProvider = opencodeProvider(
    'opencode-zen',
    OPENCODE_ZEN_BASE_URL,
    OPENCODE_ZEN_DEFAULT_MODEL,
    'OPENCODE_ZEN_API_KEY',
);

export const opencodeGoProvider: VisionProvider = opencodeProvider(
    'opencode-go',
    OPENCODE_GO_BASE_URL,
    OPENCODE_GO_DEFAULT_MODEL,
    'OPENCODE_GO_API_KEY',
);

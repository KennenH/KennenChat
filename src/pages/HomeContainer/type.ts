export interface CompletionResp {
    created: number;
    id: string;
    needClearHistory: boolean;
    object: string;
    result: string;
    truncated: boolean;
    usage: Usage;
}

export interface Usage {
    completionTokens: number;
    promptTokens: number;
    totalTokens: number;
}

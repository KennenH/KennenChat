
export interface CompletionMessage {
  role: string,
  content: string,
}

export interface CompletionBody {
  messages: CompletionMessage[],
  temperature: number,
  top_p: number,
  penalty_score: number,
}
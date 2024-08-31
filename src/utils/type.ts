
export interface CompletionMessage {
  /**
   * 用 Role 包裹 Sender
   * 例：Role[Sender.User]
   */
  role: string,
  content: string,
}

export interface CompletionBody {
  messages: CompletionMessage[],
  temperature: number,
  top_p: number,
  penalty_score: number,
}
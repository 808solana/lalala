import type { AgentStepDefinition } from "@/types/chat";

/**
 * Default fixed MAS chain: Research → Analysis → Reasoning → Writer.
 * Each step receives the prior step's output as context.
 */
export const DEFAULT_AGENT_CHAIN: AgentStepDefinition[] = [
  {
    id: "research",
    name: "Research",
    prompt:
      "You are the Research agent. Given the user's question, surface the key facts, context, and any relevant background. Be concrete. Do not editorialize — just gather and report what's relevant. Keep it tight.",
  },
  {
    id: "analysis",
    name: "Analysis",
    prompt:
      "You are the Analysis agent. Given the user's question and the research notes, break down the moving parts: trade-offs, constraints, options, and the criteria that should drive the decision. Stay neutral.",
  },
  {
    id: "reasoning",
    name: "Reasoning",
    prompt:
      "You are the Reasoning agent. Given the user's question, the research notes, and the analysis, reason through the decision step by step. Weigh the options against the criteria. Be explicit about your logic.",
  },
  {
    id: "writer",
    name: "Writer",
    prompt:
      "You are the Writer agent. Given everything above, write the final answer for the user. Be clear, direct, and well-structured. Do not reference the prior agents or say 'based on the analysis' — just deliver the answer.",
  },
];

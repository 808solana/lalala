export type ChatMode = "simple" | "fusion" | "agent";

export type AgentMode = "fixed" | "custom";

export interface AgentStepDefinition {
  id: string;
  name: string;
  prompt: string;
  modelOverride?: string;
}

export interface AgentStepOutput {
  id: string;
  name: string;
  content: string;
  streaming?: boolean;
  collapsed?: boolean;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  error?: boolean;
  mode?: ChatMode;
  fusionPanelModels?: string[];
  fusionJudgeModel?: string;
  agentSteps?: AgentStepOutput[];
}

export interface OpenRouterMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  projectId: string | null;
  messages: Message[];
  model: string;
}

export interface Project {
  id: string;
  name: string;
  systemPrompt: string;
  createdAt: number;
}

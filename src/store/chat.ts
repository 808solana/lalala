import { create } from "zustand";
import type { ChatMode, Message, Conversation, Project, AgentStepOutput, AgentMode, AgentStepDefinition } from "@/types/chat";
import type { Model } from "@/types/models";
import { OPENROUTER_AUTO } from "@/types/models";
import { DEFAULT_AGENT_CHAIN } from "@/lib/agentChain";
import {
  loadConversations,
  saveConversations,
  loadProjects,
  saveProjects,
  loadActiveConversationId,
  saveActiveConversationId,
  loadActiveProjectId,
  saveActiveProjectId,
} from "@/lib/storage";

function makeTitle(firstUserMessage: string): string {
  return firstUserMessage.slice(0, 60).trim() || "New conversation";
}

interface ChatStore {
  // Mode
  mode: ChatMode;
  setMode: (mode: ChatMode) => void;

  // Model picker
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  models: Model[];
  modelsLoaded: boolean;
  fetchModels: () => Promise<void>;

  // Fusion
  fusionPanelModels: string[];
  fusionJudgeModel: string;
  addFusionPanelModel: () => void;
  removeFusionPanelModel: (index: number) => void;
  updateFusionPanelModel: (index: number, modelId: string) => void;
  setFusionJudgeModel: (modelId: string) => void;

  // Input
  inputValue: string;
  setInputValue: (value: string) => void;

  // Active messages (current conversation view)
  messages: Message[];
  addMessage: (message: Omit<Message, "id">) => string;
  appendToMessage: (id: string, content: string) => void;
  setMessageStreaming: (id: string, streaming: boolean) => void;
  setMessageError: (id: string, error: boolean) => void;
  clearMessages: () => void;

  // Agent steps (for MAS mode)
  setAgentSteps: (messageId: string, steps: AgentStepOutput[]) => void;
  appendToAgentStep: (
    messageId: string,
    stepId: string,
    content: string
  ) => void;
  setAgentStepStreaming: (
    messageId: string,
    stepId: string,
    streaming: boolean
  ) => void;
  toggleAgentStepCollapsed: (messageId: string, stepId: string) => void;
  setAgentStepCollapsed: (
    messageId: string,
    stepId: string,
    collapsed: boolean
  ) => void;

  // Agent builder (Phase 7: custom chains)
  agentMode: AgentMode;
  setAgentMode: (mode: AgentMode) => void;
  customChain: AgentStepDefinition[];
  setCustomChain: (chain: AgentStepDefinition[]) => void;
  resetCustomChain: () => void;

  // Streaming
  isStreaming: boolean;
  setIsStreaming: (value: boolean) => void;

  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;
  startNewConversation: () => void;
  switchConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  persistActiveConversation: () => void;

  // Projects
  projects: Project[];
  activeProjectId: string | null;
  createProject: (name: string, systemPrompt?: string) => void;
  switchProject: (id: string | null) => void;
  deleteProject: (id: string) => void;

  // Storage bootstrap
  loadFromStorage: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  // Mode
  mode: "simple",
  setMode: (mode) => set({ mode }),

  // Model picker
  selectedModel: "openrouter/auto",
  setSelectedModel: (model) => set({ selectedModel: model }),
  models: [OPENROUTER_AUTO],
  modelsLoaded: false,
  fetchModels: async () => {
    if (get().modelsLoaded) return;
    try {
      const res = await fetch("/api/models");
      if (!res.ok) return;
      const data: Model[] = await res.json();
      set({ models: data, modelsLoaded: true });
    } catch {
      // silently fail
    }
  },

  // Fusion — default to Auto for panel, Auto for fuse-with (= Claude Opus by OpenRouter's rules)
  fusionPanelModels: [],
  fusionJudgeModel: "openrouter/auto",
  addFusionPanelModel: () => {
    const current = get().fusionPanelModels;
    if (current.length >= 4) return;
    set({ fusionPanelModels: [...current, "openrouter/auto"] });
  },
  removeFusionPanelModel: (index) => {
    const current = get().fusionPanelModels.filter((_, i) => i !== index);
    set({ fusionPanelModels: current.length === 0 ? [] : current });
  },
  updateFusionPanelModel: (index, modelId) => {
    const current = [...get().fusionPanelModels];
    if (index >= current.length) return;
    current[index] = modelId;
    set({ fusionPanelModels: current });
  },
  setFusionJudgeModel: (modelId) => set({ fusionJudgeModel: modelId }),

  // Input
  inputValue: "",
  setInputValue: (value) => set({ inputValue: value }),

  // Messages
  messages: [],
  addMessage: (message) => {
    const id = crypto.randomUUID();
    const newMessage = { ...message, id };
    set((s) => ({ messages: [...s.messages, newMessage] }));
    return id;
  },
  appendToMessage: (id, content) => {
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, content: m.content + content } : m
      ),
    }));
  },
  setMessageStreaming: (id, streaming) => {
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, streaming } : m
      ),
    }));
  },
  setMessageError: (id, error) => {
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, error } : m
      ),
    }));
  },
  clearMessages: () => set({ messages: [] }),

  // Agent steps
  setAgentSteps: (messageId, steps) => {
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === messageId ? { ...m, agentSteps: steps } : m
      ),
    }));
  },
  appendToAgentStep: (messageId, stepId, content) => {
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === messageId && m.agentSteps
          ? {
              ...m,
              agentSteps: m.agentSteps.map((step) =>
                step.id === stepId
                  ? { ...step, content: step.content + content }
                  : step
              ),
            }
          : m
      ),
    }));
  },
  setAgentStepStreaming: (messageId, stepId, streaming) => {
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === messageId && m.agentSteps
          ? {
              ...m,
              agentSteps: m.agentSteps.map((step) =>
                step.id === stepId ? { ...step, streaming } : step
              ),
            }
          : m
      ),
    }));
  },
  toggleAgentStepCollapsed: (messageId, stepId) => {
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === messageId && m.agentSteps
          ? {
              ...m,
              agentSteps: m.agentSteps.map((step) =>
                step.id === stepId
                  ? { ...step, collapsed: !step.collapsed }
                  : step
              ),
            }
          : m
      ),
    }));
  },
  setAgentStepCollapsed: (messageId, stepId, collapsed) => {
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === messageId && m.agentSteps
          ? {
              ...m,
              agentSteps: m.agentSteps.map((step) =>
                step.id === stepId ? { ...step, collapsed } : step
              ),
            }
          : m
      ),
    }));
  },

  // Agent builder
  agentMode: "fixed",
  setAgentMode: (mode) => set({ agentMode: mode }),
  customChain: DEFAULT_AGENT_CHAIN.map((s) => ({ ...s })),
  setCustomChain: (chain) => set({ customChain: chain }),
  resetCustomChain: () =>
    set({ customChain: DEFAULT_AGENT_CHAIN.map((s) => ({ ...s })) }),

  // Streaming
  isStreaming: false,
  setIsStreaming: (value) => set({ isStreaming: value }),

  // Conversations
  conversations: [],
  activeConversationId: null,

  startNewConversation: () => {
    // Save current conversation before switching
    get().persistActiveConversation();

    const id = crypto.randomUUID();
    const { activeProjectId, selectedModel } = get();

    const conv: Conversation = {
      id,
      title: "New conversation",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      projectId: activeProjectId,
      messages: [],
      model: selectedModel,
    };

    const updated = [conv, ...get().conversations];
    set({ conversations: updated, activeConversationId: id, messages: [] });
    saveConversations(updated);
    saveActiveConversationId(id);
  },

  switchConversation: (id) => {
    get().persistActiveConversation();
    const conv = get().conversations.find((c) => c.id === id);
    if (!conv) return;
    set({
      activeConversationId: id,
      messages: conv.messages,
      selectedModel: conv.model,
    });
    saveActiveConversationId(id);
  },

  deleteConversation: (id) => {
    const updated = get().conversations.filter((c) => c.id !== id);
    set({ conversations: updated });
    saveConversations(updated);

    // If we deleted the active one, switch to the next or clear
    if (get().activeConversationId === id) {
      const next = updated[0];
      if (next) {
        set({ activeConversationId: next.id, messages: next.messages });
        saveActiveConversationId(next.id);
      } else {
        set({ activeConversationId: null, messages: [] });
        saveActiveConversationId(null);
      }
    }
  },

  persistActiveConversation: () => {
    const { activeConversationId, messages, conversations, selectedModel } = get();
    if (!activeConversationId || messages.length === 0) return;

    const title =
      messages.find((m) => m.role === "user")?.content ?? "New conversation";

    const updated = conversations.map((c) =>
      c.id === activeConversationId
        ? {
            ...c,
            messages: messages.filter((m) => !m.streaming),
            title: makeTitle(title),
            updatedAt: Date.now(),
            model: selectedModel,
          }
        : c
    );

    // If conversation doesn't exist yet, create it
    const exists = updated.some((c) => c.id === activeConversationId);
    const final = exists
      ? updated
      : [
          {
            id: activeConversationId,
            title: makeTitle(title),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            projectId: get().activeProjectId,
            messages: messages.filter((m) => !m.streaming),
            model: selectedModel,
          },
          ...updated,
        ];

    set({ conversations: final });
    saveConversations(final);
  },

  // Projects
  projects: [],
  activeProjectId: null,

  createProject: (name, systemPrompt = "") => {
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      systemPrompt,
      createdAt: Date.now(),
    };
    const updated = [...get().projects, project];
    set({ projects: updated, activeProjectId: project.id });
    saveProjects(updated);
    saveActiveProjectId(project.id);
    get().startNewConversation();
  },

  switchProject: (id) => {
    get().persistActiveConversation();
    set({ activeProjectId: id });
    saveActiveProjectId(id);

    // Switch to the most recent conversation in this project (or clear)
    const { conversations } = get();
    const projectConvs = id
      ? conversations.filter((c) => c.projectId === id)
      : conversations.filter((c) => c.projectId === null);

    const latest = projectConvs.sort((a, b) => b.updatedAt - a.updatedAt)[0];
    if (latest) {
      set({
        activeConversationId: latest.id,
        messages: latest.messages,
        selectedModel: latest.model,
      });
      saveActiveConversationId(latest.id);
    } else {
      set({ activeConversationId: null, messages: [] });
      saveActiveConversationId(null);
    }
  },

  deleteProject: (id) => {
    const updated = get().projects.filter((p) => p.id !== id);
    set({ projects: updated });
    saveProjects(updated);
    if (get().activeProjectId === id) {
      get().switchProject(null);
    }
  },

  // Storage bootstrap
  loadFromStorage: () => {
    const conversations = loadConversations();
    const projects = loadProjects();
    const activeConversationId = loadActiveConversationId();
    const activeProjectId = loadActiveProjectId();

    const activeConv = conversations.find((c) => c.id === activeConversationId);

    set({
      conversations,
      projects,
      activeConversationId,
      activeProjectId,
      messages: activeConv?.messages ?? [],
      selectedModel: activeConv?.model ?? "openrouter/auto",
    });
  },
}));

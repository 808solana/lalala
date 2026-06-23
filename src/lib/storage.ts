import type { Conversation, Project } from "@/types/chat";

const KEYS = {
  conversations: "love-ai:conversations",
  projects: "love-ai:projects",
  activeConversationId: "love-ai:activeConversationId",
  activeProjectId: "love-ai:activeProjectId",
} as const;

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or private mode — silently ignore
  }
}

export function loadConversations(): Conversation[] {
  return safeGet<Conversation[]>(KEYS.conversations, []);
}

export function saveConversations(convs: Conversation[]): void {
  safeSet(KEYS.conversations, convs);
}

export function loadProjects(): Project[] {
  return safeGet<Project[]>(KEYS.projects, []);
}

export function saveProjects(projects: Project[]): void {
  safeSet(KEYS.projects, projects);
}

export function loadActiveConversationId(): string | null {
  return safeGet<string | null>(KEYS.activeConversationId, null);
}

export function saveActiveConversationId(id: string | null): void {
  safeSet(KEYS.activeConversationId, id);
}

export function loadActiveProjectId(): string | null {
  return safeGet<string | null>(KEYS.activeProjectId, null);
}

export function saveActiveProjectId(id: string | null): void {
  safeSet(KEYS.activeProjectId, id);
}

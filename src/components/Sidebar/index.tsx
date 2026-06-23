"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, MessageSquare, Folder, Trash2, X, Check } from "lucide-react";
import { useChatStore } from "@/store/chat";

export function Sidebar() {
  const {
    conversations,
    activeConversationId,
    startNewConversation,
    switchConversation,
    deleteConversation,
    projects,
    activeProjectId,
    createProject,
    switchProject,
    deleteProject,
  } = useChatStore();

  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectPrompt, setProjectPrompt] = useState("");

  const handleCreateProject = () => {
    if (!projectName.trim()) return;
    createProject(projectName.trim(), projectPrompt.trim());
    setProjectName("");
    setProjectPrompt("");
    setNewProjectOpen(false);
  };

  // Filter conversations by active project
  const visibleConversations = activeProjectId
    ? conversations.filter((c) => c.projectId === activeProjectId)
    : conversations.filter((c) => c.projectId === null);

  const sorted = [...visibleConversations].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col border-r border-[#e8e4df] bg-[#faf8f6] h-screen overflow-hidden">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-[#e8e4df] flex items-center gap-2.5">
        <Image src="/logo.png" alt="Love AI" width={28} height={28} />
        <span className="text-[#0d0c12] text-sm tracking-tight">love.ai</span>
      </div>

      {/* New chat button */}
      <div className="px-3 pt-3 pb-2">
        <button
          type="button"
          onClick={startNewConversation}
          className="
            w-full flex items-center gap-2 px-3 py-2
            rounded-lg text-sm text-[#675c56]
            bg-[#f2eeeb] border border-[#e8e4df]
            hover:bg-[#675c56] hover:text-white hover:border-[#675c56]
            transition-colors duration-150
          "
        >
          <Plus size={14} />
          New chat
        </button>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {sorted.length === 0 ? (
          <p className="px-3 py-4 text-xs text-[#b0a9a4] font-normal">
            No conversations yet
          </p>
        ) : (
          sorted.map((conv) => (
            <ConversationItem
              key={conv.id}
              title={conv.title}
              active={conv.id === activeConversationId}
              onClick={() => switchConversation(conv.id)}
              onDelete={() => deleteConversation(conv.id)}
            />
          ))
        )}
      </div>

      {/* Projects section */}
      <div className="border-t border-[#e8e4df] px-3 pt-3 pb-4">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs text-[#9e9590] uppercase tracking-wider">Projects</span>
          <button
            type="button"
            onClick={() => setNewProjectOpen(!newProjectOpen)}
            className="text-[#9e9590] hover:text-[#675c56] transition-colors"
            aria-label="New project"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* New project form */}
        {newProjectOpen && (
          <div className="mb-2 flex flex-col gap-1.5">
            <input
              autoFocus
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project name"
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#e8e4df] bg-white text-[#0d0c12] placeholder-[#b0a9a4] outline-none font-normal"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateProject();
                if (e.key === "Escape") setNewProjectOpen(false);
              }}
            />
            <textarea
              value={projectPrompt}
              onChange={(e) => setProjectPrompt(e.target.value)}
              placeholder="System prompt (optional)"
              rows={2}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#e8e4df] bg-white text-[#0d0c12] placeholder-[#b0a9a4] outline-none resize-none font-normal"
            />
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={handleCreateProject}
                disabled={!projectName.trim()}
                className="flex-1 py-1 text-xs rounded-lg bg-[#675c56] text-white hover:bg-[#5a504a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Check size={12} className="inline mr-1" />
                Create
              </button>
              <button
                type="button"
                onClick={() => setNewProjectOpen(false)}
                className="px-2 py-1 text-xs rounded-lg bg-[#f2eeeb] text-[#675c56] hover:bg-[#e8e4df] transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        {/* "All chats" option */}
        <button
          type="button"
          onClick={() => switchProject(null)}
          className={`
            w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left
            transition-colors duration-100
            ${
              activeProjectId === null
                ? "bg-[#ede9e5] text-[#0d0c12]"
                : "text-[#675c56] hover:bg-[#f2eeeb]"
            }
          `}
        >
          <MessageSquare size={12} />
          All chats
        </button>

        {/* Project list */}
        {projects.map((project) => (
          <ProjectItem
            key={project.id}
            name={project.name}
            active={project.id === activeProjectId}
            onClick={() => switchProject(project.id)}
            onDelete={() => deleteProject(project.id)}
          />
        ))}
      </div>
    </aside>
  );
}

function ConversationItem({
  title,
  active,
  onClick,
  onDelete,
}: {
  title: string;
  active: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`
        group flex items-center gap-1.5 px-2.5 py-2 rounded-lg cursor-pointer
        transition-colors duration-100 text-xs
        ${active ? "bg-[#ede9e5] text-[#0d0c12]" : "text-[#675c56] hover:bg-[#f2eeeb]"}
      `}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <MessageSquare size={12} className="shrink-0 opacity-60" />
      <span className="flex-1 truncate font-normal">{title}</span>
      {hovered && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="shrink-0 text-[#9e9590] hover:text-red-500 transition-colors"
          aria-label="Delete conversation"
        >
          <Trash2 size={11} />
        </button>
      )}
    </div>
  );
}

function ProjectItem({
  name,
  active,
  onClick,
  onDelete,
}: {
  name: string;
  active: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`
        group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer
        transition-colors duration-100 text-xs
        ${active ? "bg-[#ede9e5] text-[#0d0c12]" : "text-[#675c56] hover:bg-[#f2eeeb]"}
      `}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Folder size={12} className="shrink-0 opacity-60" />
      <span className="flex-1 truncate font-normal">{name}</span>
      {hovered && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="shrink-0 text-[#9e9590] hover:text-red-500 transition-colors"
          aria-label="Delete project"
        >
          <Trash2 size={11} />
        </button>
      )}
    </div>
  );
}

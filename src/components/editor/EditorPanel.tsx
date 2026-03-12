"use client";

import { useCallback } from "react";
import { useMonaco } from "@/hooks/useMonaco";
import { MonacoEditor } from "./MonacoEditor";
import { EditorToolbar } from "./EditorToolbar";
import { AIOutputDrawer } from "./AIOutputDrawer";
import type { AIAction, EditorLanguage } from "@/types/editor";

export function EditorPanel() {
  const {
    content,
    language,
    fileName,
    aiResult,
    isLoadingAI,
    setContent,
    setLanguage,
    setAIResult,
    runAIAction,
    applyResult,
  } = useMonaco();

  const handleSelectionAction = useCallback(
    (action: AIAction, selectedText: string) => {
      runAIAction(action, selectedText);
    },
    [runAIAction]
  );

  const handleToolbarAction = useCallback(
    (action: AIAction) => {
      runAIAction(action);
    },
    [runAIAction]
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        overflow: "hidden",
      }}
    >
      <EditorToolbar
        language={language}
        fileName={fileName}
        isLoading={isLoadingAI}
        onLanguageChange={(lang: EditorLanguage) => setLanguage(lang)}
        onAIAction={handleToolbarAction}
      />

      {/* Editor area */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <MonacoEditor
          value={content}
          language={language}
          onChange={setContent}
          onSelectionAction={handleSelectionAction}
        />
      </div>

      {/* AI Output Drawer (slides up when result available) */}
      {aiResult && (
        <AIOutputDrawer
          result={aiResult}
          onApply={applyResult}
          onClose={() => setAIResult(null)}
        />
      )}
    </div>
  );
}

"use client";

import { useRef, useCallback } from "react";
import Editor, { useMonaco as useMonacoAPI } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import type { EditorLanguage } from "@/types/editor";
import type { AIAction } from "@/types/editor";

interface MonacoEditorProps {
  value: string;
  language: EditorLanguage;
  onChange: (value: string) => void;
  onSelectionAction: (action: AIAction, selectedText: string) => void;
}

export function MonacoEditor({
  value,
  language,
  onChange,
  onSelectionAction,
}: MonacoEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoAPI = useMonacoAPI();

  const handleEditorMount = useCallback(
    (editorInstance: editor.IStandaloneCodeEditor) => {
      editorRef.current = editorInstance;

      if (!monacoAPI) return;

      // Register custom dark Claude theme
      monacoAPI.editor.defineTheme("claude-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "comment", foreground: "6a9955", fontStyle: "italic" },
          { token: "keyword", foreground: "569cd6" },
          { token: "string", foreground: "ce9178" },
          { token: "number", foreground: "b5cea8" },
          { token: "type", foreground: "4ec9b0" },
          { token: "function", foreground: "dcdcaa" },
          { token: "variable", foreground: "9cdcfe" },
        ],
        colors: {
          "editor.background": "#1e1e1e",
          "editor.foreground": "#d4d4d4",
          "editorLineNumber.foreground": "#6b6b6b",
          "editorLineNumber.activeForeground": "#c6c6c6",
          "editor.selectionBackground": "#264f78",
          "editor.lineHighlightBackground": "#2a2a2a",
          "editorCursor.foreground": "#aeafad",
          "editor.findMatchBackground": "#515c6a",
          "editor.findMatchHighlightBackground": "#ea5c0055",
          "scrollbarSlider.background": "#42424240",
          "scrollbarSlider.hoverBackground": "#42424260",
        },
      });
      monacoAPI.editor.setTheme("claude-dark");

      // Add "Ask Claude" context menu actions
      editorInstance.addAction({
        id: "claude-explain",
        label: "Claude: Explain",
        keybindings: [],
        contextMenuGroupId: "claude",
        contextMenuOrder: 1,
        run: (ed) => {
          const selection = ed.getSelection();
          const model = ed.getModel();
          if (selection && model) {
            const text = model.getValueInRange(selection);
            if (text.trim()) onSelectionAction("explain", text);
          }
        },
      });

      editorInstance.addAction({
        id: "claude-refactor",
        label: "Claude: Refactor",
        keybindings: [],
        contextMenuGroupId: "claude",
        contextMenuOrder: 2,
        run: (ed) => {
          const selection = ed.getSelection();
          const model = ed.getModel();
          if (selection && model) {
            const text = model.getValueInRange(selection);
            if (text.trim()) onSelectionAction("refactor", text);
          }
        },
      });

      editorInstance.addAction({
        id: "claude-complete",
        label: "Claude: Complete (Ctrl+Shift+L)",
        keybindings: [
          monacoAPI.KeyMod.CtrlCmd |
            monacoAPI.KeyMod.Shift |
            monacoAPI.KeyCode.KeyL,
        ],
        contextMenuGroupId: "claude",
        contextMenuOrder: 3,
        run: (ed) => {
          const selection = ed.getSelection();
          const model = ed.getModel();
          if (model) {
            const text = selection
              ? model.getValueInRange(selection)
              : model.getValue();
            onSelectionAction("complete", text);
          }
        },
      });
    },
    [monacoAPI, onSelectionAction]
  );

  return (
    <Editor
      value={value}
      language={language}
      theme="claude-dark"
      onChange={(v) => onChange(v ?? "")}
      onMount={handleEditorMount}
      options={{
        fontSize: 13,
        lineHeight: 20,
        fontFamily:
          "'Cascadia Code', 'Fira Code', Consolas, 'Courier New', monospace",
        fontLigatures: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        padding: { top: 12, bottom: 12 },
        renderLineHighlight: "line",
        cursorBlinking: "smooth",
        smoothScrolling: true,
        wordWrap: "off",
        tabSize: 2,
        insertSpaces: true,
        formatOnPaste: true,
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
        scrollbar: {
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8,
        },
      }}
      loading={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "var(--text-muted)",
            fontSize: 13,
          }}
        >
          Loading editor…
        </div>
      }
    />
  );
}

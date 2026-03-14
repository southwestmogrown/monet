"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { useWorkbench } from "@/hooks/useWorkbench";
import { TemplateLibrary } from "./TemplateLibrary";
import { TemplateEditor } from "./TemplateEditor";
import { VariableInputs } from "./VariableInputs";
import { RunOutputPane } from "./RunOutputPane";
import { CompareGrid } from "./CompareGrid";
import { MODELS, type ModelId } from "@/types/chat";
import { Spinner } from "@/components/ui/Spinner";

type Mode = "run" | "compare";

export function WorkbenchPanel() {
  const [mode, setMode] = useState<Mode>("run");

  const {
    templates,
    activeTemplateId,
    variables,
    activeModel,
    lastRun,
    compareResults,
    isRunning,
    isComparing,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setActiveTemplate,
    setVariable,
    setActiveModel,
    runTemplate,
    compareVariants,
    getActiveTemplate,
  } = useWorkbench();

  const template = getActiveTemplate();

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      {/* Template library sidebar */}
      <TemplateLibrary
        templates={templates}
        activeId={activeTemplateId}
        onSelect={setActiveTemplate}
        onCreate={createTemplate}
        onDelete={deleteTemplate}
      />

      {/* Main editing area */}
      {!template ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)" }}>
            Select or create a template to get started.
          </p>
          <button
            onClick={createTemplate}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 16px",
              background: "linear-gradient(135deg, #7C6AF6 0%, #9580FF 100%)",
              border: "none",
              borderRadius: 7,
              cursor: "pointer",
              color: "#fff",
              fontSize: 12,
              fontFamily: "inherit",
            }}
          >
            New Template
          </button>
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Toolbar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderBottom: "1px solid var(--border)",
              background: "var(--bg-sidebar)",
              flexShrink: 0,
            }}
          >
            {/* Mode tabs */}
            {(["run", "compare"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  padding: "4px 12px",
                  background: mode === m ? "var(--accent-dim)" : "none",
                  border: `1px solid ${mode === m ? "rgba(124,106,246,0.3)" : "var(--border)"}`,
                  borderRadius: 6,
                  cursor: "pointer",
                  color: mode === m ? "var(--accent)" : "var(--text-secondary)",
                  fontSize: 11,
                  fontFamily: "inherit",
                  textTransform: "capitalize",
                }}
              >
                {m}
              </button>
            ))}

            {mode === "run" && (
              <>
                {/* Model selector */}
                <select
                  value={activeModel}
                  onChange={(e) => setActiveModel(e.target.value as ModelId)}
                  style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--border)",
                    borderRadius: 5,
                    color: "var(--text-secondary)",
                    fontSize: 11,
                    padding: "2px 8px",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  {MODELS.map((m) => (
                    <option key={m.id} value={m.id} style={{ background: "#0E1422" }}>
                      {m.label}
                    </option>
                  ))}
                </select>

                {/* Run button */}
                <button
                  onClick={runTemplate}
                  disabled={isRunning}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 12px",
                    background: isRunning
                      ? "var(--bg-active)"
                      : "linear-gradient(135deg, #7C6AF6 0%, #9580FF 100%)",
                    border: "none",
                    borderRadius: 6,
                    cursor: isRunning ? "not-allowed" : "pointer",
                    color: "#fff",
                    fontSize: 11,
                    fontFamily: "inherit",
                    opacity: isRunning ? 0.7 : 1,
                  }}
                >
                  {isRunning ? <Spinner size={11} color="#fff" /> : <Play size={11} />}
                  {isRunning ? "Running…" : "Run"}
                </button>
              </>
            )}
          </div>

          {/* Content */}
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              display: "flex",
              gap: 0,
            }}
          >
            {/* Left: editor + variables */}
            <div
              style={{
                width: 380,
                display: "flex",
                flexDirection: "column",
                borderRight: "1px solid var(--border)",
                overflowY: "auto",
                padding: 14,
                gap: 14,
                flexShrink: 0,
              }}
            >
              <TemplateEditor
                name={template.name}
                systemPrompt={template.systemPrompt}
                userMessage={template.userMessage}
                onNameChange={(v) => updateTemplate(template.id, { name: v })}
                onSystemChange={(v) =>
                  updateTemplate(template.id, { systemPrompt: v })
                }
                onUserChange={(v) =>
                  updateTemplate(template.id, { userMessage: v })
                }
              />

              {/* Variables */}
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 8,
                  }}
                >
                  Variables
                </div>
                <VariableInputs
                  systemPrompt={template.systemPrompt}
                  userMessage={template.userMessage}
                  variables={variables}
                  onChange={setVariable}
                />
              </div>
            </div>

            {/* Right: output */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                padding: 14,
              }}
            >
              {mode === "run" ? (
                <RunOutputPane run={lastRun} isLoading={isRunning} />
              ) : (
                <CompareGrid
                  systemPrompt={template.systemPrompt}
                  userMessage={template.userMessage}
                  variables={variables}
                  compareResults={compareResults}
                  isComparing={isComparing}
                  onCompare={compareVariants}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

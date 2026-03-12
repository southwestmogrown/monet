"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { RunOutputPane } from "./RunOutputPane";
import { MODELS, type ModelId } from "@/types/chat";
import type { CompareResult } from "@/types/workbench";
import type { CompareVariant } from "@/stores/workbench-store";

interface CompareGridProps {
  systemPrompt: string;
  userMessage: string;
  variables: Record<string, string>;
  compareResults: CompareResult[];
  isComparing: boolean;
  onCompare: (variants: CompareVariant[]) => void;
}

const DEFAULT_MODELS: ModelId[] = [
  "claude-haiku-4-5-20251001",
  "claude-sonnet-4-6",
];

export function CompareGrid({
  systemPrompt,
  userMessage,
  variables,
  compareResults,
  isComparing,
  onCompare,
}: CompareGridProps) {
  const [variantModels, setVariantModels] =
    useState<ModelId[]>(DEFAULT_MODELS);

  const addVariant = () => {
    if (variantModels.length >= 4) return;
    setVariantModels([...variantModels, "claude-sonnet-4-6"]);
  };

  const removeVariant = (index: number) => {
    if (variantModels.length <= 2) return;
    setVariantModels(variantModels.filter((_, i) => i !== index));
  };

  const handleCompare = () => {
    const variants: CompareVariant[] = variantModels.map((model, i) => ({
      systemPrompt,
      userMessage,
      model,
      label: `Variant ${i + 1} (${MODELS.find((m) => m.id === model)?.label ?? model})`,
    }));
    onCompare(variants);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 12 }}>
      {/* Variant model selectors */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {variantModels.map((model, i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              V{i + 1}:
            </span>
            <select
              value={model}
              onChange={(e) => {
                const updated = [...variantModels];
                updated[i] = e.target.value as ModelId;
                setVariantModels(updated);
              }}
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                color: "var(--text-secondary)",
                fontSize: 11,
                padding: "2px 6px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id} style={{ background: "#333" }}>
                  {m.label}
                </option>
              ))}
            </select>
            {variantModels.length > 2 && (
              <button
                onClick={() => removeVariant(i)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: 1,
                  display: "flex",
                }}
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
        ))}

        {variantModels.length < 4 && (
          <button
            onClick={addVariant}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "none",
              border: "1px dashed var(--border)",
              borderRadius: 4,
              cursor: "pointer",
              color: "var(--text-muted)",
              fontSize: 11,
              padding: "2px 8px",
              fontFamily: "inherit",
            }}
          >
            <Plus size={11} />
            Add variant
          </button>
        )}

        <button
          onClick={handleCompare}
          disabled={isComparing}
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 12px",
            background: isComparing ? "var(--bg-active)" : "var(--accent)",
            border: "none",
            borderRadius: 5,
            cursor: isComparing ? "not-allowed" : "pointer",
            color: "#fff",
            fontSize: 12,
            fontFamily: "inherit",
          }}
        >
          {isComparing ? "Comparing…" : "Compare"}
        </button>
      </div>

      {/* Grid of output panes */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flex: 1,
          overflow: "hidden",
          minHeight: 200,
        }}
      >
        {variantModels.map((model, i) => {
          const result = compareResults.find((r) => r.variantIndex === i);
          const modelLabel =
            MODELS.find((m) => m.id === model)?.label ?? model;
          return (
            <RunOutputPane
              key={i}
              compareResult={result}
              label={`V${i + 1}: ${modelLabel}`}
              isLoading={isComparing && !result}
            />
          );
        })}
      </div>
    </div>
  );
}

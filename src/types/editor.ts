export type EditorLanguage =
  | "typescript"
  | "javascript"
  | "python"
  | "rust"
  | "go"
  | "java"
  | "cpp"
  | "c"
  | "html"
  | "css"
  | "json"
  | "markdown"
  | "shell"
  | "yaml"
  | "plaintext";

export const LANGUAGES: { id: EditorLanguage; label: string }[] = [
  { id: "typescript", label: "TypeScript" },
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "rust", label: "Rust" },
  { id: "go", label: "Go" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
  { id: "c", label: "C" },
  { id: "html", label: "HTML" },
  { id: "css", label: "CSS" },
  { id: "json", label: "JSON" },
  { id: "markdown", label: "Markdown" },
  { id: "shell", label: "Shell" },
  { id: "yaml", label: "YAML" },
  { id: "plaintext", label: "Plain Text" },
];

export type AIAction = "explain" | "refactor" | "complete";

export interface AIResult {
  action: AIAction;
  input: string;
  output: string;
}

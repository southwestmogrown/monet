/**
 * Extracts all unique variable names from a template string.
 * Variables use {{double_braces}} syntax.
 */
export function extractVariables(template: string): string[] {
  const matches = template.matchAll(/\{\{(\w+)\}\}/g);
  const vars = new Set<string>();
  for (const match of matches) {
    vars.add(match[1]);
  }
  return Array.from(vars);
}

/**
 * Fills in all {{variable}} placeholders with provided values.
 * Missing variables are left as-is.
 */
export function fillTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, name) => {
    return variables[name] ?? match;
  });
}

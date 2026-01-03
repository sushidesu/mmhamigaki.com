export function parseFrontmatter(content: string): {
  data: Record<string, any>;
  content: string;
} {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { data: {}, content };
  }

  const [, yamlContent, markdown] = match;
  const data = parseSimpleYaml(yamlContent);

  return { data, content: markdown };
}

function parseSimpleYaml(yaml: string): Record<string, any> {
  const data: Record<string, any> = {};
  const lines = yaml.split("\n");

  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      data[key] = parseYamlValue(value.trim());
    }
  }

  return data;
}

function parseYamlValue(value: string): any {
  // Handle strings
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }

  // Handle arrays
  if (value.startsWith("[") && value.endsWith("]")) {
    return value
      .slice(1, -1)
      .split(",")
      .map((v) => v.trim().replace(/"/g, ""));
  }

  // Handle booleans
  if (value === "true") return true;
  if (value === "false") return false;

  // Handle numbers
  if (!isNaN(Number(value))) return Number(value);

  // Default to string
  return value;
}

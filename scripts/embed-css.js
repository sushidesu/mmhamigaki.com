import { readFileSync, writeFileSync } from "fs";

const css = readFileSync("./src/styles/output.css", "utf-8");
// Escape backticks and ${} in CSS for template literal
const escapedCss = css.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
const module = `// Auto-generated - do not edit\nexport const globalStyles = \`${escapedCss}\`;\n`;
writeFileSync("./src/lib/styles.ts", module);
console.log("✓ CSS embedded successfully");

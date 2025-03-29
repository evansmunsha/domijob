import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
// @ts-ignore
import inngestPlugin from "@inngest/eslint-plugin";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: {
      "@inngest": inngestPlugin, // Use object format for plugins
    },
    rules: {
      "@inngest/await-inngest-send": "error",
    },
  },
];

export default eslintConfig;

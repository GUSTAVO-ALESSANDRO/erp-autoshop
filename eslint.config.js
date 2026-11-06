import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    // Ignora pastas geradas automaticamente para o linter não varrer arquivos desnecessários
    ignores: ["coverage/**", "node_modules/**", "dist/**"]
  },
  { 
    files: ["**/*.{js,mjs,cjs}"], 
    plugins: { js }, 
    extends: ["js/recommended"], 
    languageOptions: { 
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest
      } 
    },
    rules: {
      // Configura o ESLint para ignorar parâmetros não utilizados que comecem com _
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
    }
  },
]);
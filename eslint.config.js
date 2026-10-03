import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { 
    files: ["**/*.{js,mjs,cjs}"], 
    plugins: { js }, 
    extends: ["js/recommended"], 
    languageOptions: { 
      globals: {
        ...globals.browser,
        ...globals.node,    // Habilita o 'process' e variáveis globais do Node.js
        ...globals.jest     // Habilita 'test', 'expect', 'describe', etc.
      } 
    } 
  },
]);
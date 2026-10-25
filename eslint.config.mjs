import next from "eslint-config-next/core-web-vitals";
import ts from "eslint-config-next/typescript";
export default [...next, ...ts, { rules: {
  "@next/next/no-html-link-for-pages": "off",
  "@next/next/no-page-custom-font": "off",
  "react-hooks/set-state-in-effect": "off",
  "react-hooks/refs": "off"
}}];

import type { Config } from "tailwindcss";
import sharedConfig from "@ai-commerce/ui/tailwind.config";

const config: Config = {
  ...sharedConfig,
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}"
  ]
};

export default config;

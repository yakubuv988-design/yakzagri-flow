import type { StorybookConfig } from "@storybook/nextjs";

const config: StorybookConfig = {
  framework: "@storybook/nextjs",
  stories: ["../src/**/*.stories.tsx"],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding",
  ],
  docs: {
    autodocs: true,
  },
  webpackFinal: async (config) => {
    return config;
  },
};

export default config;

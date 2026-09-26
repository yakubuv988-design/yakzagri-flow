import type { Preview } from "@storybook/react";
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    layout: "centered",
    docs: {
      canvas: { sourceState: "shown" },
    },
  },
};

export default preview;

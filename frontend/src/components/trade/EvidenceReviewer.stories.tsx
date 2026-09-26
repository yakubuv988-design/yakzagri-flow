import type { Meta, StoryObj } from "@storybook/react";
import { EvidenceReviewer } from "@/components/trade/EvidenceReviewer";

const meta: Meta<typeof EvidenceReviewer> = {
  component: EvidenceReviewer,
  title: "Trade/EvidenceReviewer",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const BothLoading: Story = {
  args: {
    buyerVideoUrl: null,
    driverVideoUrl: null,
    buyerVideoLoadState: "loading",
    driverVideoLoadState: "loading",
  },
};

export const BothReady: Story = {
  args: {
    buyerVideoUrl: "https://commondatastorage.googleapis.com/gtv-videos-library/sample/big_buck_bunny.mp4",
    driverVideoUrl: "https://commondatastorage.googleapis.com/gtv-videos-library/sample/big_buck_bunny.mp4",
    buyerVideoLoadState: "ready",
    driverVideoLoadState: "ready",
  },
};

export const BothError: Story = {
  args: {
    buyerVideoUrl: null,
    driverVideoUrl: null,
    buyerVideoLoadState: "error",
    driverVideoLoadState: "error",
  },
};

export const OnlyBuyer: Story = {
  args: {
    buyerVideoUrl: "https://commondatastorage.googleapis.com/gtv-videos-library/sample/big_buck_bunny.mp4",
    driverVideoUrl: null,
    buyerVideoLoadState: "ready",
    driverVideoLoadState: "loading",
  },
};

export const OnlyDriver: Story = {
  args: {
    buyerVideoUrl: null,
    driverVideoUrl: "https://commondatastorage.googleapis.com/gtv-videos-library/sample/big_buck_bunny.mp4",
    buyerVideoLoadState: "loading",
    driverVideoLoadState: "ready",
  },
};

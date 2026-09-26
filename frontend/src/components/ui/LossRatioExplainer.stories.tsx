import type { Meta, StoryObj } from "@storybook/react";
import { LossRatioExplainer } from "@/components/ui/LossRatioExplainer";

const meta: Meta<typeof LossRatioExplainer> = {
  component: LossRatioExplainer,
  title: "UI/LossRatioExplainer",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    buyerRatio: 50,
    sellerRatio: 50,
    compact: false,
  },
};

export const CompactMode: Story = {
  args: {
    buyerRatio: 50,
    sellerRatio: 50,
    compact: true,
  },
};

export const Buyer70: Story = {
  args: {
    buyerRatio: 70,
    sellerRatio: 30,
    compact: false,
  },
};

export const Seller70: Story = {
  args: {
    buyerRatio: 30,
    sellerRatio: 70,
    compact: false,
  },
};

export const Extreme: Story = {
  args: {
    buyerRatio: 100,
    sellerRatio: 0,
    compact: false,
  },
};

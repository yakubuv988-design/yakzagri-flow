import type { Meta, StoryObj } from "@storybook/react";
import { ResolutionForm } from "@/components/trade/ResolutionForm";

const meta: Meta<typeof ResolutionForm> = {
  component: ResolutionForm,
  title: "Trade/ResolutionForm",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    tradeId: "12345",
    totalAmount: 100000,
    currency: "NGN",
    isSubmitting: false,
  },
};

export const Submitting: Story = {
  args: {
    tradeId: "12345",
    totalAmount: 100000,
    currency: "NGN",
    isSubmitting: true,
  },
};

export const LargeAmount: Story = {
  args: {
    tradeId: "98765",
    totalAmount: 500000,
    currency: "NGN",
    isSubmitting: false,
  },
};

export const WithHandler: Story = {
  args: {
    tradeId: "54321",
    totalAmount: 250000,
    currency: "NGN",
    isSubmitting: false,
    onSubmit: (resolution) => {
      console.log("Resolution submitted:", resolution);
      alert(`Split: ${resolution.sellerGetsBps / 100}% to seller\nNotes: ${resolution.notes}`);
    },
  },
};

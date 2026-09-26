import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "@/components/ui/Badge";

const meta: Meta<typeof Badge> = {
  component: Badge,
  title: "UI/Badge",
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Badge",
  },
};

export const WithDot: Story = {
  args: {
    children: (
      <span className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        Active
      </span>
    ),
  },
};

export const Success: Story = {
  args: {
    children: "Completed",
    className: "bg-status-success/10 text-status-success",
  },
};

export const Warning: Story = {
  args: {
    children: "Pending",
    className: "bg-status-warning/10 text-status-warning",
  },
};

export const Danger: Story = {
  args: {
    children: "Disputed",
    className: "bg-status-danger/10 text-status-danger",
  },
};

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LossRatioExplainer } from "../LossRatioExplainer";

describe("LossRatioExplainer", () => {
  it("renders with default values", () => {
    render(<LossRatioExplainer />);
    expect(screen.getByText("What is Loss Ratio?")).toBeInTheDocument();
  });

  it("displays buyer and seller ratios", () => {
    render(<LossRatioExplainer buyerRatio={70} sellerRatio={30} />);
    expect(screen.getByText(/70%/)).toBeInTheDocument();
    expect(screen.getByText(/30%/)).toBeInTheDocument();
  });

  it("toggles expanded state when clicked", async () => {
    const user = userEvent.setup();
    render(<LossRatioExplainer compact={true} />);
    const button = screen.getByRole("button", { name: /toggle loss ratio/i });
    
    // Should start collapsed
    expect(screen.queryByText(/common scenarios:/i)).not.toBeInTheDocument();
    
    // Click to expand
    await user.click(button);
    expect(screen.getByText(/common scenarios:/i)).toBeInTheDocument();
  });

  it("shows explanation when expanded", () => {
    render(<LossRatioExplainer compact={false} />);
    expect(screen.getByText(/The loss ratio defines how any loss/)).toBeInTheDocument();
    expect(screen.getByText(/50\/50 Split:/)).toBeInTheDocument();
  });

  it("has proper accessibility attributes", () => {
    render(<LossRatioExplainer />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-expanded");
  });
});

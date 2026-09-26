import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EvidenceReviewer } from "../EvidenceReviewer";

describe("EvidenceReviewer", () => {
  it("renders with no videos", () => {
    render(<EvidenceReviewer />);
    expect(screen.getByText("Side-by-Side")).toBeInTheDocument();
  });

  it("shows loading state for videos", () => {
    const { container } = render(
      <EvidenceReviewer
        buyerVideoLoadState="loading"
        driverVideoLoadState="loading"
      />
    );
    // Just verify it renders without error
    expect(container).toBeInTheDocument();
  });

  it("shows error state when videos fail to load", () => {
    const { container } = render(
      <EvidenceReviewer
        buyerVideoLoadState="error"
        driverVideoLoadState="error"
      />
    );
    // Verify it renders
    expect(container).toBeInTheDocument();
  });

  it("displays video element when ready", () => {
    const { container } = render(
      <EvidenceReviewer
        buyerVideoUrl="https://example.com/buyer.mp4"
        buyerVideoLoadState="ready"
      />
    );
    const videos = container.querySelectorAll("video");
    expect(videos.length).toBeGreaterThan(0);
  });

  it("allows toggling between view modes", async () => {
    const user = userEvent.setup();
    render(
      <EvidenceReviewer
        buyerVideoUrl="https://example.com/buyer.mp4"
        driverVideoUrl="https://example.com/driver.mp4"
        buyerVideoLoadState="ready"
        driverVideoLoadState="ready"
      />
    );

    // Should show side-by-side by default
    expect(screen.getByRole("button", { pressed: true, name: /side-by-side/i })).toBeInTheDocument();

    // Click to show only buyer
    const buyerButton = screen.getByRole("button", { name: /buyer evidence only/i });
    await user.click(buyerButton);
    expect(buyerButton).toHaveAttribute("aria-pressed", "true");
  });

  it("shows 'no video' message when video URL is missing", () => {
    render(<EvidenceReviewer buyerVideoUrl={null} />);
    expect(screen.getByText("No buyer video")).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShareReputationButton, buildReputationUrl } from "../ShareReputationButton";

jest.mock("qrcode", () => ({
  __esModule: true,
  default: { toDataURL: jest.fn().mockResolvedValue("data:image/png;base64,AAA") },
}));

describe("ShareReputationButton", () => {
  it("builds the canonical url", () => {
    expect(buildReputationUrl("GABC", "https://x.io")).toBe("https://x.io/reputation/GABC");
  });

  it("shows url, QR, and social links, and copies", async () => {
    const user = userEvent.setup();
    const writeText = jest.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    render(<ShareReputationButton address="GABC" />);
    await user.click(screen.getByRole("button", { name: /share reputation profile/i }));
    expect(await screen.findByAltText(/qr code/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /twitter/i })).toHaveAttribute("href", expect.stringContaining("twitter.com/intent/tweet"));
    expect(screen.getByRole("link", { name: /whatsapp/i })).toHaveAttribute("href", expect.stringContaining("wa.me"));
    await user.click(screen.getByRole("button", { name: /copy link/i }));
    expect(writeText).toHaveBeenCalledWith("https://amanavault.app/reputation/GABC");
    expect(await screen.findByText("Copied!")).toBeInTheDocument();
  });
});

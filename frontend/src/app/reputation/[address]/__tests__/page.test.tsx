import { render, screen } from "@testing-library/react";
import UserReputationPage from "../page";

const mockGet = jest.fn();

jest.mock("next/navigation", () => ({ useParams: () => ({ address: "GABC" }) }));
jest.mock("@/lib/api", () => ({
  api: { reputation: { getUserReputation: (...a: unknown[]) => mockGet(...a) } },
}));

const base = { trustScore: 90, totalTrades: 5, completedTrades: 4, disputedTrades: 1, successRate: 80, history: [] };

describe("UserReputationPage cooperative badge", () => {
  it("shows name, registration id, checkmark and tooltip when verified", async () => {
    mockGet.mockResolvedValue({
      ...base,
      cooperative: { name: "AFAN", registrationId: "AF-123", verified: true, verificationSource: "AFAN registry", accreditationDate: "2024-03-01" },
    });
    render(<UserReputationPage />);
    const badge = await screen.findByTestId("cooperative-badge");
    expect(badge).toHaveTextContent("AFAN");
    expect(badge).toHaveTextContent("AF-123");
    expect(screen.getByRole("img", { name: /verified/i })).toBeInTheDocument();
    expect(badge.getAttribute("title")).toContain("AFAN registry");
  });

  it("handles independent producers gracefully", async () => {
    mockGet.mockResolvedValue(base);
    render(<UserReputationPage />);
    expect(await screen.findByTestId("cooperative-badge-independent")).toBeInTheDocument();
  });

  it("omits the checkmark when unverified", async () => {
    mockGet.mockResolvedValue({ ...base, cooperative: { name: "RIFAN", verified: false } });
    render(<UserReputationPage />);
    await screen.findByTestId("cooperative-badge");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

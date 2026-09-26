import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResolutionForm } from "../ResolutionForm";

describe("ResolutionForm", () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it("renders form fields", () => {
    render(
      <ResolutionForm
        tradeId="12345"
        onSubmit={mockOnSubmit}
      />
    );
    
    expect(screen.getByLabelText(/why this split\?/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/resolution notes/i)).toBeInTheDocument();
  });

  it("shows split options", () => {
    render(
      <ResolutionForm
        tradeId="12345"
        onSubmit={mockOnSubmit}
      />
    );
    
    expect(screen.getByRole("radio", { name: /50\/50 split/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /buyer 30% \/ seller 70%/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /buyer 70% \/ seller 30%/i })).toBeInTheDocument();
  });

  it("displays custom split slider when custom option selected", async () => {
    const user = userEvent.setup();
    render(
      <ResolutionForm
        tradeId="12345"
        onSubmit={mockOnSubmit}
      />
    );

    const customRadio = screen.getByRole("radio", { name: /custom split/i });
    await user.click(customRadio);

    const slider = screen.getByRole("slider");
    expect(slider).toBeInTheDocument();
  });

  it("shows split summary", () => {
    const { container } = render(
      <ResolutionForm
        tradeId="12345"
        totalAmount={100000}
        currency="NGN"
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText(/proposed distribution/i)).toBeInTheDocument();
    // The text is split across elements
    const pageText = container.textContent || "";
    expect(pageText).toContain("Buyer receives");
    expect(pageText).toContain("Seller receives");
  });

  it("validates required fields before submit", async () => {
    const user = userEvent.setup();
    render(
      <ResolutionForm
        tradeId="12345"
        onSubmit={mockOnSubmit}
      />
    );

    const submitButton = screen.getByRole("button", { name: /submit resolution/i });
    await user.click(submitButton);

    expect(screen.getByText(/please explain your split decision/i)).toBeInTheDocument();
    expect(screen.getByText(/please document your resolution/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("submits form with valid data", async () => {
    const user = userEvent.setup();
    render(
      <ResolutionForm
        tradeId="12345"
        onSubmit={mockOnSubmit}
      />
    );

    const rationaleField = screen.getByLabelText(/why this split\?/i);
    const notesField = screen.getByLabelText(/resolution notes/i);
    const submitButton = screen.getByRole("button", { name: /submit resolution/i });

    await user.type(rationaleField, "Both parties shared some responsibility");
    await user.type(notesField, "Evidence showed partial loss. 50/50 split is fair.");
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        sellerGetsBps: 5000, // 50%
        notes: "Evidence showed partial loss. 50/50 split is fair.",
        splitRationale: "Both parties shared some responsibility",
      })
    );
  });

  it("disables submit button when submitting", () => {
    render(
      <ResolutionForm
        tradeId="12345"
        onSubmit={mockOnSubmit}
        isSubmitting={true}
      />
    );

    const submitButton = screen.getByRole("button", { name: /submitting resolution/i });
    expect(submitButton).toBeDisabled();
  });

  it("shows warning about irreversible action", () => {
    render(
      <ResolutionForm
        tradeId="12345"
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText(/warning:/i)).toBeInTheDocument();
    expect(screen.getByText(/this resolution will be submitted on-chain/i)).toBeInTheDocument();
  });
});

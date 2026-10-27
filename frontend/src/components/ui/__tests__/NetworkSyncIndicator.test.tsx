import { render, screen, fireEvent } from "@testing-library/react";
import { useOfflineQueueStore } from "@/stores/offlineQueueStore";
import { NetworkSyncIndicator } from "../NetworkSyncIndicator";

const mockUseOffline = jest.fn();

jest.mock("@/hooks/useOffline", () => ({
  useOffline: () => mockUseOffline(),
}));

describe("NetworkSyncIndicator", () => {
  beforeEach(() => {
    useOfflineQueueStore.setState({ queue: [], isOnline: true });
    jest.clearAllMocks();
  });

  it("renders online status when network is connected and queue is empty", () => {
    mockUseOffline.mockReturnValue({
      isOffline: false,
      isOnline: true,
      retryOnline: jest.fn(),
    });

    render(<NetworkSyncIndicator />);
    expect(screen.getByRole("status")).toHaveTextContent("Online");
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Network online. All actions synced."
    );
  });

  it("renders syncing status when online but pending actions are in the queue", () => {
    mockUseOffline.mockReturnValue({
      isOffline: false,
      isOnline: true,
      retryOnline: jest.fn(),
    });

    useOfflineQueueStore.setState({
      queue: [
        {
          id: "action-1",
          type: "create-trade",
          endpoint: "/api/trades",
          method: "POST",
          idempotencyKey: "key-1",
          correlationId: "corr-1",
          createdAt: new Date().toISOString(),
          attempts: 1,
        },
      ],
      isOnline: true,
    });

    render(<NetworkSyncIndicator />);
    expect(screen.getByRole("status")).toHaveTextContent("Syncing (1)");
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Synchronizing 1 queued actions."
    );
  });

  it("renders offline status with count and allows opening the queue drawer", () => {
    const mockRetry = jest.fn();
    mockUseOffline.mockReturnValue({
      isOffline: true,
      isOnline: false,
      retryOnline: mockRetry,
    });

    useOfflineQueueStore.setState({
      queue: [
        {
          id: "action-2",
          type: "deposit",
          endpoint: "/api/trades/123/deposit",
          method: "POST",
          idempotencyKey: "key-2",
          correlationId: "corr-2",
          createdAt: new Date().toISOString(),
          attempts: 0,
        },
      ],
      isOnline: false,
    });

    render(<NetworkSyncIndicator />);
    const button = screen.getByRole("status");
    expect(button).toHaveTextContent("Offline (1)");

    // Open queued actions dropdown
    fireEvent.click(button);
    expect(screen.getByRole("dialog", { name: "Offline queued actions" })).toBeInTheDocument();
    expect(screen.getByText("DEPOSIT")).toBeInTheDocument();
    expect(screen.getByText("POST /api/trades/123/deposit")).toBeInTheDocument();

    // Trigger retry
    const retryBtn = screen.getByText("Retry connection");
    fireEvent.click(retryBtn);
    expect(mockRetry).toHaveBeenCalled();

    // Remove item from queue
    const cancelBtn = screen.getByTitle("Remove from queue");
    fireEvent.click(cancelBtn);
    expect(useOfflineQueueStore.getState().queue).toHaveLength(0);
  });
});

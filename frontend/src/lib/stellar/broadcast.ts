import { apiConfig } from "../api";
import { trackFailure } from "@/lib/analytics";

export interface BroadcastResponse {
  hash: string;
}

/**
 * RPC endpoints to try in order: the configured one, then any listed in
 * NEXT_PUBLIC_STELLAR_RPC_FALLBACK_URLS (comma separated) (#418).
 */
function rpcEndpoints(): string[] {
  const primary = apiConfig.getStellarRpcUrl();
  const fallbacks = (process.env.NEXT_PUBLIC_STELLAR_RPC_FALLBACK_URLS ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter((url) => url && url !== primary);
  return [primary, ...fallbacks];
}

/**
 * Broadcast a signed transaction XDR to the Stellar RPC via `sendTransaction`.
 * A network error or a 5xx response moves on to the next endpoint, and each
 * failover is reported to analytics (#418). A 4xx or an RPC error is final.
 */
export async function broadcastTransaction(signedTxXdr: string): Promise<BroadcastResponse> {
  const endpoints = rpcEndpoints();

  for (let index = 0; index < endpoints.length; index++) {
    const hasNext = index < endpoints.length - 1;

    let submitResponse: Response;
    try {
      submitResponse = await fetch(endpoints[index], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "sendTransaction",
          params: { transaction: signedTxXdr },
        }),
      });
    } catch (error) {
      if (!hasNext) throw error;
      trackFailure("rpc_failover", { attempt: index + 1, of: endpoints.length, status: 0 });
      continue;
    }

    if (submitResponse.status >= 500 && hasNext) {
      trackFailure("rpc_failover", { attempt: index + 1, of: endpoints.length, status: submitResponse.status });
      continue;
    }

    const submitResult = await submitResponse.json().catch(() => null);

    if (!submitResponse.ok || submitResult?.error) {
      const message =
        submitResult?.error?.message ||
        (typeof submitResult?.error === "string" ? submitResult.error : null) ||
        `Transaction submission to Stellar failed with status ${submitResponse.status}`;
      throw new Error(message);
    }

    const hash = submitResult?.result?.hash || submitResult?.result?.txHash || "";
    return { hash };
  }

  throw new Error("No Stellar RPC endpoint is configured");
}

export type PollTransactionStatus = "SUCCESS" | "FAILED" | "TIMEOUT";

export interface PollTransactionSuccess {
  status: "SUCCESS";
  hash: string;
  ledger: number;
  resultXdr?: string;
}

export interface PollTransactionFailure {
  status: "FAILED" | "TIMEOUT";
  hash: string;
  ledger?: number;
  resultXdr?: string;
  error: string;
}

export type PollTransactionResult = PollTransactionSuccess | PollTransactionFailure;

export interface PollTransactionOptions {
  /** Maximum total time to poll before giving up. Defaults to 30s. */
  timeoutMs?: number;
  /** Initial delay between polls. Defaults to 500ms. */
  initialDelayMs?: number;
  /** Maximum delay between polls. Defaults to 4000ms. */
  maxDelayMs?: number;
  /** Multiplier applied to the delay after each poll. Defaults to 1.5. */
  backoffFactor?: number;
  /** Optional abort signal to cancel polling. */
  signal?: AbortSignal;
}

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_INITIAL_DELAY_MS = 500;
const DEFAULT_MAX_DELAY_MS = 4_000;
const DEFAULT_BACKOFF_FACTOR = 1.5;

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Polling aborted"));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new Error("Polling aborted"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function extractErrorMessage(result: any): string {
  if (!result) return "Transaction failed";
  const status = result?.status;
  const resultXdr = result?.resultXdr;
  const errorResultXdr = result?.errorResultXdr;
  const messages: string[] = [];
  if (status) messages.push(`Transaction status: ${status}`);
  if (errorResultXdr) messages.push(`errorResultXdr: ${errorResultXdr}`);
  if (resultXdr) messages.push(`resultXdr: ${resultXdr}`);
  if (result?.resultMetaXdr) messages.push(`resultMetaXdr: ${result.resultMetaXdr}`);
  return messages.length > 0 ? messages.join("; ") : "Transaction failed";
}

/**
 * Poll Soroban RPC `getTransaction` for a submitted transaction hash until it
 * reaches a terminal state (SUCCESS/FAILED) or the timeout elapses.
 *
 * Uses bounded exponential backoff between polls.
 */
export async function pollTransaction(
  hash: string,
  options: PollTransactionOptions = {},
): Promise<PollTransactionResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const initialDelayMs = options.initialDelayMs ?? DEFAULT_INITIAL_DELAY_MS;
  const maxDelayMs = options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
  const backoffFactor = options.backoffFactor ?? DEFAULT_BACKOFF_FACTOR;
  const signal = options.signal;

  const start = Date.now();
  let delay = initialDelayMs;
  let lastError: string | undefined;

  while (Date.now() - start < timeoutMs) {
    if (signal?.aborted) {
      return {
        status: "TIMEOUT",
        hash,
        error: "Polling aborted before transaction confirmed",
      };
    }

    try {
      const response = await fetch(apiConfig.getStellarRpcUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getTransaction",
          params: { hash },
        }),
        signal,
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || payload?.error) {
        lastError =
          payload?.error?.message ||
          (typeof payload?.error === "string" ? payload.error : null) ||
          `getTransaction failed with status ${response.status}`;
      } else {
        const result = payload?.result;
        const status = result?.status;

        if (status === "SUCCESS") {
          return {
            status: "SUCCESS",
            hash,
            ledger: Number(result?.ledger ?? 0),
            resultXdr: result?.resultXdr,
          };
        }

        if (status === "FAILED") {
          return {
            status: "FAILED",
            hash,
            ledger: result?.ledger != null ? Number(result.ledger) : undefined,
            resultXdr: result?.resultXdr ?? result?.errorResultXdr,
            error: extractErrorMessage(result),
          };
        }

        // NOT_FOUND or PENDING — keep polling.
        if (status && status !== "NOT_FOUND" && status !== "PENDING") {
          lastError = `Unexpected transaction status: ${status}`;
        }
      }
    } catch (err) {
      if (signal?.aborted) {
        return {
          status: "TIMEOUT",
          hash,
          error: "Polling aborted before transaction confirmed",
        };
      }
      lastError = err instanceof Error ? err.message : String(err);
    }

    const remaining = timeoutMs - (Date.now() - start);
    if (remaining <= 0) break;

    const wait = Math.min(delay, remaining);
    try {
      await sleep(wait, signal);
    } catch {
      return {
        status: "TIMEOUT",
        hash,
        error: "Polling aborted before transaction confirmed",
      };
    }
    delay = Math.min(delay * backoffFactor, maxDelayMs);
  }

  return {
    status: "TIMEOUT",
    hash,
    error:
      lastError ||
      `Timed out after ${timeoutMs}ms waiting for transaction ${hash} to confirm`,
  };
}
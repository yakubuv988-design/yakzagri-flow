/**
 * Contract verification tests for the dispute resolution payload schema.
 *
 * These tests pin the payload shape mediators submit when resolving a
 * Proof-of-Delivery dispute so the frontend cannot drift from the backend API
 * contract (which rejects malformed payloads with 400 Bad Request).
 */
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  LOSS_BPS_SUM,
  isValidStellarAddress,
  stellarPublicKey,
} from "../trade";

const VALID_MEDIATOR = "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H";
const VALID_BUYER = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";
const VALID_SELLER = "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ";

const disputeSplit = z.object({
  address: stellarPublicKey,
  lossBps: z
    .number()
    .int("Must be a whole number")
    .min(0, "Cannot be below 0")
    .max(LOSS_BPS_SUM, `Cannot exceed ${LOSS_BPS_SUM}`),
});

const disputeResolutionSchema = z
  .object({
    tradeId: z.string().min(1, "tradeId is required"),
    mediatorAddress: stellarPublicKey,
    splits: z.array(disputeSplit).min(1, "At least one split is required"),
    mediatorSignature: z.string().min(1, "mediatorSignature is required"),
    buyerSignature: z.string().min(1, "buyerSignature is required"),
    sellerSignature: z.string().min(1, "sellerSignature is required"),
  })
  .superRefine((data, ctx) => {
    const total = data.splits.reduce((sum, split) => sum + split.lossBps, 0);
    if (total !== LOSS_BPS_SUM) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `splits must sum to ${LOSS_BPS_SUM}`,
        path: ["splits"],
      });
    }
  });

function validPayload() {
  return {
    tradeId: "trade_123",
    mediatorAddress: VALID_MEDIATOR,
    splits: [
      { address: VALID_BUYER, lossBps: 6_000 },
      { address: VALID_SELLER, lossBps: 4_000 },
    ],
    mediatorSignature: "sig_mediator",
    buyerSignature: "sig_buyer",
    sellerSignature: "sig_seller",
  };
}

describe("dispute resolution payload schema", () => {
  it("accepts a valid payload whose splits sum to 100%", () => {
    const result = disputeResolutionSchema.safeParse(validPayload());
    expect(result.success).toBe(true);
  });

  it("accepts a single split covering the full 100%", () => {
    const payload = validPayload();
    payload.splits = [{ address: VALID_BUYER, lossBps: LOSS_BPS_SUM }];
    expect(disputeResolutionSchema.safeParse(payload).success).toBe(true);
  });

  it("rejects splits that do not sum to 100%", () => {
    const payload = validPayload();
    payload.splits = [
      { address: VALID_BUYER, lossBps: 5_000 },
      { address: VALID_SELLER, lossBps: 4_000 },
    ];
    const result = disputeResolutionSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        `splits must sum to ${LOSS_BPS_SUM}`,
      );
      expect(result.error.issues[0].path).toEqual(["splits"]);
    }
  });

  it("rejects splits that exceed 100%", () => {
    const payload = validPayload();
    payload.splits = [
      { address: VALID_BUYER, lossBps: 7_000 },
      { address: VALID_SELLER, lossBps: 4_000 },
    ];
    const result = disputeResolutionSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        `splits must sum to ${LOSS_BPS_SUM}`,
      );
    }
  });

  it("rejects a payload with missing signatures", () => {
    const payload = validPayload();
    delete (payload as Partial<typeof payload>).mediatorSignature;
    const result = disputeResolutionSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(messages).toContain("mediatorSignature is required");
    }
  });

  it("rejects a payload with an empty signature", () => {
    const payload = validPayload();
    payload.buyerSignature = "";
    const result = disputeResolutionSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "buyerSignature is required",
      );
    }
  });

  it("rejects malformed addresses", () => {
    const payload = validPayload();
    payload.splits = [
      { address: "not-a-stellar-address", lossBps: 6_000 },
      { address: VALID_SELLER, lossBps: 4_000 },
    ];
    const result = disputeResolutionSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid Stellar address");
      expect(result.error.issues[0].path).toEqual(["splits", 0, "address"]);
    }
  });

  it("rejects a malformed mediator address", () => {
    const payload = validPayload();
    payload.mediatorAddress = "GINVALID";
    const result = disputeResolutionSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid Stellar address");
    }
  });

  it("rejects an empty splits array", () => {
    const payload = validPayload();
    payload.splits = [];
    const result = disputeResolutionSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "At least one split is required",
      );
    }
  });

  it("validates addresses with the shared Stellar helper", () => {
    expect(isValidStellarAddress(VALID_MEDIATOR)).toBe(true);
    expect(isValidStellarAddress("not-a-stellar-address")).toBe(false);
  });
});

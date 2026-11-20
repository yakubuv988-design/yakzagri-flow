import { z } from 'zod';

/**
 * Dispute resolution payload schemas.
 *
 * These schemas mirror the backend API contract for mediator-submitted
 * dispute resolutions. Payloads that fail validation would otherwise be
 * rejected at runtime with a 400 Bad Request.
 */

const stellarAddress = z
  .string()
  .regex(/^G[A-Z2-7]{55}$/, 'Invalid Stellar address');

const splitSchema = z.object({
  address: stellarAddress,
  percentage: z
    .number()
    .min(0, 'Split percentage must be between 0 and 100')
    .max(100, 'Split percentage must be between 0 and 100'),
});

const signatureSchema = z.object({
  signer: stellarAddress,
  signature: z.string().min(1, 'Signature is required'),
});

export const disputeResolutionSchema = z
  .object({
    disputeId: z.string().min(1, 'Dispute ID is required'),
    resolution: z.enum(['release', 'refund', 'split']),
    splits: z.array(splitSchema).min(1, 'At least one split is required'),
    signatures: z.array(signatureSchema).min(1, 'At least one signature is required'),
    notes: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    const total = value.splits.reduce((sum, split) => sum + split.percentage, 0);
    if (total !== 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['splits'],
        message: 'Split percentages must sum to 100',
      });
    }
  });

export type DisputeResolution = z.infer<typeof disputeResolutionSchema>;

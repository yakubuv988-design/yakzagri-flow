# Mediator Handbook

Operational guide for independent agricultural arbitrators reviewing disputes on the
Farm2Fork escrow protocol. This handbook covers the dispute review workflow, evidence
standards, and the multi-sig signing procedure used to release or refund escrowed funds.

> Scope: this guide is for mediators only. It does not describe farmer or buyer flows.

---

## 1. Role of a mediator

A mediator is an independent party added to a dispute's multi-sig set. You do **not**
hold custody of funds. You review evidence, decide the outcome (release, refund, or
split), and co-sign the resolution transaction alongside the other required signers.

Key principles:

- **Neutrality** — decide only on the evidence in the dispute record.
- **Traceability** — every decision must reference the evidence you relied on.
- **Least privilege** — sign only the resolution you have reviewed; never sign blind.

---

## 2. Dispute review workflow

1. **Acknowledge the dispute.** Open the dispute record and confirm the escrow amount,
   the parties involved, and the required signature threshold.
2. **Collect evidence.** Gather the video proof-of-delivery, the shipment manifest, and
   any supporting photos or notes attached to the dispute.
3. **Verify evidence** using the checklist in section 3.
4. **Determine the outcome** using the loss-ratio guidance in section 4.
5. **Prepare the resolution** (release / refund / split) and record your rationale.
6. **Co-sign** the resolution transaction with Freighter (section 5).
7. **Confirm finalization.** Once the threshold is met, verify the transaction is
   finalized on-chain and the escrow is settled.

---

## 3. Evidence verification checklist

Work through each item and note pass/fail in the dispute record.

### 3.1 Seal verification

- [ ] The delivery video shows the **security seal** on the package/container.
- [ ] The seal ID in the video **matches** the seal ID recorded in the manifest.
- [ ] The seal is **intact at the start** of the video (before opening).
- [ ] Any break or tamper is shown clearly and timestamped.
- [ ] The video is continuous — no cuts between seal check and contents inspection.

### 3.2 Manifest inspection

- [ ] The manifest lists every item, quantity, and unit of measure.
- [ ] Quantities in the video **match** the manifest line items.
- [ ] Item condition (spoilage, damage, contamination) is visible and described.
- [ ] Discrepancies are itemized — do not accept a blanket "short shipment" claim.
- [ ] The manifest hash/ID matches the one referenced in the dispute record.

### 3.3 General evidence standards

- [ ] Video is unedited and shows a continuous timeline.
- [ ] Timestamps are consistent with the shipment and dispute dates.
- [ ] The recording clearly identifies the shipment (label, order ID, or seal).
- [ ] Evidence was submitted within the dispute window.

If any critical item fails, request additional evidence before deciding.

---

## 4. Applying loss ratios

When a dispute involves partial loss, compute the loss ratio against the **manifest
value**, not the total escrow, unless the dispute record states otherwise.

```
loss_ratio = value_of_affected_items / total_manifest_value
```

Guidance:

- **0% loss** — release full escrow to the seller.
- **Partial loss (0% < ratio < 100%)** — split escrow proportionally: refund the
  affected portion to the buyer, release the remainder to the seller.
- **100% loss** — refund the full escrow to the buyer.

Always document the affected line items and the arithmetic behind the ratio.

---

## 5. Multi-sig signing with Freighter

Resolution transactions require a threshold of signatures. As a mediator you provide
one of them.

1. **Open the resolution draft.** Confirm the outcome, amounts, and recipient addresses
   match your decision.
2. **Review the transaction payload.** Check the escrow contract ID, the amounts, and
   the signer set. If anything differs from your decision, stop and escalate.
3. **Connect Freighter.** Unlock the Freighter extension and select the account that is
   registered as a mediator for this dispute.
4. **Confirm the network.** Ensure Freighter is set to the same network as the dispute
   (testnet vs. mainnet). Signing on the wrong network will fail or be rejected.
5. **Initiate signing.** Trigger the sign action in the dispute UI. Freighter opens a
   confirmation window showing the transaction details.
6. **Verify before approving.** Re-read the destination, amount, and memo in the
   Freighter window. Approve only if they match the reviewed resolution.
7. **Submit the signature.** Approve in Freighter. Your signature is attached to the
   transaction; the UI shows the current signature count against the threshold.
8. **Wait for the threshold.** Other signers must co-sign. Do not re-sign or create a
   duplicate transaction while waiting.
9. **Confirm finalization.** Once the threshold is met, verify the transaction hash is
   finalized on-chain and the escrow balance reflects the resolution.

If Freighter shows an unexpected payload, reject the signature and report the
mismatch — never approve a transaction you have not reviewed.

---

## 6. FAQ

### How do I handle a partial loss dispute?

Verify the seal and manifest first. Identify the affected line items and compute the
loss ratio against the manifest value (section 4). Split the escrow proportionally:
refund the affected portion to the buyer and release the remainder to the seller.
Record the affected items and the arithmetic in your rationale.

### What if the shipment was stolen in transit?

Transit theft is treated as a total loss **only if** the evidence supports it:

- The video shows the seal intact at pickup and the loss occurring before delivery, or
  a police/incident report corroborates the theft.
- The manifest matches the shipment that was dispatched.

If the evidence is inconclusive, request additional documentation before deciding. When
theft is confirmed, refund the full escrow to the buyer and document the incident
reference.

### The video does not show the seal. Can I still decide?

Not on that evidence alone. Request a re-submission or supplementary evidence. A
missing seal check is a critical failure under section 3.1.

### Freighter shows a different amount than my decision. What do I do?

Reject the signature. Do not approve. Report the mismatch and have the resolution draft
corrected before signing again.

### Can I sign on behalf of another mediator?

No. Each mediator signs with their own registered account. Never share keys or sign for
another party.

### What if the signature threshold is never reached?

Escalate to the dispute coordinator. Funds remain in escrow until the threshold is met;
no partial signature can move funds.

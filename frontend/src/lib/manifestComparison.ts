export type ManifestFields = Record<string, string | number>;

export interface ComparisonRow {
  field: string;
  dispatched: string | number | undefined;
  delivered: string | number | undefined;
  discrepancy: boolean;
}

/** Row per field across both records; flags rows where values differ. */
export function compareManifest(dispatch: ManifestFields, delivery: ManifestFields): ComparisonRow[] {
  const fields = Array.from(new Set([...Object.keys(dispatch), ...Object.keys(delivery)]));
  return fields.map((field) => ({
    field,
    dispatched: dispatch[field],
    delivered: delivery[field],
    discrepancy: String(dispatch[field] ?? "") !== String(delivery[field] ?? ""),
  }));
}

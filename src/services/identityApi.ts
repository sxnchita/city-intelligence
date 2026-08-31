import { getJson } from "./http";

// =====================================
// IDENTITY ACCURACY
// GET /api/identity/evaluate
//
// Measured against simulator ground
// truth. Every rate ships with the
// counts it came from, so a figure
// derived from six samples is visibly
// not the same kind of number as one
// derived from six thousand — render
// the denominator, never the bare rate.
// =====================================

/** `rate` is null when the denominator is zero. */
export type Rate = {
  rate: number | null;
  numerator: number;
  denominator: number;
};

export type EvaluationResponse = {
  observations_with_ground_truth: number;
  true_vehicles: number;
  resolved_vehicles: number;

  link_precision: Rate;
  link_recall: Rate;

  fragmentation: {
    mean_resolved_ids_per_true_vehicle: number | null;
    true_vehicles: number;
    distinct_resolved_ids: number;
  };

  id_purity: Rate;

  /** The same figures split by whether the arriving plate was readable. */
  by_plate_present: { link_precision: Rate; link_recall: Rate };
  by_plate_null: { link_precision: Rate; link_recall: Rate };
};

export function getEvaluation(
  signal?: AbortSignal
): Promise<EvaluationResponse> {
  return getJson<EvaluationResponse>(
    "/api/identity/evaluate",
    undefined,
    signal
  );
}

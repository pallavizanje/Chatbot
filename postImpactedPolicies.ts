import { ACCESS_TOKEN } from "@/constants";
import type { ImpactRow } from "@/types";

/** POST / impacted‑policies  — body { keywords: string[] } */
export const postImpactedPolicies = async (
  keywords: string[],
  token: string = ACCESS_TOKEN
): Promise<ImpactRow[]> => {
  const res = await fetch("/api/impacted-policies", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ keywords }),
  });

  if (!res.ok) throw new Error(`Policies API responded ${res.status}`);
  return res.json() as Promise<ImpactRow[]>;
};

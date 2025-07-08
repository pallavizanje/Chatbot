import React from "react";
import { useQuery } from "@tanstack/react-query";
import { postImpactedPolicies } from "@/api/postImpactedPolicies";
import type { ImpactRow } from "@/types";

interface Props {
  keywords: string[];
}

const ImpactedPoliciesTable: React.FC<Props> = ({ keywords }) => {
  /* skip the query until we actually have keywords */
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["impactedPolicies", keywords],
    queryFn: () => postImpactedPolicies(keywords),
    enabled: !!keywords.length, // don't run on empty array
  });

  if (!keywords.length)
    return (
      <p className="italic text-gray-500">No keywords available yet.</p>
    );

  if (isLoading)
    return <p className="italic text-gray-500">Loading policies…</p>;

  if (isError)
    return (
      <p className="rounded bg-red-50 px-4 py-3 text-red-700">
        {(error as Error).message}
      </p>
    );

  if (!data?.length)
    return (
      <p className="italic text-gray-500">
        API returned no impacted‑policy rows.
      </p>
    );

  /* ---------- render table ---------- */
  return (
    <div className="overflow-x-auto rounded border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left font-semibold">
              Division / Functions Group
            </th>
            <th className="px-4 py-2 text-left font-semibold">
              Division Function
            </th>
            <th className="px-4 py-2 text-left font-semibold">
              Overall Impact
            </th>
            <th className="px-4 py-2 text-left font-semibold">Region</th>
            <th className="px-4 py-2 text-left font-semibold">NFR Taxonomy</th>
            <th className="px-4 py-2 text-left font-semibold">
              Inherent Risk Rating
            </th>
            <th className="px-4 py-2 text-left font-semibold">
              Change Required
            </th>
            <th className="px-4 py-2 text-left font-semibold">
              Extraaterritoral Impact
            </th>
            <th className="px-4 py-2 text-left font-semibold">
              Extraerriotri&nbsp;al Impact
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row: ImpactRow, idx: number) => (
            <tr key={idx}>
              <td className="px-4 py-2 whitespace-nowrap">
                {row.divisionGroup}
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                {row.divisionFunction}
              </td>
              <td className="px-4 py-2">{row.overallImpact}</td>
              <td className="px-4 py-2">{row.region}</td>
              <td className="px-4 py-2">{row.nfrTaxonomy}</td>
              <td className="px-4 py-2">{row.inherentRiskRating}</td>
              <td className="px-4 py-2">{row.changeRequired}</td>
              <td className="px-4 py-2">{row.extraaterritoralImpact}</td>
              <td className="px-4 py-2">{row.extraerriotriAlImpact}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ImpactedPoliciesTable;

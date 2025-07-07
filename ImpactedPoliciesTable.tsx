import React from "react";
import { ImpactRow } from "@/types";

interface Props {
  impacts: ImpactRow[];
  ready: boolean;
}

const ImpactedPoliciesTable: React.FC<Props> = ({ impacts, ready }) => {
  if (!ready) {
    return (
      <p className="italic text-gray-500">
        Submit an event to see impacted policies.
      </p>
    );
  }

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
          {impacts.map((row, idx) => (
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

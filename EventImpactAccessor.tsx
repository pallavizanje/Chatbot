import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import EventImpactForm from "@/components/EventImpactForm";
import ImpactedPoliciesTable from "@/components/ImpactedPoliciesTable";
import HistoryList, { HistoryItem } from "@/components/HistoryList";
import KeywordBank from "@/components/KeywordBank";

/* Shared types so child components can import from "@/types" */
export type ImpactRow = {
  divisionGroup: string;
  divisionFunction: string;
  overallImpact: string;
  region: string;
  nfrTaxonomy: string;
  inherentRiskRating: string;
  changeRequired: string;
  extraaterritoralImpact: string;
  extraerriotriAlImpact: string;
};

export type ImpactResponse = {
  summary: string;
  impacts: ImpactRow[];
};

/* Post helper (swap URL for real endpoint) */
const postEventImpact = async (description: string): Promise<ImpactResponse> => {
  const res = await fetch("/api/event-impact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });
  if (!res.ok) throw new Error(`Server responded ${res.status}`);
  return res.json();
};

const MOCK_KEYWORDS = [
  "Downtime",
  "Compliance",
  "Security",
  "Performance",
  "SLA breach",
];

const EventImpactAccessor: React.FC = () => {
  /* state & mutation */
  const [description, setDescription] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<"input" | "table">("input");

  const mutation = useMutation({
    mutationFn: postEventImpact,
    onSuccess: (_, desc) =>
      setHistory((h) => [{ id: Date.now(), description: desc }, ...h]),
  });

  /* helpers */
  const impacts = Array.isArray(mutation.data?.impacts)
    ? mutation.data!.impacts
    : [];

  const keywords = [
    ...MOCK_KEYWORDS,
    ...impacts.map((i) => i.divisionFunction),
    ...impacts.map((i) => i.divisionGroup),
  ];

  const handleReset = () => {
    setDescription("");
    mutation.reset();
    setActiveTab("input");
  };

  /* ui */
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Event Impact Accessor</h1>

      {/* Tabs header */}
      <div className="mb-4 border-b border-gray-200 flex">
        {[
          { key: "input", label: "Event Impact Enstetor" },
          { key: "table", label: "Impacted Policies" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`px-4 py-2 -mb-px border-b-2 ${
              activeTab === key
                ? "border-indigo-600 font-medium text-indigo-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            disabled={key === "table" && !mutation.isSuccess}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left column: tab content */}
        <div className="flex-1">
          {activeTab === "input" && (
            <EventImpactForm
              description={description}
              setDescription={setDescription}
              mutation={mutation}
              onSubmit={(e) => {
                e.preventDefault();
                if (description.trim()) mutation.mutate(description);
              }}
              onReset={handleReset}
            />
          )}

          {activeTab === "table" && (
            <ImpactedPoliciesTable
              impacts={impacts}
              ready={mutation.isSuccess}
            />
          )}
        </div>

        {/* Right column */}
        <div className="w-full md:w-80 flex flex-col gap-4">
          <HistoryList
            items={history}
            onSelect={(d) => setDescription(d)}
            onClear={() => setHistory([])}
          />
          <KeywordBank keywords={keywords} />
        </div>
      </div>
    </div>
  );
};

export default EventImpactAccessor;

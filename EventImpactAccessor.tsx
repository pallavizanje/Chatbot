// src/pages/EventImpactAccessor.tsx
import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import EventImpactForm        from "@/components/EventImpactForm";
import ImpactedPoliciesTable  from "@/components/ImpactedPoliciesTable";
import IndustryTopicsTable    from "@/components/IndustryTopicsTable";
import HistoryList, { HistoryItem } from "@/components/HistoryList";
import KeywordBank            from "@/components/KeywordBank";

import { postEventImpact   }  from "@/api/postEventImpact";
import { postIndustryTopics } from "@/api/postIndustryTopics";

import type { ImpactRow, ImpactResponse } from "@/types";

/* ------------------------------------------------------------------ */
/*  Local helpers & constants                                          */
/* ------------------------------------------------------------------ */

/** Substitute with your real auth retrieval */
const getAccessToken = () => localStorage.getItem("access_token") ?? "";

/** Keywords to show before any API call succeeds */
const MOCK_KEYWORDS = [
  "Downtime",
  "Compliance",
  "Security",
  "Performance",
  "SLA breach",
];

/** Tab metadata */
const TABS = [
  { key: "input",  label: "Event Impact Enstetor" },
  { key: "table",  label: "Impacted Policies"    },
  { key: "topics", label: "Industry Topics"      },
] as const;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
const EventImpactAccessor: React.FC = () => {
  /* ----------------------------- state ---------------------------- */
  const [description, setDescription] = useState("");
  const [history,     setHistory]     = useState<HistoryItem[]>([]);
  const [activeTab,   setActiveTab]   = useState<(typeof TABS)[number]["key"]>(
    "input"
  );

  /* -------------------------- mutations -------------------------- */
  const impactMutation = useMutation({
    mutationFn: (desc: string) => postEventImpact(desc, getAccessToken()),
    onSuccess: (_, desc) =>
      setHistory((h) => [{ id: Date.now(), description: desc }, ...h]),
  });

  const topicsMutation = useMutation({
    mutationFn: (topics: string[]) => postIndustryTopics(topics, getAccessToken()),
  });

  /* ------------------------- derived data ------------------------ */
  const impacts: ImpactRow[] =
    Array.isArray(impactMutation.data?.impacts) ? impactMutation.data!.impacts : [];

  /* merge “industryTopics” from backend + any Keywords: lines */
  const industryTopics: string[] = [
    ...(impactMutation.data?.industryTopics ?? []),
    ...(impactMutation.data?.keywordsFromContent ?? []),
  ];

  /** Keywords bank combines mock list with dynamic data */
  const keywords = [
    ...MOCK_KEYWORDS,
    ...industryTopics,
    ...impacts.map((i) => i.divisionFunction),
    ...impacts.map((i) => i.divisionGroup),
  ];

  /* --------------------------- helpers --------------------------- */
  const handleResetAll = () => {
    setDescription("");
    setActiveTab("input");
    impactMutation.reset();
    topicsMutation.reset();
  };

  /* ----------------------------- UI ------------------------------ */
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Event Impact Accessor</h1>

      {/* ---------------- Tabs header ---------------- */}
      <div className="mb-4 border-b border-gray-200 flex">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            disabled={key !== "input" && !impactMutation.isSuccess}
            className={`px-4 py-2 -mb-px border-b-2 ${
              activeTab === key
                ? "border-indigo-600 font-medium text-indigo-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ------------- Main two‑column layout ------------- */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left column – tab content */}
        <div className="flex-1">
          {activeTab === "input" && (
            <EventImpactForm
              description={description}
              setDescription={setDescription}
              mutation={impactMutation}
              onSubmit={(e) => {
                e.preventDefault();
                if (description.trim()) impactMutation.mutate(description);
              }}
              onReset={handleResetAll}
            />
          )}

          {activeTab === "table" && (
            <ImpactedPoliciesTable
              impacts={impacts}
              ready={impactMutation.isSuccess}
            />
          )}

          {activeTab === "topics" && (
            <IndustryTopicsTable
              topics={industryTopics}
              onAnalyze={() => topicsMutation.mutate(industryTopics)}
              isAnalyzing={topicsMutation.isLoading}
              error={
                topicsMutation.isError
                  ? (topicsMutation.error as Error).message
                  : null
              }
            />
          )}
        </div>

        {/* Right column – history & keywords */}
        <div className="w-full md:w-80 flex flex-col gap-4">
          <HistoryList
            items={history}
            onSelect={(desc) => setDescription(desc)}
            onClear={() => setHistory([])}
          />
          <KeywordBank keywords={keywords} />
        </div>
      </div>
    </div>
  );
};

export default EventImpactAccessor;

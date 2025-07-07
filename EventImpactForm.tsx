// src/components/EventImpactForm.tsx  npm i react-markdown remark-gfm     # or:  yarn add react-markdown remark-gfm

import React, { useRef } from "react";
import { UseMutationResult } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ImpactResponse } from "@/types";

interface Props {
  description: string;
  setDescription: (v: string) => void;
  mutation: UseMutationResult<ImpactResponse, Error, string>;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
}

const EventImpactForm: React.FC<Props> = ({
  description,
  setDescription,
  mutation,
  onSubmit,
  onReset,
}) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  /* drag‑and‑drop keyword → textarea */
  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const kw = e.dataTransfer.getData("text/plain");
    if (!kw || !textAreaRef.current) return;

    const { selectionStart, selectionEnd } = textAreaRef.current;
    setDescription(
      description.slice(0, selectionStart) +
        kw +
        description.slice(selectionEnd)
    );
  };

  return (
    <div className="space-y-6">
      {/* ── form ── */}
      <form
        onSubmit={onSubmit}
        className="space-y-4 bg-white/70 rounded-xl shadow p-6"
      >
        <label className="block">
          <span className="text-sm font-medium">Event Description</span>
          <textarea
            ref={textAreaRef}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="mt-1 block w-full resize-y rounded-md border-gray-300
                       bg-gray-50 focus:border-indigo-500 focus:ring-indigo-500"
            rows={4}
            placeholder="Describe the event in detail…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={mutation.isLoading}
            className="rounded-md bg-indigo-600 px-4 py-2 text-white
                       hover:bg-indigo-700 disabled:opacity-60"
          >
            {mutation.isLoading ? "Analyzing…" : "Submit"}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-md border border-gray-300 px-4 py-2
                       text-gray-700 hover:bg-gray-100"
          >
            Reset
          </button>
        </div>
      </form>

      {/* ── feedback & summary ── */}
      {mutation.isError && (
        <p className="rounded bg-red-50 px-4 py-3 text-red-700">
          {(mutation.error as Error).message}
        </p>
      )}

      {mutation.isSuccess && (
        <>
          <h2 className="text-xl font-medium mb-2">Event Summary</h2>
          {mutation.data.content.map((c, idx) => (
            <div
              key={idx}
              className="prose prose-sm max-w-none rounded bg-gray-50 p-4 mb-4 last:mb-0"
            >
              {/* react‑markdown converts GitHub‑style markdown to HTML */}
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {c.value}
              </ReactMarkdown>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default EventImpactForm;

// src/types.ts
export type ContentItem = { type: "text"; value: string };

export type ImpactRow = { /* …same as before… */ };

export type ImpactResponse = {
  content: ContentItem[];
  impacts: ImpactRow[];
  industryTopics: string[];     // ← existing (from backend field)
  keywordsFromContent: string[];  // ← NEW
};


// src/api/postEventImpact.ts
import type { ImpactResponse } from "@/types";
import { ACCESS_TOKEN } from "@/constants";

export const postEventImpact = async (
  description: string,
  token = ACCESS_TOKEN,
  chatbotIds: string[] = ["axasass"]
): Promise<ImpactResponse> => {
  const payload = {
    questionContent: [{ type: "text", value: description }],
    chatbotIds,
    stream: false,
  };

  const res = await fetch("/api/event-impact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Server responded ${res.status}`);

  const raw = await res.json();

  /* ——— content[].value always comes as markdown/gfm ——— */
  const contentArr = Array.isArray(raw.content) ? raw.content : [];
  const textValues = contentArr
    .filter((c: any) => c?.type === "text" && typeof c.value === "string")
    .map((c: any) => c.value);

  /* ——— look for a “Keywords: …” line anywhere in the text ——— */
  const keywordRegex = /^keywords\s*:\s*(.+)$/im;
  const kws: string[] = [];

  for (const block of textValues) {
    const match = block.match(keywordRegex);
    if (match) {
      match[1]
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
        .forEach((k) => kws.push(k));
      break; // stop after first hit
    }
  }

  /* ——— normalize and return ——— */
  return {
    ...raw,
    content: textValues.map((v) => ({ type: "text", value: v })),
    keywordsFromContent: kws,
  } as ImpactResponse;
};

-  const industryTopics: string[] = impactMutation.data?.industryTopics ?? [];
+  const industryTopics: string[] = [
+    ...(impactMutation.data?.industryTopics ?? []),
+    ...(impactMutation.data?.keywordsFromContent ?? []),
+  ];

import type { ImpactResponse } from "@/types";
import { ACCESS_TOKEN } from "@/constants";

/**
 * POST / event‑impact → normalised ImpactResponse
 *
 * Robustly extracts every keyword pattern the backend has shown so far.
 */
export const postEventImpact = async (
  description: string,
  token: string = ACCESS_TOKEN,
  chatbotIds: string[] = ["axasass"]
): Promise<ImpactResponse> => {
  /* -------- request -------- */
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

  /* -------- raw data -------- */
  const raw = await res.json();

  const contentArr = Array.isArray(raw.content) ? raw.content : [];
  const textBlocks = contentArr
    .filter((c: any) => c?.type === "text" && typeof c.value === "string")
    .map((c: any) => c.value);

  /* ===== Keyword extraction ===== */
  const keywordSet = new Set<string>();

  const clean = (s: string) =>
    s
      .replace(/\*\*/g, "") // drop markdown bold
      .replace(/\s+/g, " ") // collapse whitespace + newlines
      .trim();

  for (const block of textBlocks) {
    // walk line‑by‑line so we can capture bullets under the marker
    const lines = block.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      /* match **Keywords:**   OR   Keywords:   (case‑insensitive) */
      const kwMatch = line.match(/^\s*(\*\*)?keywords?(\*\*)?\s*:\s*(.*)$/i);
      if (!kwMatch) continue;

      const tail = kwMatch[3]; // what’s after the colon on the same line

      /* ---------- Case ① same‑line ---------- */
      if (tail) {
        tail
          .split(",")
          .map(clean)
          .filter(Boolean)
          .forEach((k) => keywordSet.add(k));
        break; // stop scanning this block
      }

      /* ---------- Case ② / ③ multi‑line list ---------- */
      for (let j = i + 1; j < lines.length; j++) {
        const ln = lines[j].trim();

        // end if blank line or new section like "**Conclusion:**"
        if (!ln || /^[*_]*[A-Za-z].+:\s*$/i.test(ln)) break;

        // bullet line?
        const bulletMatch = ln.match(/^[-*]\s+(.*)$/);
        const payload = clean(bulletMatch ? bulletMatch[1] : ln);

        if (payload.includes(",")) {
          // bullet that still contains commas → many
          payload
            .split(",")
            .map(clean)
            .filter(Boolean)
            .forEach((k) => keywordSet.add(k));
        } else if (payload) {
          keywordSet.add(payload);
        }
      }

      break; // stop after first Keywords: in this block
    }

    if (keywordSet.size) break; // stop after first block containing keywords
  }

  /* -------- assemble typed response -------- */
  return {
    ...raw,
    content: textBlocks.map((v) => ({ type: "text", value: v })),
    keywordsFromContent: Array.from(keywordSet),
  } as ImpactResponse;
};

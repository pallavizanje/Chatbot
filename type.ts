import type { ImpactResponse } from "@/types";
import { ACCESS_TOKEN } from "@/constants";

export const postEventImpact = async (
  description: string,
  token = ACCESS_TOKEN,
  chatbotIds: string[] = ["axasass"]
): Promise<ImpactResponse> => {
  /* ---- request ------------------------------------------------- */
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

  /* ---- normalise ---------------------------------------------- */
  const raw = await res.json();

  const contentArr = Array.isArray(raw.content) ? raw.content : [];
  const textBlocks = contentArr
    .filter((c: any) => c?.type === "text" && typeof c.value === "string")
    .map((c: any) => c.value);

  /* ---- extract Keywords: … ------------------------------------ */
  const keywords: string[] = [];

  for (const block of textBlocks) {
    /** split into lines so we can inspect “Keywords:” and bullets separately */
    const lines = block.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const kwLine = lines[i].match(/^keywords\s*:\s*(.*)$/i);
      if (!kwLine) continue;

      const tail = kwLine[1].trim();

      /* 1️⃣  Same‑line, comma‑separated -------------------------- */
      if (tail) {
        keywords.push(
          ...tail
            .split(",")
            .map((k) => k.replace(/\s+/g, " ").trim())
            .filter(Boolean)
        );
        break; // stop processing this block
      }

      /* 2️⃣ | 3️⃣  Multi‑line after “Keywords:” ------------------ */
      for (let j = i + 1; j < lines.length; j++) {
        const ln = lines[j].trim();

        // Stop at blank line or next heading (e.g. 'Conclusion:')
        if (!ln || /^[A-Za-z].+:\s*$/.test(ln)) break;

        // Bullet list item  ->  push each bullet as separate keyword
        if (/^[-*]\s+/.test(ln)) {
          keywords.push(ln.replace(/^[-*]\s+/, "").replace(/\s+/g, " "));
        } else {
          // No bullet: treat the whole remaining text as ONE keyword (collapse \n)
          const span = lines
            .slice(j)
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
          if (span) keywords.push(span);
          break;
        }
      }
      break; // stop after the first “Keywords:” in this block
    }

    if (keywords.length) break; // stop scanning other blocks after first hit
  }

  /* ---- assemble typed response -------------------------------- */
  return {
    ...raw,
    content: textBlocks.map((v) => ({ type: "text", value: v })),
    keywordsFromContent: Array.from(new Set(keywords)), // dedupe
  } as ImpactResponse;
};

// src/api/postEventImpact.ts
import type { ImpactResponse } from "@/types";
import { ACCESS_TOKEN } from "@/constants";

/**
 * Calls the Event‑Impact endpoint, normalises the payload,
 * and extracts every Keyword pattern we’ve seen:
 *
 *   • **Keywords:**\n- Bullet 1 …          (bullet list)
 *   • **Keywords**: foo, bar, baz          (same line, commas)
 *   • Keywords: Foo, Bar …                (plain, commas)
 *   • Keywords:\n- **Foo, Bar**            (bold bullet w/ commas)
 *
 * The deduplicated keywords end up in `keywordsFromContent`.
 */
export const postEventImpact = async (
  description: string,
  token: string = ACCESS_TOKEN,
  chatbotIds: string[] = ["axasass"]
): Promise<ImpactResponse> => {
  /* ---------- request body ---------- */
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

  /* ---------- raw data ---------- */
  const raw = await res.json();

  const contentArr = Array.isArray(raw.content) ? raw.content : [];
  const textBlocks = contentArr
    .filter((c: any) => c?.type === "text" && typeof c.value === "string")
    .map((c: any) => c.value);

  /* =============================================================== */
  /*  Keyword extraction — handles every pattern provided            */
  /* =============================================================== */
  const keywordSet = new Set<string>();

  const tidy = (s: string) =>
    s
      .replace(/\*\*/g, "")        // drop **bold**
      .replace(/^[\s\-*•]+/, "")   // drop bullet glyphs / spaces
      .replace(/\s+/g, " ")        // collapse internal whitespace/newlines
      .trim();

  const markerRegex = /^\s*(\*\*)?keywords?(\*\*)?\s*[:：]\s*(.*)$/i;
  const bulletRegex = /^\s*[-*•]\s+(.*)$/;

  outer: for (const block of textBlocks) {
    const lines = block.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(markerRegex);
      if (!m) continue;

      /* ① Same‑line comma list */
      if (m[3]?.trim()) {
        m[3]
          .split(",")
          .map(tidy)
          .filter(Boolean)
          .forEach((k) => keywordSet.add(k));
        break outer;
      }

      /* ② / ③ Bullet or plain lines after marker */
      for (let j = i + 1; j < lines.length; j++) {
        const ln = lines[j].trim();
        if (!ln) break;                               // blank line ends block
        if (/^[A-Za-z].+:\s*$/.test(ln)) break;       // next heading ends block

        const bullet = ln.match(bulletRegex);
        const payload = bullet ? bullet[1] : ln;

        if (payload.includes(",")) {
          payload
            .split(",")
            .map(tidy)
            .filter(Boolean)
            .forEach((k) => keywordSet.add(k));
        } else {
          const clean = tidy(payload);
          if (clean) keywordSet.add(clean);
        }
      }
      break outer; // stop after first Keywords: group found
    }
  }

  /* ---------- assemble typed object ---------- */
  return {
    ...raw,
    content: textBlocks.map((v) => ({ type: "text", value: v })),
    keywordsFromContent: Array.from(keywordSet),
  } as ImpactResponse;
};

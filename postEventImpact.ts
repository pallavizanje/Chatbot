// src/api/postEventImpact.ts
import type { ImpactResponse } from "@/types";
import { ACCESS_TOKEN } from "@/constants";

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

  /* =============================================================== */
  /*               Keyword extraction (robust)                       */
  /* =============================================================== */
  const keywordSet = new Set<string>();

  const tidy = (s: string) =>
    s
      .replace(/\*\*/g, "")        // strip markdown bold
      .replace(/^[\s\-*•▪‣‧–—]+/, "") // leading bullets/dashes/glyphs
      .replace(/\s+/g, " ")        // collapse whitespace and newlines
      .trim();

  /* marker  =  optional **, "keyword" or "keywords", optional **, colon */
  const markerRegex =
    /^\s*(\*\*)?\s*keyword[s]?(\*\*)?\s*[:：]\s*(.*)$/i;

  /* bullet  =  -, *, •, ▪, ‣, en‑dash, em‑dash */
  const bulletRegex =
    /^\s*[-*•▪‣‧–—]\s+(.*)$/;

  outer: for (const block of textBlocks) {
    const lines = block.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(markerRegex);
      if (!m) continue;

      /* ① same‑line comma list */
      if (m[3]?.trim()) {
        m[3]
          .split(",")
          .map(tidy)
          .filter(Boolean)
          .forEach((k) => keywordSet.add(k));
        break outer;
      }

      /* ② multi‑line bullets or plain lines */
      for (let j = i + 1; j < lines.length; j++) {
        const ln = lines[j].trim();
        if (!ln) break;                            // blank line
        if (/^[A-Za-z].+:\s*$/.test(ln)) break;    // next heading

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
      break outer;
    }
  }

  /* ③ fallback: first line with ≥ 4 commas */
  if (!keywordSet.size) {
    for (const block of textBlocks) {
      const maybe = block
        .split(/\r?\n/)
        .find((l) => l.split(",").length >= 4 && l.length < 300);

      if (maybe) {
        maybe
          .split(",")
          .map(tidy)
          .filter(Boolean)
          .forEach((k) => keywordSet.add(k));
        break;
      }
    }
  }

  /* log unexpected misses */
  if (!keywordSet.size) {
    console.warn(
      "❗ Keyword extractor found nothing. Dumping blocks:",
      textBlocks.join("\n———\n")
    );
  }

  /* -------- assemble typed object -------- */
  return {
    ...raw,
    content: textBlocks.map((v) => ({ type: "text", value: v })),
    keywordsFromContent: Array.from(keywordSet),
  } as ImpactResponse;
};

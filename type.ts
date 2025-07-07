import type { ImpactResponse } from "@/types";
import { ACCESS_TOKEN } from "@/constants";

/**
 * POSTs the user's description, returns a normalised ImpactResponse.
 * It also detects a “Keywords:” line inside **any** markdown block and
 * converts it to `keywordsFromContent: string[]`.
 *
 * Keyword rules:
 *  1. If the part after “Keywords:” contains commas → split on commas.
 *  2. Otherwise treat the whole remainder (even with embedded \n) as ONE keyword.
 *  3. Internal new‑lines collapse to single spaces.
 */
export const postEventImpact = async (
  description: string,
  token = ACCESS_TOKEN,
  chatbotIds: string[] = ["axasass"]
): Promise<ImpactResponse> => {
  /* ------- request body ------- */
  const payload = {
    questionContent: [{ type: "text", value: description }],
    chatbotIds,
    stream: false,
  };

  /* ------- call backend ------- */
  const res = await fetch("/api/event-impact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Server responded ${res.status}`);

  /* ---------------------------------------------------------------
     RAW shape           { content:[{type:"text", value:"…"}], ... }
     ------------------------------------------------------------- */
  const raw = await res.json();

  /* ---- normalise content[] to guarantee array< {type,text} > ---- */
  const contentArr = Array.isArray(raw.content) ? raw.content : [];
  const textBlocks = contentArr
    .filter((c: any) => c?.type === "text" && typeof c.value === "string")
    .map((c: any) => c.value);

  /* ------------- extract “Keywords:” (flexible rules) ------------ */
  let extracted: string[] = [];

  for (const block of textBlocks) {
    // Look at each individual line to avoid matching across huge paragraphs
    for (const line of block.split("\n")) {
      const m = line.match(/^keywords\s*:\s*(.+)$/i);
      if (!m) continue;

      const tail = m[1].trim();

      if (tail.includes(",")) {
        // Split by commas → many keywords
        extracted = tail
          .split(",")
          .map((k) => k.replace(/\s+/g, " ").trim()) // collapse inner \n /  double‑spaces
          .filter(Boolean);
      } else {
        // No comma → treat entire remainder (plus any following lines) as ONE keyword
        const joined = block
          .slice(block.indexOf(m[1]))
          .replace(/\s+/g, " ")
          .trim();
        extracted = [joined];
      }
      break; // stop after first “Keywords:” match
    }
    if (extracted.length) break;
  }

  /* -------- assemble typed response -------- */
  return {
    ...raw,
    content: textBlocks.map((v) => ({ type: "text", value: v })), // keep markdown text
    keywordsFromContent: extracted,                               // NEW field
  } as ImpactResponse;
};

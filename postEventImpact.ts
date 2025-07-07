/* ───── postEventImpact.ts ───── */
import type { ImpactResponse } from "@/types";

/**
 * Sends the user’s description to your backend in the format:
 * {
 *   "questionContent":[{ "type":"text", "value": "<description>" }],
 *   "chatbotIds":["axasass"],
 *   "stream":false
 * }
 *
 * @param description The free‑text question from the form
 * @param chatbotIds  Optionally override the default bot ID(s)
 */
export const postEventImpact = async (
  description: string,
  chatbotIds: string[] = ["axasass"]
): Promise<ImpactResponse> => {
  const payload = {
    questionContent: [
      {
        type: "text",
        value: description,
      },
    ],
    chatbotIds,
    stream: false,
  };

  const res = await fetch("/api/event-impact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Server responded ${res.status}`);
  }
  return res.json() as Promise<ImpactResponse>;
};

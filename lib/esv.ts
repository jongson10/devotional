const ENDPOINT = "https://api.esv.org/v3/passage/text/";
export const ESV_COPYRIGHT = "Scripture quotations are from the ESV\u00AE Bible (The Holy Bible, English Standard Version\u00AE), \u00A9 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.";
export async function fetchEsvPassage(ref: string): Promise<string | null> {
  const key = process.env.ESV_API_KEY;
  if (!key || !ref) return null;
  const params = new URLSearchParams({ q: ref, "include-headings": "false", "include-footnotes": "false", "include-verse-numbers": "true", "include-short-copyright": "false", "include-passage-references": "false" });
  try {
    const res = await fetch(`${ENDPOINT}?${params.toString()}`, { headers: { Authorization: `Token ${key}` }, next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = (await res.json()) as { passages?: string[] };
    return data.passages?.[0]?.trim() || null;
  } catch { return null; }
}

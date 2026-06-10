// Parse a devotional series from Markdown into a series + days.
//
// Format:
//   # Series Title
//   Subtitle: ...
//   Week: 1
//   Start: 2026-06-08
//
//   ## Day 1 — Day Title
//   Passage: Judges 6:11-16
//   Also: Matthew 6:25-34
//   Points: 60
//   ### Lesson
//   ...lesson text...
//   ### Reflect
//   - question one
//   - question two
//   ### Prayer
//   ...prayer prompt...

export type ParsedDay = {
  order: number; title: string; passageRef: string; passageText: string;
  passageRefsExtra: string | null; pastorNote: string | null; teaching: string;
  reflectionQuestions: string[]; prayerPrompt: string | null; pointsReward: number;
};
export type ParsedSeries = { title: string; subtitle: string | null; weekNumber: number | null; startDate: string | null; days: ParsedDay[] };

function parseDayHeading(h: string, fallbackOrder: number): { order: number; title: string } {
  const m = h.match(/^Day\s+(\d+)\s*[—\-:.]?\s*(.*)$/i);
  if (m) return { order: parseInt(m[1], 10), title: (m[2] || "").trim() || `Day ${m[1]}` };
  return { order: fallbackOrder, title: h.trim() };
}

export function parseSeriesMarkdown(md: string): { error: string } | ParsedSeries {
  const text = (md || "").replace(/\r\n/g, "\n").trim();
  if (!text) return { error: "The file is empty." };

  const titleMatch = text.match(/^#\s+(.+)$/m);
  if (!titleMatch) return { error: "Missing a series title. Start the file with `# Series Title`." };
  const title = titleMatch[1].trim();

  const beforeDays = text.split(/^##\s+/m)[0];
  const meta = (key: string) => { const m = beforeDays.match(new RegExp(`^${key}\\s*:\\s*(.+)$`, "mi")); return m ? m[1].trim() : null; };
  const subtitle = meta("Subtitle");
  const weekStr = meta("Week");
  const startStr = meta("Start");
  const weekNumber = weekStr ? (parseInt(weekStr, 10) || null) : null;
  const startMatch = startStr ? startStr.match(/\d{4}-\d{2}-\d{2}/) : null;
  const startDate = startMatch ? startMatch[0] : null;

  const dayBlocks = text.split(/^##\s+/m).slice(1);
  if (dayBlocks.length === 0) return { error: "No days found. Each day should start with `## Day 1 — Title`." };

  const days: ParsedDay[] = dayBlocks.map((block, i) => {
    const nl = block.indexOf("\n");
    const heading = (nl === -1 ? block : block.slice(0, nl)).trim();
    const body = nl === -1 ? "" : block.slice(nl + 1);
    const { order, title: dayTitle } = parseDayHeading(heading, i + 1);

    const preamble = body.split(/^###\s+/m)[0];
    const field = (key: string) => { const m = preamble.match(new RegExp(`^${key}\\s*:\\s*(.+)$`, "mi")); return m ? m[1].trim() : ""; };
    const passageRef = field("Passage");
    const passageRefsExtra = field("Also") || null;
    const pointsStr = field("Points");
    const pointsReward = pointsStr ? (parseInt(pointsStr, 10) || 60) : 60;

    const sections: Record<string, string> = {};
    for (const part of body.split(/^###\s+/m).slice(1)) {
      const pnl = part.indexOf("\n");
      const sh = (pnl === -1 ? part : part.slice(0, pnl)).trim().toLowerCase();
      sections[sh] = (pnl === -1 ? "" : part.slice(pnl + 1)).trim();
    }
    const teaching = sections["lesson"] ?? sections["teaching"] ?? "";
    const reflectRaw = sections["reflect"] ?? sections["reflection"] ?? sections["questions"] ?? sections["reflection questions"] ?? "";
    const reflectionQuestions = reflectRaw.split("\n").map((l) => l.replace(/^[-*]\s+/, "").trim()).filter((l) => l.length > 0 && !l.startsWith("#"));
    const prayerPrompt = sections["prayer"] || null;

    return { order, title: dayTitle, passageRef, passageText: "", passageRefsExtra, pastorNote: null, teaching, reflectionQuestions, prayerPrompt, pointsReward };
  });

  return { title, subtitle, weekNumber, startDate, days };
}

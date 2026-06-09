import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@example.com";

const days = [
  { order: 1, title: "Hiding in the winepress", passageRef: "Judges 6:11-16", passageText: "", passageRefsExtra: "Matthew 6:25-34, Proverbs 29:25",
    teaching: "Gideon threshes wheat in the cramped winepress instead of the open floor \u2014 a reasonable move. The Midianites raid like locusts and a lost harvest could mean starvation. The fear is understandable, even sensible. Yet the same fear that drives him into the winepress is what keeps him stuck in it. \u201CPractical\u201D caution curdles into a cage. He survives, but never lives.\n\nGod did not call Gideon to a winepress; He called him to a battlefield. Survival is not the same as life. God comes to call us out of hiding \u2014 not to leave us safely inside it.",
    reflectionQuestions: ["Where in your life have you called something \u201Cjust being practical\u201D when it may really be fear keeping you hidden?","What is the winepress you have settled into \u2014 and is it protecting your life or quietly holding it captive?","If God is calling you out of it, what would stepping onto the battlefield actually look like?"],
    prayerPrompt: "Write a prayer in response to today.", pointsReward: 60 },
  { order: 2, title: "A sad picture of God's people in fear", passageRef: "Psalm 46:1-7", passageText: "", passageRefsExtra: "Judges 6:1-6, Judges 6:13, Isaiah 59:1",
    teaching: "Israel is reduced to shriveling and anxious, guarding every single grain. From the inside, the despair feels justified by how bad things are. But this is the tragedy \u2014 God is not absent. He is present, alive, and at work. Yet His people live as though He were dead, their whole horizon shrunk down to fear and survival.\n\nThe condition of God's people is never finally defined by their circumstances but by their God. If He is alive and present, fear is not the only sane response \u2014 trust is.",
    reflectionQuestions: ["When you look at your circumstances honestly, do you live as though God were present and at work, or as though He were absent?","In what ways has fear become the \u201Conly sane response\u201D for you, so that your whole horizon has shrunk down to survival?","What would change today if you truly remembered Who is standing with you?"],
    prayerPrompt: "Write a prayer in response to today.", pointsReward: 60 },
  { order: 3, title: "Complaining instead of trusting", passageRef: "Judges 6:36-40", passageText: "", passageRefsExtra: "Judges 6:15-18, Mark 9:24, Hebrews 11:6",
    teaching: "Gideon meets God's call with grievance and self-deprecation, and demands sign after sign. The demand for more proof is a treadmill that never ends. Each sign buys only a little courage before the next wave of doubt. Endless requirement for certainty keeps him forever on the threshold and never across it.\n\nIt is not wrong to seek God's confirmation \u2014 Gideon did, and God patiently answered. But faith was never meant to wait for the elimination of all fear. The point of every sign was to move Gideon forward, not to keep him stalled.",
    reflectionQuestions: ["Is there something God has already made clear to you that you keep asking Him to confirm again, as a way of putting off obedience?","What \u201Cfleece\u201D are you still laying out \u2014 and is it honest seeking, or a treadmill of doubt?","If God has already given you enough, what is the next step forward you have been avoiding?"],
    prayerPrompt: "Write a prayer in response to today.", pointsReward: 60 },
  { order: 4, title: "Victory came by obedience", passageRef: "Judges 7:2-7", passageText: "", passageRefsExtra: "Judges 7:16-22, Zechariah 4:6, 2 Corinthians 12:9",
    teaching: "The ancient formula is simple: more men, stronger army. By that math, 300 against 135,000 is suicide. God deliberately dismantles the math \u2014 22,000 is too many, 10,000 still too many \u2014 so that no one can say, \u201CMy own hand has saved me.\u201D\n\nThe 300 simply obeyed, and God threw the enemy into self-destroying panic. Victory does not belong to the number of men but to the mighty right arm of God. Our part is not to be strong enough; it is to obey.",
    reflectionQuestions: ["Where are you waiting until you feel strong enough, qualified enough, or resourced enough before you obey God?","In what part of your life have you been trusting \u201Cmore men, stronger army\u201D \u2014 your own leverage \u2014 instead of His hand?","If victory belongs to God and not your strength, what act of obedience is He asking of you right now, weakness and all?"],
    prayerPrompt: "Write a prayer in response to today.", pointsReward: 60 },
  { order: 5, title: "Obedience is the bridge", passageRef: "James 2:14-24", passageText: "", passageRefsExtra: "Romans 10:17, James 1:22-25, John 14:15",
    teaching: "Especially for those raised in the church, the stories are familiar and the teachings well-worn. Surely that knowledge should be enough. Yet the truth doesn't stick. People who know all the right things remain just as fearful and stuck in the winepress as everyone else. Knowledge without obedience leaves faith incomplete.\n\nObedience is the bridge. Faith comes by hearing the Word, but faith is not made complete without obedience \u2014 without the leap, you never taste how God works through your weakness. Truth becomes power only when it is obeyed.",
    reflectionQuestions: ["Have you been treating knowing the truth as the same thing as living it?","Which truths do you know well in your head but have never actually obeyed \u2014 and could that be why they have lost their power?","What is one step of obedience that would let you finally taste what you already say you believe?"],
    prayerPrompt: "Write a prayer in response to today.", pointsReward: 60 },
];

async function main() {
  const church = await prisma.church.upsert({
    where: { slug: "demo-church" }, update: {},
    create: { name: "Grace Chapel", slug: "demo-church", timezone: "America/Los_Angeles" },
  });
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: "ADMIN", churchId: church.id },
    create: { email: ADMIN_EMAIL, name: "Pastor", role: "ADMIN", churchId: church.id },
  });
  const start = new Date(); start.setUTCHours(0, 0, 0, 0);
  const series = await prisma.series.upsert({
    where: { id: "seed-series-1" },
    update: { published: true, startDate: start },
    create: { id: "seed-series-1", churchId: church.id, title: "Broken Tools and Utter Victory", subtitle: "The story of Gideon", weekNumber: 1, published: true, startDate: start },
  });
  for (const d of days) {
    await prisma.day.upsert({
      where: { seriesId_order: { seriesId: series.id, order: d.order } },
      update: { ...d, seriesId: series.id },
      create: { ...d, seriesId: series.id },
    });
  }
  console.log("Seeded church (tz America/Los_Angeles), admin (" + ADMIN_EMAIL + "), and 5-day Gideon series (ESV auto, day-locked from today).");
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

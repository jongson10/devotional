import { PrismaClient } from "@prisma/client";
// Seed over the direct (unpooled) connection — seeding through the Neon pooler can
// break Prisma's prepared statements mid-run. Falls back to DATABASE_URL if unset.
const prisma = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL || process.env.DATABASE_URL });

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@example.com";

// Word-for-word lesson + reflection content, transcribed from the source outline.
const days = [
  {
    "order": 1,
    "title": "Hiding in the winepress",
    "passageRef": "Judges 6:11-16",
    "passageText": "",
    "passageRefsExtra": "Matthew 6:25-34, Proverbs 29:25",
    "teaching": "\"My fear is just being responsible. Hiding and protecting what I have is the wise, practical thing to do.\"\nGideon threshes wheat in the cramped winepress instead of the open threshing floor — a reasonable move. The Midianites raid like locusts and a lost harvest could mean starvation. The fear is understandable, even sensible.\n\nThe same fear that drives him into the winepress is what keeps him stuck in it. \"Practical\" caution curdles into a cage. He survives, but he never lives — ekking out a livelihood in hiding instead of stepping into what God made him for. Reasonable self-protection quietly becomes the very thing that holds him captive.\n\nGod did not call Gideon to a winepress; He called him to a battlefield. Survival is not the same as life. The thing we call \"just being practical\" can be the wall we build between ourselves and God's calling — and God comes to call us out of it, not to leave us safely hidden inside it.",
    "reflectionQuestions": [
      "Where in your life have you called something \"just being practical\" or \"just being responsible\" when it may really be fear keeping you hidden?",
      "What is the winepress you have settled into — and is it protecting your life or quietly holding it captive?",
      "If God is calling you out of it, what would stepping onto the battlefield actually look like?"
    ],
    "prayerPrompt": "Write a prayer in response to today.",
    "pointsReward": 60
  },
  {
    "order": 2,
    "title": "A sad picture of God's people in fear",
    "passageRef": "Psalm 46:1-7",
    "passageText": "",
    "passageRefsExtra": "Judges 6:1-6, Judges 6:13, Isaiah 59:1",
    "teaching": "\"Given my circumstances, this fear is the only sane response. Things are too far gone for anything else.\"\nIsrael is reduced to shriveling and anxious, guarding every single grain. From the inside, the despair feels justified by how bad things are.\n\nThis is the tragedy — God is not absent. He is present, alive, and at work. Yet His people live as though He were dead, their entire horizon shrunk down to fear and survival. The destruction is not just the Midianites; it is a people who possess the presence of God and still cannot see past their circumstances. Privilege with God, paired with paralysis before the world.\n\nThe condition of God's people is never finally defined by their circumstances but by their God. If He is alive and present, fear is not the only sane response — trust is. The same God who is \"not too short to save\" (Isa. 59:1) is standing right there in the picture. The sadness is not that deliverance was impossible, but that they forgot Who was with them.",
    "reflectionQuestions": [
      "When you look at your circumstances honestly, do you live as though God were present and at work, or as though He were absent?",
      "In what ways has fear become the \"only sane response\" for you, so that your whole horizon has shrunk down to survival?",
      "What would change today if you truly remembered Who is standing with you?"
    ],
    "prayerPrompt": "Write a prayer in response to today.",
    "pointsReward": 60
  },
  {
    "order": 3,
    "title": "Complaining instead of trusting",
    "passageRef": "Judges 6:36-40",
    "passageText": "",
    "passageRefsExtra": "Judges 6:15-18, Mark 9:24, Hebrews 11:6",
    "teaching": "\"Before I'll trust God, He has to settle all my doubts. If I just had enough proof, enough certainty, then I'd obey.\"\nGideon meets God's call with grievance — \"where are all His wonderful deeds?\" — and self-deprecation — \"my clan is the weakest, I am the least.\" He must be convinced a third time, obeys by night out of fear, and demands sign after sign: the fire, the wet fleece, the dry fleece.\n\nThe demand for more proof is a treadmill that never ends. Each sign buys only a little courage before the next wave of doubt; one fleece is never enough, so he asks again. Endless requirement for certainty keeps him forever on the threshold and never across it. The gaze stays locked on circumstances and on self, never lifting to the One who is speaking.\n\nIt is not wrong to seek God's confirmation — Gideon did, and God patiently answered. But faith was never meant to wait for the elimination of all fear. God is kind and understanding toward the fearful; He stoops to reassure. Yet the point of every sign was to move Gideon forward, not to keep him stalled. Confirmation is given so we will step out — not so we can keep standing still.",
    "reflectionQuestions": [
      "Is there something God has already made clear to you that you keep asking Him to confirm again, as a way of putting off obedience?",
      "What \"fleece\" are you still laying out — and is it honest seeking, or is it a treadmill of doubt that keeps you on the threshold?",
      "If God has already given you enough, what is the next step forward you have been avoiding?"
    ],
    "prayerPrompt": "Write a prayer in response to today.",
    "pointsReward": 60
  },
  {
    "order": 4,
    "title": "Victory came by obedience",
    "passageRef": "Judges 7:2-7",
    "passageText": "",
    "passageRefsExtra": "Judges 7:16-22, Zechariah 4:6, 2 Corinthians 12:9",
    "teaching": "\"Victory belongs to strength and numbers. The more I have — more resources, more ability, more leverage — the safer I am and the better my odds.\"\nThe ancient formula is simple: more men, stronger army. By that math, 300 unarmed men against 135,000 is suicide.\n\nGod deliberately dismantles the math. 22,000 is too many. 10,000 is still too many. He strips the force down to 300 men carrying only trumpets and torches hidden in jars — no swords, no spears. He removes every human reason to expect victory, so that no one can say, \"My own hand has saved me.\" Leaning on strength and numbers is exposed as the very thing that would rob God of His glory.\n\nThe 300 simply obeyed — smashed the jars, blew the trumpets, shouted — and God threw the enemy into self-destroying panic; 120,000 fell within days. Victory does not belong to the number of men but to the mighty right arm of God. He uses the smallest army and the most broken instruments precisely so the deliverance can only be credited to Him. Our part is not to be strong enough; it is to obey.",
    "reflectionQuestions": [
      "Where are you waiting until you feel strong enough, qualified enough, or resourced enough before you obey God?",
      "In what part of your life have you been trusting \"more men, stronger army\" — your own leverage and ability — instead of His hand?",
      "If victory belongs to God and not to your strength, what is the act of obedience He is asking of you right now, weakness and all?"
    ],
    "prayerPrompt": "Write a prayer in response to today.",
    "pointsReward": 60
  },
  {
    "order": 5,
    "title": "Obedience is the bridge",
    "passageRef": "James 2:14-24",
    "passageText": "",
    "passageRefsExtra": "Romans 10:17, James 1:22-25, John 14:15",
    "teaching": "\"I already know the truth, so I already have its power. Knowing the right things is enough.\"\nEspecially for those raised in the church — the stories are familiar, the teachings well-worn. Surely that knowledge should be enough to make us bold.\n\nYet the truth doesn't stick. It doesn't empower, transform, or change. People who know all the right things remain just as fearful, anxious, and stuck in the winepress as everyone else. Knowledge without obedience leaves faith incomplete — hearing plants faith, but a faith never acted on never matures into power. The believer stays on survival mode, possessing the truth but never tasting it.\n\nObedience is the bridge. Faith comes by hearing the Word, but faith is not made complete without obedience — without the leap, you never taste how God works through your weakness. There is no substitute for experience, and none for obedience. The Sunday-closing business owners and the missions-goers learned this not by knowing more but by stepping out — and discovering God provides beyond their strength. Truth becomes power only when it is obeyed.",
    "reflectionQuestions": [
      "Have you been treating knowing the truth as the same thing as living it?",
      "Which truths do you know well in your head but have never actually obeyed — and could that be why they have lost their power for you?",
      "What is one step of obedience that would let you finally taste what you already say you believe?"
    ],
    "prayerPrompt": "Write a prayer in response to today.",
    "pointsReward": 60
  }
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
  console.log("Seeded church (tz America/Los_Angeles), admin (" + ADMIN_EMAIL + "), and 5-day Gideon series with word-for-word lessons (ESV auto, day-locked from today).");
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

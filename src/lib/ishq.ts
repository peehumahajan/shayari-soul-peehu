export const CATEGORIES = [
  { id: "love", label: "Ishq" },
  { id: "sad", label: "Dard" },
  { id: "friendship", label: "Dosti" },
  { id: "motivation", label: "Hausla" },
  { id: "romantic", label: "Romantic" },
  { id: "life", label: "Zindagi" },
  { id: "other", label: "Other" },
] as const;

export const SCRIPTS = [
  { id: "hindi", label: "हिन्दी" },
  { id: "urdu", label: "اردو" },
  { id: "roman", label: "Roman" },
  { id: "punjabi", label: "ਪੰਜਾਬੀ" },
] as const;

export type ScriptId = (typeof SCRIPTS)[number]["id"];

export function scriptClass(script: string) {
  switch (script) {
    case "hindi":
      return "script-hindi";
    case "urdu":
      return "script-urdu";
    case "punjabi":
      return "script-punjabi";
    default:
      return "script-roman";
  }
}

export function categoryLabel(id: string) {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

const SPAM_WORDS = [
  "subscribe",
  "whatsapp",
  "http://",
  "https://",
  "www.",
  "buy now",
  "promo",
  "follow back",
  "earn money",
  "casino",
  "betting",
  "loan",
  "click here",
  "dm for promo",
  "paytm",
  "crypto",
  "forex",
];

/** Client-side pre-check mirroring the server spam filter. */
export function detectSpam(text: string) {
  const hay = text.toLowerCase();
  return SPAM_WORDS.filter((w) => hay.includes(w));
}
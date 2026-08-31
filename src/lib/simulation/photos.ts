export type EvidencePhoto = {
  imageUrl: string;
  caption: string;
};

const LEGIT_PHOTOS: EvidencePhoto[] = [
  { imageUrl: "/demo-photos/legit-damage-1.png", caption: "Here's a photo of the damage." },
  { imageUrl: "/demo-photos/legit-damage-2.png", caption: "Attached a pic so you can see what I mean." },
];

const STOCK_FAKE_PHOTOS: EvidencePhoto[] = [
  { imageUrl: "/demo-photos/stock-photo-fake-1.png", caption: "Here's proof of the damage." },
  { imageUrl: "/demo-photos/stock-photo-fake-2.png", caption: "This is what it looks like." },
];

const AI_GENERATED_FAKE_PHOTOS: EvidencePhoto[] = [
  { imageUrl: "/demo-photos/ai-generated-fake-1.png", caption: "See attached, it's pretty bad." },
  { imageUrl: "/demo-photos/ai-generated-fake-2.png", caption: "Here's what arrived." },
];

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Simulation-level random choice, not something the roleplaying
 * customer-persona AI "decides" — a real customer wouldn't consciously
 * submit a fake photo, so which archetype shows up is decided here.
 */
export function pickEvidencePhoto(): EvidencePhoto {
  const roll = Math.random();
  if (roll < 0.6) return pickRandom(LEGIT_PHOTOS);
  if (roll < 0.85) return pickRandom(STOCK_FAKE_PHOTOS);
  return pickRandom(AI_GENERATED_FAKE_PHOTOS);
}

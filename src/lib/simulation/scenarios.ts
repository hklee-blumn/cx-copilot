export const FAKE_CUSTOMER_NAMES = [
  "Priya Sharma",
  "Jamal Thompson",
  "Sofia Martinez",
  "Liam O'Connor",
  "Yuki Tanaka",
  "Grace Kim",
  "Tomas Novak",
  "Fatima Al-Sayed",
  "Noah Bergstrom",
  "Chloe Dubois",
  "Ravi Patel",
  "Ingrid Larsen",
  "Marcus Webb",
  "Aisha Bello",
  "Diego Fernandez",
  "Hannah Cohen",
  "Kwame Mensah",
  "Emily Zhang",
  "Lucas Silva",
  "Nadia Rahman",
  "Oliver Bennett",
  "Mei Lin",
  "Sean Murphy",
  "Zara Ahmed",
];

export const FAKE_ORDER_TEMPLATES: {
  description: string;
  amountCentsRange: [number, number];
}[] = [
  { description: "Wireless Earbuds", amountCentsRange: [1299, 1799] },
  { description: "Standing Desk", amountCentsRange: [29900, 39900] },
  { description: "4K Monitor", amountCentsRange: [22900, 32900] },
  { description: "Espresso Machine", amountCentsRange: [15900, 21900] },
  { description: "Running Shoes", amountCentsRange: [7900, 9900] },
  { description: "Noise-Cancelling Headphones", amountCentsRange: [18900, 24900] },
  { description: "Winter Jacket", amountCentsRange: [12900, 16900] },
  { description: "Desk Mat", amountCentsRange: [1800, 2600] },
  { description: "Phone Case", amountCentsRange: [899, 1299] },
  { description: "Backpack", amountCentsRange: [5900, 8900] },
];

export type SimScenario = {
  targetSeverity: "green" | "yellow" | "orange" | "red";
  openingMessage: string;
};

export const SIMULATION_SCENARIOS: SimScenario[] = [
  // green — routine, FAQ, delivery, policy
  { targetSeverity: "green", openingMessage: "Hey, when will my order arrive? It's been a few days." },
  { targetSeverity: "green", openingMessage: "Can I change my delivery address before it ships?" },
  { targetSeverity: "green", openingMessage: "Do you offer international shipping?" },
  { targetSeverity: "green", openingMessage: "What's your return window for unopened items?" },
  { targetSeverity: "green", openingMessage: "Can I get a copy of my receipt for my last order?" },
  { targetSeverity: "green", openingMessage: "How do I reset my account password?" },

  // yellow — borderline, repetitive, low confidence, gray area
  { targetSeverity: "yellow", openingMessage: "I already asked this but I'm still not sure — is my item covered under warranty or not? I keep getting different answers." },
  { targetSeverity: "yellow", openingMessage: "This is the second time I'm messaging about the same issue and I still don't have a clear answer." },
  { targetSeverity: "yellow", openingMessage: "Your policy page says one thing but the email I got said another — which one is actually true?" },
  { targetSeverity: "yellow", openingMessage: "I'm getting a little frustrated, can you just tell me straight whether this qualifies for a replacement?" },
  { targetSeverity: "yellow", openingMessage: "I'm not sure if this is the right place to ask, but my order status hasn't changed in over a week." },
  { targetSeverity: "yellow", openingMessage: "Can you double check this? I feel like I was told something different last time I asked." },

  // orange — refund over $50, needs human approval
  { targetSeverity: "orange", openingMessage: "My standing desk arrived with a huge dent, I want a refund, it was $349." },
  { targetSeverity: "orange", openingMessage: "The 4K monitor I bought is dead on arrival, please refund the $279 I paid." },
  { targetSeverity: "orange", openingMessage: "My espresso machine leaks everywhere, I'd like a full refund for the $189 I spent." },
  { targetSeverity: "orange", openingMessage: "This jacket doesn't match the listing at all, I paid $145 and want my money back." },
  { targetSeverity: "orange", openingMessage: "My noise-cancelling headphones stopped working after two days, please refund the $220." },
  { targetSeverity: "orange", openingMessage: "I want to return my desk setup, it doesn't work as advertised and it cost me about $190." },

  // red — dissent, legal risk, explicit human request, repeated failure
  { targetSeverity: "red", openingMessage: "I've contacted support three times about this exact issue and nobody has fixed it. I want to talk to a real person now." },
  { targetSeverity: "red", openingMessage: "This is unacceptable — I'm considering filing a complaint with consumer protection over how this was handled." },
  { targetSeverity: "red", openingMessage: "Stop giving me automated responses, I need to speak with an actual human being immediately." },
  { targetSeverity: "red", openingMessage: "You charged me twice for the same order and now I'm being ignored. This is starting to feel like fraud." },
  { targetSeverity: "red", openingMessage: "I'm extremely upset, this is the worst customer service experience I've ever had. Get me a manager." },
  { targetSeverity: "red", openingMessage: "If this isn't resolved today I'm contacting my lawyer and disputing the charge with my bank." },
];

export function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

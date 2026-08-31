export const DEMO_COMPANIES = [
  { name: "Northwind Retail", color: "bg-blue-500" },
  { name: "Acme Logistics", color: "bg-purple-500" },
  { name: "Globex Electronics", color: "bg-teal-500" },
  { name: "Initech Software", color: "bg-pink-500" },
  { name: "Umbrella Health", color: "bg-cyan-500" },
  { name: "Stark Manufacturing", color: "bg-fuchsia-500" },
  { name: "Wayne Consumer Goods", color: "bg-violet-500" },
  { name: "Hooli Telecom", color: "bg-rose-500" },
];

const COLOR_BY_COMPANY = new Map(DEMO_COMPANIES.map((c) => [c.name, c.color]));

export function companyBadge(company: string) {
  const initials =
    company
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";
  const color = COLOR_BY_COMPANY.get(company) ?? "bg-zinc-500";
  return { initials, color };
}

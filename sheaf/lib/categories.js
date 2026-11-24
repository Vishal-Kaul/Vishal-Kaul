export const MAIN = ["Portfolio", "Blog", "Product", "Service", "Other"];

export const SUBS = {
  Portfolio: ["Designer", "Developer", "3D artist", "Illustrator", "Photographer", "Studio"],
  Blog: ["Design", "UX research", "Engineering", "AI", "Business", "Personal"],
  Product: [
    "Design tool", "Dev tool", "AI tool", "Productivity", "Fintech", "E-commerce",
    "Analytics", "Marketing", "Education", "Health", "Social", "Media",
  ],
  Service: ["Agency", "Consulting", "Freelancer", "Development", "Marketing"],
  Other: ["Inspiration", "UI reference", "News", "Docs", "Community", "Resource"],
};

export const DEFAULT_SUB = {
  Portfolio: "Designer",
  Blog: "Design",
  Product: "Productivity",
  Service: "Agency",
  Other: "Resource",
};

export function isValid(main, sub) {
  return Object.hasOwn(SUBS, main) && SUBS[main].includes(sub);
}

export function label(main, sub) {
  return `${main} · ${sub}`;
}

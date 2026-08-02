const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Tools: ["Ladder", "Drill", "Tool kit", "Power tools", "Workshop set"],
  Electronics: ["Projector", "Speaker", "Charging kit", "Camera gear", "Tech helper"],
  Garden: ["Garden cart", "Trimmer", "Watering kit", "Yard tools", "Plant care set"],
  Medical: ["Mobility aid", "Care equipment", "Recovery support", "Medical helper", "Home care kit"],
  Party: ["Event bundle", "Party kit", "Hosting set", "Celebration essentials", "Gathering package"],
  Baby: ["Baby essentials", "Stroller", "Nursery kit", "Family helper", "Child care set"],
  Kitchen: ["Kitchen helper", "Cookware set", "Serving kit", "Meal prep bundle", "Hosting tray"],
  Camping: ["Camping kit", "Outdoor gear", "Adventure bundle", "Trail pack", "Weekend kit"],
  Cleaning: ["Cleaning kit", "Deep clean bundle", "Home care set", "Wash kit", "Sanitizing helper"],
  Sports: ["Sport gear", "Training kit", "Workout bundle", "Game-day set", "Fitness helper"],
  Pets: ["Pet care kit", "Walking gear", "Travel crate", "Feeding set", "Pet helper"],
  Furniture: ["Space saver", "Move-in helper", "Guest chair", "Table set", "Home comfort piece"],
  Emergency: ["Emergency kit", "Power backup", "Recovery support", "Urgent helper", "Preparedness set"],
};

export function buildItemTitleSuggestions(category: string, hasImage: boolean) {
  const keywords = CATEGORY_KEYWORDS[category] ?? [category, "Shared item", "Neighborhood helper"];
  const prefix = hasImage ? "Photo-based" : "Smart";

  return [
    `${prefix} ${keywords[0]}`,
    `${keywords[1] ?? keywords[0]} for nearby neighbors`,
    `Trusted ${keywords[2] ?? category.toLowerCase()}`,
    `${keywords[3] ?? category} in great condition`,
    `Ready-to-borrow ${keywords[4] ?? category.toLowerCase()}`,
  ];
}

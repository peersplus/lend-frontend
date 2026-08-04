export type FestivalSpotlight = {
  id: string;
  label: string;
  start: string; // MM-DD
  end: string;   // MM-DD
  heroLine: string;
  categories: string[];
};

export const FESTIVAL_SPOTLIGHTS: FestivalSpotlight[] = [
  {
    id: "new-year",
    label: "New Year Week",
    start: "01-01",
    end: "01-10",
    heroLine: "New year, lighter home. Borrow before you buy.",
    categories: ["Party", "Kitchen", "Cleaning"],
  },
  {
    id: "winter-community",
    label: "Winter Community Season",
    start: "01-11",
    end: "01-31",
    heroLine: "Stay warm and share care essentials with nearby neighbors.",
    categories: ["Kitchen", "Baby", "Medical"],
  },
  {
    id: "spring-festivals",
    label: "Spring Festival Season",
    start: "02-01",
    end: "03-31",
    heroLine: "Celebrate with shared party, travel, and home setup items.",
    categories: ["Party", "Cleaning", "Kitchen"],
  },
  {
    id: "ramadan-eid",
    label: "Ramadan and Eid Season",
    start: "03-15",
    end: "04-30",
    heroLine: "Host family gatherings with shared kitchen and seating essentials.",
    categories: ["Kitchen", "Furniture", "Party"],
  },
  {
    id: "vaisakhi-easter",
    label: "Vaisakhi and Easter Season",
    start: "04-10",
    end: "04-30",
    heroLine: "Gather as one community and share celebration essentials.",
    categories: ["Party", "Kitchen", "Garden"],
  },
  {
    id: "summer-break",
    label: "Summer Family Season",
    start: "05-01",
    end: "06-30",
    heroLine: "Borrow activity and travel gear for school break days.",
    categories: ["Baby", "Sports", "Electronics"],
  },
  {
    id: "monsoon-help",
    label: "Monsoon Help Season",
    start: "07-01",
    end: "08-15",
    heroLine: "Share home care and emergency items during rainy weeks.",
    categories: ["Emergency", "Tools", "Cleaning"],
  },
  {
    id: "rakhi-month",
    label: "Rakhi Month",
    start: "08-01",
    end: "08-31",
    heroLine: "Welcome loved ones with shared kitchen and hosting essentials.",
    categories: ["Kitchen", "Party", "Furniture"],
  },
  {
    id: "onam-ganesh",
    label: "Onam and Ganesh Festival Season",
    start: "08-20",
    end: "09-30",
    heroLine: "Plan traditional gatherings with shared serving and decor items.",
    categories: ["Kitchen", "Party", "Furniture"],
  },
  {
    id: "navratri-diwali",
    label: "Navratri to Diwali Season",
    start: "10-01",
    end: "11-10",
    heroLine: "Celebrate smarter with neighborhood sharing for gifts and gatherings.",
    categories: ["Party", "Kitchen", "Electronics"],
  },
  {
    id: "gurpurab-community",
    label: "Community Festival Season",
    start: "11-11",
    end: "12-14",
    heroLine: "Community-first sharing for family visits and local events.",
    categories: ["Kitchen", "Medical", "Tools"],
  },
  {
    id: "christmas-week",
    label: "Christmas and Year End",
    start: "12-15",
    end: "12-31",
    heroLine: "Holiday hosting feels easier with trusted nearby borrowing.",
    categories: ["Party", "Kitchen", "Baby"],
  },
];

function monthDayNumber(value: string) {
  const [month, day] = value.split("-").map(Number);
  return month * 100 + day;
}

export function getFestivalSpotlight(date: Date): FestivalSpotlight | null {
  const current = (date.getMonth() + 1) * 100 + date.getDate();
  return (
    FESTIVAL_SPOTLIGHTS.find((entry) => {
      const start = monthDayNumber(entry.start);
      const end = monthDayNumber(entry.end);
      return start <= end ? current >= start && current <= end : current >= start || current <= end;
    }) || null
  );
}
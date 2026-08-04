import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DAY_THEMES: Record<number, {
  badge: string;
  headline: string;
  accent: string;
  description: string;
  audience: string[];
}> = {
  0: {
    badge: "Sunday reset and family prep",
    headline: "Plan your week",
    accent: "without overspending.",
    description: "Borrow what your home needs for the coming week and return when you're done.",
    audience: ["Family prep", "Home reset", "Weekend chores"],
  },
  1: {
    badge: "Monday essentials",
    headline: "Start your week",
    accent: "with less stress.",
    description: "Need a laptop stand, baby gear, or quick kitchen support? Your neighborhood already has it.",
    audience: ["Busy professionals", "Caregivers", "Parents"],
  },
  2: {
    badge: "Tuesday practical sharing",
    headline: "Borrow practical tools",
    accent: "for everyday fixes.",
    description: "From drills to cleaning machines, find short-use items nearby instead of buying new.",
    audience: ["Home fixes", "Tool sharing", "Savings first"],
  },
  3: {
    badge: "Midweek support",
    headline: "Get help faster",
    accent: "when schedules get tight.",
    description: "Request a ride, extra hands, or urgent neighborhood support with verified members.",
    audience: ["Midweek rush", "Local help", "Verified support"],
  },
  4: {
    badge: "Thursday event prep",
    headline: "Prepare gatherings",
    accent: "without buying one-time items.",
    description: "Borrow party, kitchen, and hosting essentials before weekend plans begin.",
    audience: ["Party prep", "Kitchen gear", "Host smart"],
  },
  5: {
    badge: "Friday community vibe",
    headline: "Weekend starts",
    accent: "with smarter sharing.",
    description: "Find camping, sports, and celebration items from neighbors around you.",
    audience: ["Weekend plans", "Outdoor gear", "Social sharing"],
  },
  6: {
    badge: "Saturday action day",
    headline: "Get things done",
    accent: "with neighborhood resources.",
    description: "Handle repairs, family activities, and events using trusted local borrowing.",
    audience: ["Projects day", "Family time", "Community trust"],
  },
};

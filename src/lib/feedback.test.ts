import { describe, expect, it } from "vitest";
import { sortFeedbackForHome, type HomeFeedbackEntry } from "@/lib/feedback";

describe("sortFeedbackForHome", () => {
  it("keeps lower ratings at the end", () => {
    const input: HomeFeedbackEntry[] = [
      { booking_id: "1", rating: 2, feedback: "ok", item_title: "Mixer", borrower_name: "A.", created_at: "2026-07-01T10:00:00.000Z" },
      { booking_id: "2", rating: 5, feedback: "great", item_title: "Drill", borrower_name: "B.", created_at: "2026-07-03T10:00:00.000Z" },
      { booking_id: "3", rating: 3, feedback: "nice", item_title: "Chair", borrower_name: "C.", created_at: "2026-07-02T10:00:00.000Z" },
    ];

    const sorted = sortFeedbackForHome(input);
    expect(sorted.map((entry) => entry.rating)).toEqual([5, 3, 2]);
  });

  it("uses newest first when ratings are equal", () => {
    const input: HomeFeedbackEntry[] = [
      { booking_id: "1", rating: 4, feedback: "solid", item_title: "Projector", borrower_name: "A.", created_at: "2026-07-01T10:00:00.000Z" },
      { booking_id: "2", rating: 4, feedback: "helpful", item_title: "Tent", borrower_name: "B.", created_at: "2026-07-05T10:00:00.000Z" },
    ];

    const sorted = sortFeedbackForHome(input);
    expect(sorted.map((entry) => entry.booking_id)).toEqual(["2", "1"]);
  });

  it("handles invalid dates without crashing", () => {
    const input: HomeFeedbackEntry[] = [
      { booking_id: "1", rating: 4, feedback: "good", item_title: "Fan", borrower_name: "A.", created_at: "not-a-date" },
      { booking_id: "2", rating: 4, feedback: "great", item_title: "Table", borrower_name: "B.", created_at: "2026-07-05T10:00:00.000Z" },
    ];

    const sorted = sortFeedbackForHome(input);
    expect(sorted[0].booking_id).toBe("2");
  });
});

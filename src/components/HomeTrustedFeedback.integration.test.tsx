import { vi, describe, it, expect } from "vitest";
import { feedbackChipLabel, loadTrustedFeedback } from "./HomeTrustedFeedback";

describe("HomeTrustedFeedback integration", () => {
  it("maps app feedback API rows to home feedback cards", async () => {
    const mockApi = vi.fn().mockResolvedValueOnce([
      {
        id: "row-older",
        category: "feedback",
        message: "Please improve loading speed",
        name: "Amit",
        is_known_user: true,
        created_at: "2026-07-10T10:00:00.000Z",
      },
      {
        id: "row-new",
        category: "idea",
        message: "Add dark mode toggle",
        name: "Ravi",
        is_known_user: false,
        created_at: "2026-07-12T10:00:00.000Z",
      },
    ]);

    const trusted = await loadTrustedFeedback(mockApi);

    expect(mockApi).toHaveBeenCalled();
    expect(trusted.map(feedbackChipLabel)).toEqual([
      "IDEA Ravi: Add dark mode toggle",
      "FEEDBACK Amit: Please improve loading speed",
    ]);
  });
});

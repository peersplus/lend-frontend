export type HomeFeedbackEntry = {
  booking_id: string;
  rating: number;
  feedback: string;
  item_title: string;
  borrower_name: string;
  created_at: string;
};

function toSafeTime(value: string) {
  const millis = new Date(value).getTime();
  return Number.isFinite(millis) ? millis : 0;
}

export function sortFeedbackForHome(entries: HomeFeedbackEntry[]) {
  return [...entries].sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return toSafeTime(b.created_at) - toSafeTime(a.created_at);
  });
}

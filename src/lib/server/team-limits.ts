export function getSeatLimitFromPlan(plan: string | null | undefined): number {
  switch ((plan ?? 'free').toLowerCase()) {
    case 'pro':
      return 10;
    case 'free':
    default:
      return 3;
  }
}
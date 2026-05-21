export const plannerQueryKeys = {
  all: ['planner'] as const,
  courses: () => [...plannerQueryKeys.all, 'courses'] as const,
  week: (weekStart: string) =>
    [...plannerQueryKeys.all, 'week', weekStart] as const,
}

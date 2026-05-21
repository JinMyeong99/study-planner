import { useQuery } from '@tanstack/react-query'

import { getCourses, getPlanner } from '../api'
import { plannerQueryKeys } from '../queryKeys'

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message
  }

  return '플래너 정보를 불러오지 못했습니다.'
}

export const usePlannerData = (weekStart: string) => {
  const coursesQuery = useQuery({
    queryKey: plannerQueryKeys.courses(),
    queryFn: getCourses,
  })
  const plannerQuery = useQuery({
    queryKey: plannerQueryKeys.week(weekStart),
    queryFn: () => getPlanner(weekStart),
  })
  const error = coursesQuery.error ?? plannerQuery.error

  const refetch = async () => {
    await Promise.all([coursesQuery.refetch(), plannerQuery.refetch()])
  }

  return {
    courses: coursesQuery.data?.courses ?? [],
    savedBlocks: plannerQuery.data?.blocks ?? [],
    plannerWeekStart: plannerQuery.data?.weekStart ?? weekStart,
    isLoading: coursesQuery.isPending || plannerQuery.isPending,
    isError: coursesQuery.isError || plannerQuery.isError,
    errorMessage: error ? getErrorMessage(error) : null,
    refetch,
  }
}

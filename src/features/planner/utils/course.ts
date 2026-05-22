import type { Course } from '../types'

export const createCourseMap = (courses: Course[]) =>
  new Map(courses.map((course) => [course.id, course]))

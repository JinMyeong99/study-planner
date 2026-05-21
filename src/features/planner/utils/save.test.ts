import { describe, expect, it } from 'vitest'

import type { Course, StudyBlock } from '../types'
import {
  createSavePlannerPayload,
  formatConflictMessage,
  getConflictBlockIds,
} from './save'

const courses: Course[] = [
  {
    id: 'course-react',
    title: 'React 상태 관리',
    color: '#4A90D9',
  },
  {
    id: 'course-typescript',
    title: 'TypeScript 기초',
    color: '#F5A623',
  },
]

const draftBlock: StudyBlock = {
  id: 'draft-abc',
  courseId: 'course-react',
  dayOfWeek: 0,
  startTime: '09:00',
  endTime: '10:00',
  memo: '신규 블록',
}

const savedBlock: StudyBlock = {
  id: 'block-1',
  courseId: 'course-typescript',
  dayOfWeek: 2,
  startTime: '10:00',
  endTime: '11:00',
}

describe('planner save utilities', () => {
  it('신규 draft id는 저장 요청에서 제거한다', () => {
    expect(
      createSavePlannerPayload('2026-05-18', [draftBlock, savedBlock]),
    ).toEqual({
      weekStart: '2026-05-18',
      blocks: [
        {
          courseId: 'course-react',
          dayOfWeek: 0,
          startTime: '09:00',
          endTime: '10:00',
          memo: '신규 블록',
        },
        {
          id: 'block-1',
          courseId: 'course-typescript',
          dayOfWeek: 2,
          startTime: '10:00',
          endTime: '11:00',
        },
      ],
    })
  })

  it('충돌 쌍의 block id 집합을 만든다', () => {
    expect(getConflictBlockIds([draftBlock, savedBlock])).toEqual(
      new Set(['draft-abc', 'block-1']),
    )
  })

  it('강의명과 시간 범위를 포함한 충돌 메시지를 만든다', () => {
    expect(formatConflictMessage([draftBlock, savedBlock], courses)).toBe(
      'React 상태 관리(월요일 09:00 - 10:00)와 TypeScript 기초(수요일 10:00 - 11:00) 시간이 겹칩니다.',
    )
  })
})

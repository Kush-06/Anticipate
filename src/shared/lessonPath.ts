export interface LessonRef {
  topicId: string
  subTopicId: string
}

export function parseLessonPath(lessonPath: string): LessonRef | null {
  const match = lessonPath.match(/^\/topic\/([^/]+)\/subtopic\/([^/]+)/)
  if (!match) return null
  return { topicId: match[1], subTopicId: match[2] }
}

export function isLessonPathCompleted(
  lessonPath: string | undefined,
  completedSubTopicIds: string[],
): boolean {
  if (!lessonPath) return false
  const lessonRef = parseLessonPath(lessonPath)
  return lessonRef ? completedSubTopicIds.includes(lessonRef.subTopicId) : false
}

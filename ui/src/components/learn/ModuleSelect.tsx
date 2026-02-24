import { COURSES } from '@/content/courses'
import { useGameStore } from '@/stores/gameStore'

interface ModuleSelectProps {
  onSelectCourse: (courseId: string) => void
}

export function ModuleSelect({ onSelectCourse }: ModuleSelectProps) {
  const { level, xp, completedCourses, completedQuestions } = useGameStore()

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header — Level + XP */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Learn with Kitz</h1>
        <p className="mt-1 text-sm text-gray-500">Complete courses to power up Kitz</p>
        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="rounded-full bg-purple-100 px-4 py-1.5 text-sm font-semibold text-purple-700">
            Level {level}
          </div>
          <div className="text-sm font-medium text-gray-600">
            {xp} XP
          </div>
        </div>
      </div>

      {/* Course cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {COURSES.map((course) => {
          const isCompleted = completedCourses.includes(course.id)
          const answered = completedQuestions[course.id]?.length ?? 0
          const total = course.questions.length
          const progress = total > 0 ? Math.round((answered / total) * 100) : 0

          return (
            <button
              key={course.id}
              onClick={() => onSelectCourse(course.id)}
              className="group relative rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-purple-300 hover:shadow-md"
            >
              {isCompleted && (
                <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs text-white">
                  ✓
                </div>
              )}
              <div className="mb-2 text-2xl">{course.icon}</div>
              <h3 className="text-sm font-bold text-gray-900">{course.title}</h3>
              <p className="mt-1 text-xs text-gray-500">{course.description}</p>
              {/* Progress bar */}
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progress}%`, background: course.color }}
                />
              </div>
              <p className="mt-1 text-[10px] text-gray-400">{answered}/{total} questions</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

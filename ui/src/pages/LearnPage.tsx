import { useState } from 'react'
import { ModuleSelect } from '@/components/learn/ModuleSelect'
import { QuestionCard } from '@/components/learn/QuestionCard'
import { COURSES } from '@/content/courses'
import { useGameStore } from '@/stores/gameStore'
import { Orb } from '@/components/orb/Orb'

export function LearnPage() {
  const {
    currentCourseId,
    currentQuestionIndex,
    level,
    completedQuestions,
    startCourse,
    answerQuestion,
    completeCourse,
    nextQuestion,
    resetCourse,
  } = useGameStore()

  const [showComplete, setShowComplete] = useState(false)

  const currentCourse = COURSES.find((c) => c.id === currentCourseId)
  const currentQuestion = currentCourse?.questions[currentQuestionIndex]

  const handleSelectCourse = (courseId: string) => {
    setShowComplete(false)
    startCourse(courseId)
  }

  const handleAnswer = (correct: boolean) => {
    if (currentCourseId && currentQuestion) {
      answerQuestion(currentCourseId, currentQuestion.id, correct)
    }
  }

  const handleNext = () => {
    if (!currentCourse) return
    if (currentQuestionIndex + 1 >= currentCourse.questions.length) {
      completeCourse(currentCourse.id)
      setShowComplete(true)
    } else {
      nextQuestion()
    }
  }

  const handleBackToModules = () => {
    resetCourse()
    setShowComplete(false)
  }

  // Course complete screen
  if (showComplete && currentCourse) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
        <div className="mb-6 scale-150">
          <Orb level={level} static />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-gray-900">Course Complete!</h2>
        <p className="mt-2 text-sm text-gray-500">
          You finished &ldquo;{currentCourse.title}&rdquo; — Kitz leveled up!
        </p>
        <div className="mt-2 rounded-full bg-purple-100 px-4 py-1.5 text-sm font-semibold text-purple-700">
          Now Level {level}
        </div>
        <button
          onClick={handleBackToModules}
          className="mt-6 rounded-lg bg-purple-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-600"
        >
          Back to Courses
        </button>
      </div>
    )
  }

  // Question view
  if (currentCourse && currentQuestion) {
    const alreadyAnswered = (completedQuestions[currentCourse.id] ?? []).includes(currentQuestion.id)
    return (
      <div className="min-h-full py-8">
        {/* Back button */}
        <div className="mx-auto mb-4 max-w-lg px-4">
          <button
            onClick={handleBackToModules}
            className="text-sm font-medium text-gray-400 hover:text-gray-600"
          >
            &larr; Back to courses
          </button>
          <h3 className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {currentCourse.icon} {currentCourse.title}
          </h3>
        </div>
        <QuestionCard
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={currentCourse.questions.length}
          onAnswer={handleAnswer}
          onNext={handleNext}
          alreadyAnswered={alreadyAnswered}
        />
      </div>
    )
  }

  // Module select (default)
  return <ModuleSelect onSelectCourse={handleSelectCourse} />
}

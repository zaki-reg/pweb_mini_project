export interface Answer {
  id: string
  body: string
  questionId: string
  isCorrect?: boolean
}

export interface Question {
  id: string
  body: string
  type: 'SCQ' | 'MCQ'
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  explanation: string | null
  categoryId: string | null
  answers: Answer[]
  category?: { id: string; name: string } | null
}

export interface QuizSession {
  sessionToken: string
  username: string
  totalQuestions: number
  questions: Question[]
}

export interface QuestionResult {
  questionId: string
  questionBody: string
  userAnswers: Array<{
    id: string
    body: string
    isCorrect: boolean
  }>
  correctAnswers: Array<{
    id: string
    body: string
  }>
  explanation: string | null
}

export interface SubmitResult {
  score: number
  correctAnswers: number
  totalQuestions: number
  questions?: QuestionResult[]
}

export interface AdminQuestion extends Question {
  createdAt: string
  updatedAt: string
}

export interface Attempt {
  id: string
  username: string
  sessionToken: string
  startedAt: string
  submittedAt: string | null
  score: number | null
  totalQuestions: number
  correctAnswers: number | null
  timeTakenSeconds: number | null
}

export interface AttemptDetail extends Attempt {
  questions: QuestionResult[]
}

export interface Setting {
  id: number
  numQuestions: number
  timerEnabled: boolean
  timerSeconds: number
  allowReview: boolean
}

export interface Category {
  id: string
  name: string
  slug: string
  _count?: number
}

export interface Stats {
  totalQuestions: number
  totalAttempts: number
  averageScore: number | null
  recentAttempts: Array<{
    id: string
    username: string
    score: number | null
    submittedAt: string | null
  }>
}

export interface Admin {
  id: string
  email: string
  name: string
}
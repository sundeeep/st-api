/**
 * Student Quiz API Types
 */

export interface Reward {
  type: "ST_COINS" | "MOVIE_TICKETS";
  value: number;
  info: string;
}

export interface BrowseQuizzesFilters {
  categoryId?: string;
  quizType?: "timed" | "practice" | "competitive" | "assessment";
  search?: string;
  page?: string;
  limit?: string;
}

export interface FeaturedQuizItem {
  id: string;
  quizName: string;
  quizType: string;
  categoryName?: string;
  bannerImage?: string;
  timerDuration?: number;
}

export interface FeaturedQuizzesResponse {
  featuredQuizzes: FeaturedQuizItem[];
  quizzes: QuizListItem[];
}

export interface QuizListItem {
  id: string;
  quizName: string;
  quizType: string;
  categoryName?: string;
  bannerImage?: string;
  timerDuration?: number;
  totalQuestions: number;
  startDateTime?: string;
  endDateTime?: string;
  rewards?: Reward[];
  likeCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  isFeatured: boolean;
  status: "draft" | "scheduled" | "active" | "completed" | "archived";
}

export interface CategoryListItem {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface QuizDetails {
  id: string;
  quizName: string;
  quizType: string;
  about: {
    description: string;
    rules: string[];
  };
  categoryName?: string;
  bannerImage?: string;
  timerDuration?: number;
  totalQuestions: number;
  totalMarks: number;
  startDateTime?: string;
  endDateTime?: string;
  rewards?: Reward[];
  createdAt: string;
  hasAttempted: boolean;
  myBestScore?: number;
  lastAttemptId?: string;
  myRank?: number;
  attemptStatus: "not_started" | "in_progress" | "completed" | "max_attempts_reached";
  likeCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
}

export interface StartQuizResponse {
  attemptId: string;
  quizId: string;
  startedAt: string;
  question: QuizQuestion;
  currentQuestion: number;
  totalQuestions: number;
  totalMarks: number;
  timerDuration?: number;
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  questionType: string;
  marks: number;
  displayOrder: number;
  options: QuizOption[];
}

export interface QuizOption {
  id: string;
  optionText: string;
  displayOrder: number;
}

export interface SubmitAnswerRequest {
  questionId: string;
  selectedOptionIds: string[];
}

export interface SubmitAnswerResponse {
  answerId: string;
  saved: boolean;
  nextQuestion?: QuizQuestion;
  currentQuestion?: number;
  totalQuestions?: number;
  isComplete?: boolean;
}

export interface CompleteQuizRequest {
  completedAt: string;
}

export interface CompleteQuizResponse {
  attemptId: string;
  quizId: string;
  score: number;
  totalMarks: number;
  percentage: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedQuestions: number;
  timeTaken: number;
  rank?: number;
  resultId: string;
}

export interface AttemptResult {
  attemptId: string;
  quizId: string;
  quizName: string;
  studentId: string;
  studentName: string;
  score: number;
  totalMarks: number;
  percentage: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedQuestions: number;
  startedAt: string;
  completedAt: string;
  timeTaken: number;
  passed: boolean;
  rank?: number;
  answers: QuestionAnswer[];
}

export interface QuestionAnswer {
  questionId: string;
  questionText: string;
  marks: number;
  selectedOptionIds: string[];
  selectedOptionTexts: string[];
  correctOptionIds: string[];
  correctOptionTexts: string[];
  isCorrect: boolean;
  marksAwarded: number;
  timeTaken?: number;
}

export interface MyAttemptsFilters {
  quizId?: string;
  status?: "in_progress" | "completed";
  page?: string;
  limit?: string;
}

export interface AttemptListItem {
  attemptId: string;
  quizId: string;
  quizName: string;
  categoryName?: string;
  score?: number;
  totalMarks: number;
  percentage?: number;
  status: string;
  startedAt: string;
  completedAt?: string;
  timeTaken?: number;
  rank?: number;
  passed?: boolean;
}

export interface LeaderboardFilters {
  page?: string;
  limit?: string;
}

export interface LeaderboardResponse {
  quizId: string;
  quizName: string;
  topRanks: LeaderboardEntry[];
  myRank: LeaderboardEntry | null;
  stats: {
    totalParticipants: number;
    topScore: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  attemptId?: string;
  score: number;
  percentage: number;
  timeTaken: number;
  completedAt: string;
  isMe: boolean;
}

export interface CreateAttemptData {
  quizId: string;
  userId: string;
  startedAt: Date;
}

export interface SaveAnswerData {
  attemptId: string;
  questionId: string;
  selectedOptionIds: string[];
  timeTaken?: number;
}

export interface CompleteAttemptData {
  attemptId: string;
  userId: string;
  completedAt: Date;
}

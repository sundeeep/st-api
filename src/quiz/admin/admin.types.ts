import type { Context } from "elysia";

export interface AuthenticatedContext extends Context {
  user: {
    id: string;
    mobile: string;
    email?: string;
    role: string;
    onboardingComplete: boolean;
  };
  userId: string;
}

export interface CreateCategoryBody {
  name: string;
  description?: string;
}

export interface UpdateCategoryBody {
  name?: string;
  description?: string;
}

export interface Reward {
  type: "ST_COINS" | "MOVIE_TICKETS";
  value: number;
  info: string;
}

export interface CreateQuizBody {
  categoryId?: string;
  quizName: string;
  quizType: "timed" | "practice" | "competitive" | "assessment";
  about: {
    description: string;
    rules: string[];
  };
  bannerImage?: string;
  rewards?: Reward[];
  timerDuration?: number;
  startDate: string;
  endDate: string;
  revealAnswersDate?: string;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
}

export interface UpdateQuizBody {
  categoryId?: string;
  quizName?: string;
  quizType?: "timed" | "practice" | "competitive" | "assessment";
  about?: {
    description: string;
    rules: string[];
  };
  bannerImage?: string;
  rewards?: Reward[];
  timerDuration?: number;
  startDate?: string;
  endDate?: string;
  revealAnswersDate?: string;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  status?: "draft" | "scheduled" | "active" | "completed" | "archived";
}

export interface QuestionOption {
  optionText: string;
  isCorrect: boolean;
  displayOrder: number;
}

export interface CreateQuestionBody {
  questionText: string;
  explanation?: string;
  points?: number;
  options: QuestionOption[];
}

export interface AddQuestionsBody {
  questions: CreateQuestionBody[];
}

export interface UpdateQuestionBody {
  questionText?: string;
  explanation?: string;
  points?: number;
  options?: QuestionOption[];
}

export interface QuizFilters {
  categoryId?: string;
  status?: "draft" | "scheduled" | "active" | "completed" | "archived";
  quizType?: "timed" | "practice" | "competitive" | "assessment";
  search?: string;
  page?: string | number;
  limit?: string | number;
}

export interface QuizWithDetails {
  id: string;
  categoryId?: string;
  categoryName?: string;
  quizName: string;
  quizType: string;
  about: {
    description: string;
    rules: string[];
  };
  bannerImage?: string;
  rewards?: Reward[];
  timerDuration?: number;
  startDate: Date;
  endDate: Date;
  revealAnswersDate?: Date;
  questionsCount: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  participantsCount: number;
  completedCount: number;
  averageScore: string;
  status: string;
  isActive: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionWithOptions {
  id: string;
  quizId: string;
  questionText: string;
  explanation?: string;
  points: string;
  options: {
    id: string;
    optionText: string;
    isCorrect: boolean;
    displayOrder: number;
  }[];
}

export interface AnalyticsData {
  totalParticipants: number;
  completedAttempts: number;
  inProgressAttempts: number;
  abandonedAttempts: number;
  completionRate: number;
  averageScore: number;
  averageTimeSpent: number;
  scoreDistribution: {
    range: string;
    count: number;
  }[];
}

export interface DashboardStats {
  totalQuizzes: number;
  activeQuizzes: number;
  totalParticipants: number;
  totalCategories: number;
  recentQuizzes: QuizWithDetails[];
}

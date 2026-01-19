export interface ApplyToOpportunityBody {
  answers: Array<{
    questionId: string;
    answer: string | null;
  }>;
}

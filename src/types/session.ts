import type { QuestionType } from "@/data/questions";

export type SessionQuestion = {
  id: string;
  number: number;
  text: string;
  hint: string | null;
  type: QuestionType;
  options: string[] | null;
  allowVoice: boolean;
  isKey: boolean;
};

export type SessionBlockData = {
  code: string;
  title: string;
  description: string | null;
  questions: SessionQuestion[];
};

export type SessionAnswerData = {
  text: string | null;
  skipped: boolean;
  isEdited: boolean;
};

export type SessionStatus = "created" | "in_progress" | "completed" | "abandoned";
export type SessionMode = "self" | "interviewer";

export type SessionStartResponse = {
  session: {
    status: SessionStatus;
    currentQuestion: number;
    startedAt: string | null;
    completedAt: string | null;
  };
  respondent: {
    fullName: string;
    orgName: string | null;
  };
  questionnaire: {
    title: string;
  };
  blocks: SessionBlockData[];
  // number (savol raqami) bo'yicha kalitlangan
  answers: Record<number, SessionAnswerData>;
};

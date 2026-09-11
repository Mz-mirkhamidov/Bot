import type { SessionMode, SessionStatus } from "./session";
import type { QuestionType } from "@/data/questions";

export type AdminSessionListItem = {
  id: string;
  token: string;
  mode: SessionMode;
  status: SessionStatus;
  currentQuestion: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  answeredCount: number;
  totalCount: number;
  respondent: {
    fullName: string;
    orgName: string | null;
    orgType: string;
    phone: string | null;
  };
};

export type AdminSessionAnswer = {
  number: number;
  text: string;
  hint: string | null;
  type: QuestionType;
  isKey: boolean;
  answerText: string | null;
  skipped: boolean;
  audioPath: string | null;
  transcript: string | null;
  isEdited: boolean;
  flag: string | null;
};

export type AdminSessionBlock = {
  code: string;
  title: string;
  questions: AdminSessionAnswer[];
};

export type AiSummaryJson = {
  biggest_pain: string;
  pain_evidence: string[];
  numbers_mentioned: { what: string; value: string; question: number }[];
  time_costs: { activity: string; hours_per_month: number }[];
  money_at_risk: string | null;
  already_paid_for: string | null;
  hypothesis_signals: { subsidy: string; documents: string; occupancy: string };
  green_flags: string[];
  red_flags: string[];
  quotes_worth_keeping: string[];
  missing_info: string[];
};

export type SummarySheetManual = {
  biggestPain: string | null;
  hoursPerMonth: number | null;
  moneyLost12m: number | null;
  currentSolution: string | null;
  paidBefore: boolean | null;
  paidBeforeAmount: number | null;
  hypothesisConfirmed: string | null;
  referralOk: boolean | null;
  telegramGroup: string | null;
  surprise: string | null;
};

export type AdminSessionSummary = {
  aiSummary: AiSummaryJson | null;
  aiGeneratedAt: string | null;
  manual: SummarySheetManual;
};

export type AdminSessionDetail = {
  session: {
    id: string;
    token: string;
    mode: SessionMode;
    status: SessionStatus;
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
  };
  respondent: {
    fullName: string;
    orgName: string | null;
    phone: string | null;
    orgType: string;
    childrenCount: number | null;
    notes: string | null;
  };
  blocks: AdminSessionBlock[];
  summary: AdminSessionSummary;
};

export type CompareRespondent = {
  sessionId: string;
  fullName: string;
  orgName: string | null;
};

export type CompareQuestionRow = {
  number: number;
  text: string;
  isKey: boolean;
  answers: Record<string, string | null>;
};

export type CompareResponse = {
  respondents: CompareRespondent[];
  rows: CompareQuestionRow[];
};

export type NewSessionInput = {
  fullName: string;
  orgName?: string;
  phone?: string;
  orgType?: "subsidized" | "non_subsidized" | "unknown" | "other";
  childrenCount?: number;
  notes?: string;
  mode: SessionMode;
};

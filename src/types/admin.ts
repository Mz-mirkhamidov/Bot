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

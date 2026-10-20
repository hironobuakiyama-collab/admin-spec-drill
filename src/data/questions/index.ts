import type { Question } from "../types";
import { setupQuestions } from "./setup";
import { objectQuestions } from "./object";
import { salesQuestions } from "./sales";
import { serviceQuestions } from "./service";
import { productivityQuestions } from "./productivity";
import { dataQuestions } from "./data";
import { automationQuestions } from "./automation";
import { agentforceQuestions } from "./agentforce";

export const QUESTIONS: Question[] = [
  ...setupQuestions,
  ...objectQuestions,
  ...salesQuestions,
  ...serviceQuestions,
  ...productivityQuestions,
  ...dataQuestions,
  ...automationQuestions,
  ...agentforceQuestions,
];

const byId = new Map(QUESTIONS.map((q) => [q.id, q]));

export function getQuestion(id: string): Question | undefined {
  return byId.get(id);
}

import { create } from "zustand";
import type { Role } from "@/data/roles";

export interface ScenarioData {
  company: string;
  title: string;
  description: string;
  symptoms: string[];
  urgency: string;
  systems_affected: string[];
}

export interface EvaluationData {
  score: number;
  verdict: string;
  correct_points: string[];
  wrong_points: string[];
  best_solution: string[];
  tip: string;
  follow_up_scenario: string | null;
}

interface GameState {
  selectedRole: Role | null;
  currentScenario: ScenarioData | null;
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  xp: number;
  level: number;
  score: number;
  roundNumber: number;
  lastEvaluation: EvaluationData | null;
  isLoading: boolean;
  isGeneratingScenario: boolean;
  setRole: (role: Role) => void;
  setScenario: (scenario: ScenarioData) => void;
  setLastEvaluation: (evaluation: EvaluationData | null) => void;
  addXp: (amount: number) => void;
  setScore: (score: number) => void;
  addMessage: (msg: { role: "user" | "assistant" | "system"; content: string }) => void;
  setLoading: (loading: boolean) => void;
  setGeneratingScenario: (loading: boolean) => void;
  incrementRound: () => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  selectedRole: null,
  currentScenario: null,
  xp: 0,
  level: 1,
  score: 0,
  roundNumber: 1,
  lastEvaluation: null,
  messages: [],
  isLoading: false,
  isGeneratingScenario: false,
  setRole: (role) => set({ selectedRole: role, messages: [], currentScenario: null, roundNumber: 1, lastEvaluation: null }),
  setScenario: (scenario) =>
    set({
      currentScenario: scenario,
      lastEvaluation: null,
      messages: [],
    }),
  setLastEvaluation: (evaluation) => set({ lastEvaluation: evaluation }),
  addXp: (amount) =>
    set((s) => {
      const newXp = s.xp + amount;
      return { xp: newXp, level: Math.floor(newXp / 100) + 1 };
    }),
  setScore: (score) => set({ score }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setLoading: (loading) => set({ isLoading: loading }),
  setGeneratingScenario: (loading) => set({ isGeneratingScenario: loading }),
  incrementRound: () => set((s) => ({ roundNumber: s.roundNumber + 1 })),
  reset: () =>
    set({
      selectedRole: null,
      currentScenario: null,
      score: 0,
      roundNumber: 1,
      lastEvaluation: null,
      messages: [],
    }),
}));

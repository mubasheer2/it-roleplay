import { create } from "zustand";

export interface ServiceStatus {
  name: string;
  status: "running" | "warning" | "failed" | "restarting";
  pid?: number;
  cpu?: number;
  mem?: number;
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  services: ServiceStatus[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "ALERT" | "DEBUG";
  source: string;
  message: string;
}

export interface AlertEntry {
  id: string;
  level: "critical" | "warning" | "info";
  title: string;
  message: string;
  timestamp: number;
  dismissed: boolean;
}

export interface InfraNode {
  id: string;
  name: string;
  type: "loadbalancer" | "api" | "database" | "cache" | "auth" | "worker";
  status: "healthy" | "degraded" | "down";
  connections: string[];
  metrics: { cpu: number; mem: number; requests?: number };
}

interface SystemState {
  metrics: SystemMetrics;
  logs: LogEntry[];
  alerts: AlertEntry[];
  infraNodes: InfraNode[];
  timeLeft: number;
  timerActive: boolean;
  scenarioResolved: boolean;
  actionsPerformed: string[];

  setMetrics: (m: Partial<SystemMetrics>) => void;
  addLog: (log: LogEntry) => void;
  setLogs: (logs: LogEntry[]) => void;
  addAlert: (alert: Omit<AlertEntry, "id" | "dismissed">) => void;
  dismissAlert: (id: string) => void;
  setInfraNodes: (nodes: InfraNode[]) => void;
  updateInfraNode: (id: string, update: Partial<InfraNode>) => void;
  setTimeLeft: (t: number) => void;
  setTimerActive: (v: boolean) => void;
  tickTimer: () => void;
  performAction: (action: string, effect: () => void) => void;
  setScenarioResolved: (v: boolean) => void;
  resetSystem: () => void;
  initScenario: (scenario: {
    services: ServiceStatus[];
    logs: LogEntry[];
    alerts: Omit<AlertEntry, "id" | "dismissed">[];
    nodes: InfraNode[];
    metrics: SystemMetrics;
    timeLimit: number;
  }) => void;
}

const defaultMetrics: SystemMetrics = {
  cpu: 15,
  memory: 30,
  disk: 45,
  network: 10,
  services: [],
};

export const useSystemStore = create<SystemState>((set, get) => ({
  metrics: defaultMetrics,
  logs: [],
  alerts: [],
  infraNodes: [],
  timeLeft: 300,
  timerActive: false,
  scenarioResolved: false,
  actionsPerformed: [],

  setMetrics: (m) =>
    set((s) => ({ metrics: { ...s.metrics, ...m } })),

  addLog: (log) =>
    set((s) => ({ logs: [log, ...s.logs].slice(0, 200) })),

  setLogs: (logs) => set({ logs }),

  addAlert: (alert) =>
    set((s) => ({
      alerts: [
        { ...alert, id: crypto.randomUUID(), dismissed: false },
        ...s.alerts,
      ].slice(0, 20),
    })),

  dismissAlert: (id) =>
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === id ? { ...a, dismissed: true } : a)),
    })),

  setInfraNodes: (nodes) => set({ infraNodes: nodes }),

  updateInfraNode: (id, update) =>
    set((s) => ({
      infraNodes: s.infraNodes.map((n) => (n.id === id ? { ...n, ...update } : n)),
    })),

  setTimeLeft: (t) => set({ timeLeft: t }),
  setTimerActive: (v) => set({ timerActive: v }),

  tickTimer: () =>
    set((s) => {
      if (!s.timerActive || s.timeLeft <= 0) return {};
      return { timeLeft: s.timeLeft - 1 };
    }),

  performAction: (action, effect) => {
    set((s) => ({ actionsPerformed: [...s.actionsPerformed, action] }));
    effect();
  },

  setScenarioResolved: (v) => set({ scenarioResolved: v }),

  resetSystem: () =>
    set({
      metrics: defaultMetrics,
      logs: [],
      alerts: [],
      infraNodes: [],
      timeLeft: 300,
      timerActive: false,
      scenarioResolved: false,
      actionsPerformed: [],
    }),

  initScenario: ({ services, logs, alerts, nodes, metrics, timeLimit }) => {
    set({
      metrics: { ...metrics, services },
      logs,
      alerts: alerts.map((a) => ({ ...a, id: crypto.randomUUID(), dismissed: false })),
      infraNodes: nodes,
      timeLeft: timeLimit,
      timerActive: true,
      scenarioResolved: false,
      actionsPerformed: [],
    });
  },
}));

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  useGameStore,
  type ScenarioData,
  type EvaluationData,
} from "@/store/gameStore";
import { useSystemStore } from "@/store/systemStore";
import { buildEnvironmentFromScenario } from "@/lib/scenarioEngine";
import { difficultyMultiplier } from "@/data/roles";
import {
  Send,
  Mic,
  MicOff,
  ArrowLeft,
  Zap,
  Trophy,
  Loader2,
  Terminal,
  FileText,
  Map,
  Activity,
  Bell,
  Wrench,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ScenarioPanel from "@/components/game/ScenarioPanel";
import EvaluationPanel from "@/components/game/EvaluationPanel";
import TerminalPanel from "@/components/game/TerminalPanel";
import MonitoringDashboard from "@/components/game/MonitoringDashboard";
import InfrastructureMap from "@/components/game/InfrastructureMap";
import LogExplorer from "@/components/game/LogExplorer";
import AlertsSidebar from "@/components/game/AlertsSidebar";
import ActionPanel from "@/components/game/ActionPanel";
import CountdownTimer from "@/components/game/CountdownTimer";

type CenterTab = "scenario" | "terminal" | "logs";
type RightTab = "monitor" | "infra" | "actions";

const GamePage = () => {
  const navigate = useNavigate();
  const {
    selectedRole,
    currentScenario,
    xp,
    level,
    roundNumber,
    lastEvaluation,
    isLoading,
    isGeneratingScenario,
    setScenario,
    setLastEvaluation,
    setLoading,
    setGeneratingScenario,
    addXp,
    incrementRound,
    reset,
  } = useGameStore();

  const systemStore = useSystemStore();

  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [centerTab, setCenterTab] = useState<CenterTab>("scenario");
  const [rightTab, setRightTab] = useState<RightTab>("monitor");
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const xpProgress = (xp % 100);

  useEffect(() => {
    if (!selectedRole) {
      navigate("/roles");
      return;
    }
    if (!currentScenario && !isGeneratingScenario) {
      generateScenario();
    }
  }, [selectedRole]);

  // Init system when scenario changes
  useEffect(() => {
    if (currentScenario) {
      const env = buildEnvironmentFromScenario(currentScenario, roundNumber);
      systemStore.initScenario({
        services: env.services,
        logs: env.logs,
        alerts: env.alerts,
        nodes: env.nodes,
        metrics: env.metrics,
        timeLimit: env.timeLimit,
      });
      // Store responses in ref for terminal
      terminalEnvRef.current = env;
    }
  }, [currentScenario]);

  const terminalEnvRef = useRef<ReturnType<typeof buildEnvironmentFromScenario> | null>(null);

  const generateScenario = async () => {
    if (!selectedRole) return;
    setGeneratingScenario(true);
    setLastEvaluation(null);
    systemStore.resetSystem();
    try {
      const { data, error } = await supabase.functions.invoke("generate-scenario", {
        body: {
          role: selectedRole.name,
          difficulty: selectedRole.difficulty,
          roundNumber,
        },
      });
      if (error) throw error;
      setScenario(data as ScenarioData);
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate scenario. Using fallback.");
      setScenario({
        company: "TechCorp Inc.",
        title: "Production System Down",
        description:
          "Critical production outage reported. Users are unable to access the system. Multiple alerts firing across all services.",
        symptoms: [
          "500 errors on all endpoints",
          "Database connection timeouts",
          "Memory usage at 98%",
        ],
        urgency: "Critical",
        systems_affected: ["API Gateway", "PostgreSQL", "Redis Cache"],
      });
    } finally {
      setGeneratingScenario(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !currentScenario || !selectedRole) return;
    const userMsg = input.trim();
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("evaluate-answer", {
        body: {
          role: selectedRole.name,
          scenario: `${currentScenario.title}: ${currentScenario.description}. Symptoms: ${currentScenario.symptoms?.join(", ")}. Systems affected: ${currentScenario.systems_affected?.join(", ")}`,
          answer: userMsg,
          difficulty: selectedRole.difficulty,
          roundNumber,
          actionsPerformed: systemStore.actionsPerformed,
        },
      });
      if (error) throw error;

      const evaluation = data as EvaluationData;
      const mult = difficultyMultiplier[selectedRole.difficulty] || 1.5;
      const earnedXp = Math.round(evaluation.score * mult);
      addXp(earnedXp);
      setLastEvaluation(evaluation);

      // If score good, resolve the scenario visually
      if (evaluation.score >= 6) {
        systemStore.setScenarioResolved(true);
        systemStore.setTimerActive(false);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to evaluate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNextScenario = () => {
    incrementRound();
    setLastEvaluation(null);
    setScenario(null as any);
    systemStore.resetSystem();
    setCenterTab("scenario");
    setTimeout(() => generateScenario(), 100);
  };

  const handleTimerExpire = useCallback(() => {
    systemStore.setTimerActive(false);
    toast.error("⏰ Time's up! Scenario failed.", {
      description: "The incident was not resolved in time.",
      duration: 5000,
    });
    // Still allow submitting answer
  }, []);

  const toggleVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      toast.error("Voice input not supported in this browser");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
      setInput((prev) => prev + " " + e.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.onerror = () => {
      setIsListening(false);
      toast.error("Voice recognition failed.");
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  if (!selectedRole) return null;

  const earnedXp = lastEvaluation
    ? Math.round(lastEvaluation.score * (difficultyMultiplier[selectedRole.difficulty] || 1.5))
    : 0;

  const alertCount = systemStore.alerts.filter((a) => !a.dismissed).length;
  const termEnv = terminalEnvRef.current;

  const centerTabs = [
    { id: "scenario" as CenterTab, label: "Incident", icon: LayoutDashboard },
    { id: "terminal" as CenterTab, label: "Terminal", icon: Terminal },
    { id: "logs" as CenterTab, label: "Logs", icon: FileText },
  ];

  const rightTabs = [
    { id: "monitor" as RightTab, label: "Monitor", icon: Activity },
    { id: "infra" as RightTab, label: "Infra", icon: Map },
    { id: "actions" as RightTab, label: "Actions", icon: Wrench },
  ];

  return (
    <div className="h-screen flex flex-col bg-background cyber-grid overflow-hidden">
      {/* ── TOP BAR ── */}
      <header className="glass-strong border-b border-border/60 px-3 py-2 flex items-center gap-3 z-20 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { reset(); navigate("/roles"); }}
          className="text-muted-foreground hover:text-foreground h-7 w-7"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-2">
          <selectedRole.icon className="w-4 h-4 text-primary" />
          <span className="font-mono font-bold text-foreground text-xs">{selectedRole.name}</span>
          <span className="hidden sm:inline text-[10px] font-mono text-muted-foreground border border-border/40 px-1.5 py-0.5 rounded">
            {selectedRole.difficulty}
          </span>
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-border/40 mx-1" />

        {/* Round */}
        <span className="text-xs font-mono text-muted-foreground">
          Round <span className="text-primary font-bold">{roundNumber}</span>
        </span>

        {/* Timer */}
        {systemStore.timerActive && (
          <CountdownTimer onExpire={handleTimerExpire} />
        )}

        <div className="ml-auto flex items-center gap-3">
          {/* XP Bar */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs font-mono">
              <Trophy className="w-3.5 h-3.5 text-neon-amber" />
              <span className="text-foreground">Lvl {level}</span>
            </div>
            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full gradient-primary rounded-full"
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="flex items-center gap-1 text-xs font-mono">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-primary">{xp} XP</span>
            </div>
          </div>

          {/* Alert badge */}
          {alertCount > 0 && (
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex items-center gap-1 text-xs font-mono text-destructive border border-destructive/40 px-2 py-0.5 rounded-lg bg-destructive/10"
            >
              <Bell className="w-3 h-3" />
              <span>{alertCount}</span>
            </motion.div>
          )}
        </div>
      </header>

      {/* ── MAIN LAYOUT ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── LEFT SIDEBAR ── */}
        <motion.div
          animate={{ width: leftCollapsed ? 36 : 220 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 border-r border-border/40 flex flex-col bg-[hsl(220_18%_5%/0.9)] overflow-hidden"
        >
          {leftCollapsed ? (
            <div className="flex flex-col items-center py-3 gap-4">
              <button
                onClick={() => setLeftCollapsed(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <Bell className={`w-4 h-4 mt-2 ${alertCount > 0 ? "text-destructive animate-pulse" : "text-muted-foreground"}`} />
              <Map className="w-4 h-4 text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
                <span className="text-[10px] font-mono text-muted-foreground font-bold">OPERATIONS</span>
                <button onClick={() => setLeftCollapsed(true)} className="text-muted-foreground hover:text-foreground">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Alerts - top half */}
              <div className="flex-1 min-h-0 overflow-hidden border-b border-border/30">
                <AlertsSidebar
                  alerts={systemStore.alerts}
                  onDismiss={systemStore.dismissAlert}
                />
              </div>

              {/* Infrastructure map - bottom half */}
              <div className="h-[240px] flex-shrink-0">
                <InfrastructureMap nodes={systemStore.infraNodes} />
              </div>
            </>
          )}
        </motion.div>

        {/* ── CENTER PANEL ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Center tab bar */}
          <div className="flex items-center border-b border-border/40 bg-[hsl(220_18%_5%/0.5)] flex-shrink-0">
            {centerTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = centerTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCenterTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono border-b-2 transition-colors ${
                    isActive
                      ? "border-primary text-primary bg-primary/5"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Center content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {/* Scenario Tab */}
            {centerTab === "scenario" && (
              <div className="h-full overflow-y-auto scrollbar-hide px-4 py-4">
                <div className="max-w-2xl mx-auto space-y-4">
                  {isGeneratingScenario && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <p className="font-mono text-sm text-muted-foreground">Generating crisis scenario...</p>
                      <p className="font-mono text-xs text-muted-foreground/60">Spinning up virtual infrastructure...</p>
                    </div>
                  )}

                  {currentScenario && !isGeneratingScenario && (
                    <ScenarioPanel scenario={currentScenario} roundNumber={roundNumber} />
                  )}

                  <AnimatePresence>
                    {lastEvaluation && (
                      <EvaluationPanel
                        evaluation={lastEvaluation}
                        earnedXp={earnedXp}
                        onNextScenario={handleNextScenario}
                      />
                    )}
                  </AnimatePresence>

                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="glass rounded-xl p-5 flex items-center gap-3"
                    >
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      <div>
                        <p className="font-mono text-sm text-foreground">AI evaluating your answer...</p>
                        <p className="font-mono text-xs text-muted-foreground mt-0.5">Analyzing technical accuracy and completeness</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {/* Terminal Tab */}
            {centerTab === "terminal" && (
              <div className="h-full">
                {termEnv ? (
                  <TerminalPanel
                    terminalResponses={termEnv.terminalResponses}
                    terminalFilesystem={termEnv.terminalFilesystem}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground font-mono text-sm">
                    Waiting for scenario...
                  </div>
                )}
              </div>
            )}

            {/* Logs Tab */}
            {centerTab === "logs" && (
              <div className="h-full">
                <LogExplorer logs={systemStore.logs} />
              </div>
            )}
          </div>

          {/* ── BOTTOM INPUT BAR ── */}
          {!lastEvaluation && currentScenario && !isGeneratingScenario && (
            <div className="border-t border-border/40 px-4 py-3 glass-strong flex-shrink-0">
              {roundNumber <= 2 ? (
                <p className="text-[10px] font-mono text-terminal-green/80 mb-2">
                  🟢 Round {roundNumber} — <strong>Beginner friendly!</strong> Just read the scenario above and explain what you think the problem is and how you would fix it. Simple language is fine!
                </p>
              ) : (
                <p className="text-[10px] font-mono text-muted-foreground mb-2">
                  💡 Use the Terminal &amp; Logs tabs to investigate, then describe your diagnosis and fix below (English or Hindi accepted)
                </p>
              )}
              <div className="flex items-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleVoice}
                  className={`shrink-0 h-8 w-8 mb-0.5 ${
                    isListening ? "text-destructive" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={roundNumber <= 2
                    ? "What do you think the problem is? How would you fix it? (Write in plain English or Hindi)"
                    : "Describe your investigation findings, diagnosis, and the fix you would apply..."}
                  rows={1}
                  className="flex-1 bg-input rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary font-mono resize-none"
                />
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="shrink-0 mb-0.5 gradient-primary text-primary-foreground disabled:opacity-40 h-8 px-3 font-mono text-xs"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Submit
                </Button>
              </div>
              {isListening && (
                <p className="text-center text-xs text-destructive font-mono mt-2 animate-pulse">
                  🎤 Listening...
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        <motion.div
          animate={{ width: rightCollapsed ? 36 : 260 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 border-l border-border/40 flex flex-col bg-[hsl(220_18%_5%/0.9)] overflow-hidden"
        >
          {rightCollapsed ? (
            <div className="flex flex-col items-center py-3 gap-4">
              <button
                onClick={() => setRightCollapsed(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <Activity className="w-4 h-4 text-muted-foreground" />
              <Map className="w-4 h-4 text-muted-foreground" />
              <Wrench className="w-4 h-4 text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Right tab bar */}
              <div className="flex items-center border-b border-border/30 flex-shrink-0">
                {rightTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = rightTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setRightTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-mono border-b-2 transition-colors ${
                        isActive
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {tab.label}
                    </button>
                  );
                })}
                <button
                  onClick={() => setRightCollapsed(true)}
                  className="px-2 text-muted-foreground hover:text-foreground border-b-2 border-transparent py-2"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Right content */}
              <div className="flex-1 min-h-0 overflow-hidden">
                {rightTab === "monitor" && (
                  <MonitoringDashboard
                    metrics={systemStore.metrics}
                    scenarioResolved={systemStore.scenarioResolved}
                  />
                )}
                {rightTab === "infra" && (
                  <InfrastructureMap nodes={systemStore.infraNodes} />
                )}
                {rightTab === "actions" && (
                  <ActionPanel
                    services={systemStore.metrics.services}
                    onAction={(id, effect) => {
                      systemStore.performAction(id, () => {
                        // Apply mild metric improvement for fix actions
                        if (effect !== "restart_server") {
                          systemStore.setMetrics({
                            cpu: Math.max(10, systemStore.metrics.cpu - 8),
                            memory: Math.max(20, systemStore.metrics.memory - 5),
                          });
                        }
                        systemStore.addLog({
                          id: crypto.randomUUID(),
                          timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
                          level: "INFO",
                          source: "admin",
                          message: `Action performed: ${id} by operator`,
                        });
                      });
                    }}
                    actionsPerformed={systemStore.actionsPerformed}
                  />
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default GamePage;

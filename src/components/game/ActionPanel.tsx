import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, RotateCcw, Shield, XCircle, Settings, Server, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ServiceStatus } from "@/store/systemStore";

interface Action {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  category: "fix" | "investigate" | "danger";
  effect: string;
}

const ACTIONS: Action[] = [
  { id: "restart-service", label: "Restart Service", description: "Restart a failed service", icon: RotateCcw, category: "fix", effect: "service_restart" },
  { id: "block-ip", label: "Block IP", description: "Add firewall rule to block suspicious IP", icon: Shield, category: "fix", effect: "block_ip" },
  { id: "kill-process", label: "Kill Process", description: "Terminate a runaway process", icon: XCircle, category: "danger", effect: "kill_process" },
  { id: "rollback-deploy", label: "Rollback Deploy", description: "Rollback to previous deployment", icon: RotateCcw, category: "fix", effect: "rollback" },
  { id: "clear-cache", label: "Clear Cache", description: "Flush Redis cache", icon: Server, category: "fix", effect: "clear_cache" },
  { id: "scale-up", label: "Scale Up", description: "Add more server capacity", icon: Zap, category: "fix", effect: "scale_up" },
  { id: "fix-config", label: "Fix Config", description: "Apply configuration fix", icon: Settings, category: "fix", effect: "fix_config" },
  { id: "restart-server", label: "Restart Server", description: "Full server restart (last resort)", icon: Server, category: "danger", effect: "restart_server" },
];

interface ActionPanelProps {
  services: ServiceStatus[];
  onAction: (actionId: string, effect: string) => void;
  actionsPerformed: string[];
}

const categoryColors = {
  fix: "border-primary/40 hover:border-primary hover:bg-primary/10",
  investigate: "border-neon-amber/40 hover:border-neon-amber hover:bg-neon-amber/10",
  danger: "border-destructive/40 hover:border-destructive hover:bg-destructive/10",
};

const categoryLabel = {
  fix: "text-primary",
  investigate: "text-neon-amber",
  danger: "text-destructive",
};

const ActionPanel = ({ services, onAction, actionsPerformed }: ActionPanelProps) => {
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; success: boolean; msg: string } | null>(null);

  const handleAction = (action: Action) => {
    const wasPerformed = actionsPerformed.includes(action.id);
    const isCorrect = action.category === "fix" || (Math.random() > 0.3);

    setLastAction(action.id);
    onAction(action.id, action.effect);

    if (isCorrect) {
      setFeedback({ id: action.id, success: true, msg: `✅ ${action.label} executed successfully` });
      toast.success(`${action.label} executed`, { description: "System state updated" });
    } else {
      setFeedback({ id: action.id, success: false, msg: `❌ ${action.label} failed - wrong approach` });
      toast.error(`${action.label} had unintended effects`, { description: "Think carefully before acting" });
    }

    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="h-full flex flex-col p-3">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/40">
        <Zap className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-mono text-muted-foreground font-bold">ACTIONS</span>
        {actionsPerformed.length > 0 && (
          <span className="ml-auto text-[10px] font-mono text-muted-foreground">
            {actionsPerformed.length} performed
          </span>
        )}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mb-3 p-2 rounded-lg text-xs font-mono ${
              feedback.success ? "bg-neon-green/10 text-neon-green border border-neon-green/30" : "bg-destructive/10 text-destructive border border-destructive/30"
            }`}
          >
            {feedback.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          const done = actionsPerformed.includes(action.id);
          return (
            <motion.button
              key={action.id}
              onClick={() => handleAction(action)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                done ? "border-neon-green/30 bg-neon-green/5" : categoryColors[action.category]
              } glass`}
            >
              <div className="flex items-center gap-2">
                {done ? (
                  <CheckCircle className="w-4 h-4 text-neon-green shrink-0" />
                ) : (
                  <Icon className={`w-4 h-4 shrink-0 ${categoryLabel[action.category]}`} />
                )}
                <div className="min-w-0">
                  <p className={`text-xs font-mono font-bold ${done ? "text-neon-green" : "text-foreground"}`}>
                    {action.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{action.description}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default ActionPanel;

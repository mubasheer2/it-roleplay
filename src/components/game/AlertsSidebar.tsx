import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, AlertTriangle, Info, Zap } from "lucide-react";
import type { AlertEntry } from "@/store/systemStore";

interface AlertsSidebarProps {
  alerts: AlertEntry[];
  onDismiss: (id: string) => void;
}

const levelConfig = {
  critical: {
    border: "border-destructive/60",
    bg: "bg-destructive/10",
    icon: AlertTriangle,
    iconColor: "text-destructive",
    glow: "shadow-[0_0_10px_hsl(0_72%_55%/0.2)]",
  },
  warning: {
    border: "border-neon-amber/60",
    bg: "bg-neon-amber/10",
    icon: AlertTriangle,
    iconColor: "text-neon-amber",
    glow: "shadow-[0_0_8px_hsl(38_90%_55%/0.15)]",
  },
  info: {
    border: "border-primary/40",
    bg: "bg-primary/5",
    icon: Info,
    iconColor: "text-primary",
    glow: "",
  },
};

function timeAgo(timestamp: number) {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

const AlertsSidebar = ({ alerts, onDismiss }: AlertsSidebarProps) => {
  const active = alerts.filter((a) => !a.dismissed);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/40 flex-shrink-0">
        <Bell className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-mono text-muted-foreground font-bold">ALERTS</span>
        {active.length > 0 && (
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full"
          >
            {active.length}
          </motion.span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-2 space-y-2">
        {active.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <Zap className="w-8 h-8 opacity-20" />
            <p className="text-xs font-mono">No active alerts</p>
          </div>
        ) : (
          <AnimatePresence>
            {active.map((alert) => {
              const cfg = levelConfig[alert.level];
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  className={`relative rounded-lg border ${cfg.border} ${cfg.bg} ${cfg.glow} p-2.5`}
                >
                  <button
                    onClick={() => onDismiss(alert.id)}
                    className="absolute top-1.5 right-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="flex items-start gap-2 pr-4">
                    <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${cfg.iconColor} ${alert.level === "critical" ? "animate-pulse" : ""}`} />
                    <div className="min-w-0">
                      <p className={`text-[11px] font-mono font-bold ${cfg.iconColor} leading-tight`}>
                        {alert.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                        {alert.message}
                      </p>
                      <p className="text-[9px] text-muted-foreground/50 mt-1 font-mono">
                        {timeAgo(alert.timestamp)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default AlertsSidebar;

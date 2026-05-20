import { motion } from "framer-motion";
import { AlertTriangle, Server, Clock, Building2 } from "lucide-react";
import type { ScenarioData } from "@/store/gameStore";

const urgencyColors: Record<string, string> = {
  Low: "text-neon-green border-neon-green/30 bg-neon-green/10",
  Medium: "text-neon-amber border-neon-amber/30 bg-neon-amber/10",
  High: "text-destructive border-destructive/30 bg-destructive/10",
  Critical: "text-destructive border-destructive/50 bg-destructive/20 animate-pulse",
};

interface ScenarioPanelProps {
  scenario: ScenarioData;
  roundNumber: number;
}

const ScenarioPanel = ({ scenario, roundNumber }: ScenarioPanelProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-xl border border-primary/20 overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-primary/5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <span className="font-mono text-xs text-muted-foreground">ROUND {roundNumber}</span>
        </div>
        <span className={`text-xs font-mono px-2 py-0.5 rounded border ${urgencyColors[scenario.urgency] || urgencyColors.Medium}`}>
          {scenario.urgency?.toUpperCase()} PRIORITY
        </span>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <Building2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground font-mono">COMPANY</p>
            <p className="text-sm font-semibold text-foreground">{scenario.company}</p>
          </div>
        </div>

        <div>
          <h3 className="font-mono font-bold text-lg text-foreground glow-text-cyan">
            🚨 {scenario.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            {scenario.description}
          </p>
        </div>

        {/* Symptoms */}
        <div className="space-y-2">
          <p className="text-xs font-mono text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> REPORTED SYMPTOMS
          </p>
          <div className="space-y-1.5">
            {scenario.symptoms?.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className="flex items-center gap-2 text-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                <span className="text-foreground">{s}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Systems */}
        <div className="flex flex-wrap gap-2">
          {scenario.systems_affected?.map((sys, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 text-xs font-mono px-2 py-1 rounded bg-muted text-muted-foreground border border-border"
            >
              <Server className="w-3 h-3" />
              {sys}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ScenarioPanel;

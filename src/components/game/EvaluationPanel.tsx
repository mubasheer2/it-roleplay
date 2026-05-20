import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Lightbulb, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EvaluationData } from "@/store/gameStore";

const verdictColors: Record<string, string> = {
  Excellent: "text-neon-green",
  Good: "text-primary",
  Average: "text-neon-amber",
  "Needs Improvement": "text-destructive",
  Incorrect: "text-destructive",
};

const scoreColor = (score: number) => {
  if (score >= 8) return "text-neon-green glow-text-green";
  if (score >= 6) return "text-primary glow-text-cyan";
  if (score >= 4) return "text-neon-amber";
  return "text-destructive";
};

interface EvaluationPanelProps {
  evaluation: EvaluationData;
  earnedXp: number;
  onNextScenario: () => void;
}

const EvaluationPanel = ({ evaluation, earnedXp, onNextScenario }: EvaluationPanelProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", duration: 0.5 }}
      className="glass-strong rounded-xl border border-primary/20 overflow-hidden"
    >
      {/* Score Header */}
      <div className="p-5 border-b border-border bg-primary/5 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="inline-block"
        >
          <span className={`font-mono text-5xl font-extrabold ${scoreColor(evaluation.score)}`}>
            {evaluation.score}
          </span>
          <span className="text-2xl text-muted-foreground font-mono">/10</span>
        </motion.div>
        <p className={`font-mono text-sm mt-1 ${verdictColors[evaluation.verdict] || "text-foreground"}`}>
          {evaluation.verdict}
        </p>
        <p className="text-xs text-primary font-mono mt-2">+{earnedXp} XP ⚡</p>
      </div>

      <div className="p-5 space-y-4">
        {/* Correct */}
        {evaluation.correct_points?.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-mono text-neon-green flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> WHAT YOU GOT RIGHT
            </p>
            {evaluation.correct_points.map((p, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-sm text-foreground pl-5"
              >
                ✅ {p}
              </motion.p>
            ))}
          </div>
        )}

        {/* Wrong */}
        {evaluation.wrong_points?.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-mono text-destructive flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> NEEDS IMPROVEMENT
            </p>
            {evaluation.wrong_points.map((p, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 + 0.2 }}
                className="text-sm text-foreground pl-5"
              >
                ❌ {p}
              </motion.p>
            ))}
          </div>
        )}

        {/* Best Solution */}
        <div className="space-y-2">
          <p className="text-xs font-mono text-primary flex items-center gap-1">
            <Star className="w-3.5 h-3.5" /> BEST PROFESSIONAL SOLUTION
          </p>
          <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
            {evaluation.best_solution?.map((step, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 + 0.4 }}
                className="text-sm text-foreground"
              >
                <span className="text-primary font-mono font-bold mr-2">{i + 1}.</span>
                {step}
              </motion.p>
            ))}
          </div>
        </div>

        {/* Tip */}
        {evaluation.tip && (
          <div className="flex items-start gap-2 bg-neon-amber/5 border border-neon-amber/20 rounded-lg p-3">
            <Lightbulb className="w-4 h-4 text-neon-amber mt-0.5 shrink-0" />
            <p className="text-sm text-foreground">{evaluation.tip}</p>
          </div>
        )}

        {/* Follow-up */}
        {evaluation.follow_up_scenario && (
          <div className="text-sm text-muted-foreground italic border-t border-border pt-3">
            <p className="text-xs font-mono text-primary mb-1">AI SAYS:</p>
            {evaluation.follow_up_scenario}
          </div>
        )}

        <Button
          onClick={onNextScenario}
          className="w-full gradient-primary text-primary-foreground font-mono"
        >
          Next Challenge <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </motion.div>
  );
};

export default EvaluationPanel;

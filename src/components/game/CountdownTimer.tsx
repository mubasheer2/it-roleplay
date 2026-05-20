import { useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, AlertTriangle } from "lucide-react";
import { useSystemStore } from "@/store/systemStore";
import { toast } from "sonner";

interface CountdownTimerProps {
  onExpire?: () => void;
}

const CountdownTimer = ({ onExpire }: CountdownTimerProps) => {
  const { timeLeft, timerActive, tickTimer } = useSystemStore();

  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, tickTimer]);

  useEffect(() => {
    if (timeLeft === 60) {
      toast.warning("⚠️ 1 minute remaining!", { description: "Hurry up and resolve the incident!" });
    }
    if (timeLeft === 0 && timerActive) {
      onExpire?.();
    }
  }, [timeLeft, timerActive, onExpire]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const formatted = `${mins}:${secs.toString().padStart(2, "0")}`;

  const isUrgent = timeLeft <= 60;
  const isCritical = timeLeft <= 30;

  return (
    <div
      className={`flex items-center gap-1.5 font-mono text-sm font-bold px-2 py-1 rounded-lg border transition-colors ${
        isCritical
          ? "text-destructive border-destructive/40 bg-destructive/10 animate-pulse"
          : isUrgent
          ? "text-neon-amber border-neon-amber/40 bg-neon-amber/10"
          : "text-foreground border-border/40"
      }`}
    >
      {isUrgent ? (
        <AlertTriangle className={`w-3.5 h-3.5 ${isCritical ? "animate-bounce" : ""}`} />
      ) : (
        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
      )}
      <span>{formatted}</span>
    </div>
  );
};

export default CountdownTimer;

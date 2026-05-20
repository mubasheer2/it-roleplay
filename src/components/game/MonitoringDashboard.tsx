import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, HardDrive, Wifi, MemoryStick, Activity, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import type { SystemMetrics, ServiceStatus } from "@/store/systemStore";

interface MonitoringDashboardProps {
  metrics: SystemMetrics;
  scenarioResolved: boolean;
}

function MetricBar({
  label,
  value,
  icon: Icon,
  unit = "%",
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  unit?: string;
}) {
  const color =
    value >= 90
      ? "bg-destructive glow-red"
      : value >= 70
      ? "bg-neon-amber"
      : "bg-neon-green";
  const textColor =
    value >= 90 ? "text-destructive" : value >= 70 ? "text-neon-amber" : "text-neon-green";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className={`w-3.5 h-3.5 ${textColor}`} />
          <span className="text-xs font-mono text-muted-foreground">{label}</span>
        </div>
        <span className={`text-xs font-mono font-bold ${textColor}`}>
          {value.toFixed(1)}{unit}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function ServiceRow({ service }: { service: ServiceStatus }) {
  const statusConfig = {
    running: { color: "text-neon-green", icon: CheckCircle, label: "RUNNING" },
    warning: { color: "text-neon-amber", icon: AlertTriangle, label: "WARNING" },
    failed: { color: "text-destructive", icon: XCircle, label: "FAILED" },
    restarting: { color: "text-neon-amber", icon: Activity, label: "RESTARTING" },
  };
  const cfg = statusConfig[service.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0"
    >
      <div className="flex items-center gap-2">
        <cfg.icon className={`w-3 h-3 ${cfg.color} ${service.status === "restarting" ? "animate-spin" : ""}`} />
        <span className="text-xs font-mono text-foreground truncate max-w-[90px]">{service.name}</span>
      </div>
      <div className="flex items-center gap-2">
        {service.cpu !== undefined && (
          <span className="text-xs text-muted-foreground font-mono">{service.cpu}%</span>
        )}
        <span className={`text-[10px] font-mono font-bold ${cfg.color}`}>{cfg.label}</span>
      </div>
    </motion.div>
  );
}

// Sparkline-style mini chart
function MiniChart({ values }: { values: number[] }) {
  const max = 100;
  const h = 32;
  const w = values.length * 4;
  const points = values
    .map((v, i) => `${i * 4},${h - (v / max) * h}`)
    .join(" ");

  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
    </svg>
  );
}

const MonitoringDashboard = ({ metrics, scenarioResolved }: MonitoringDashboardProps) => {
  const [cpuHistory, setCpuHistory] = useState<number[]>(Array(20).fill(10));
  const [netHistory, setNetHistory] = useState<number[]>(Array(20).fill(5));
  const [displayMetrics, setDisplayMetrics] = useState(metrics);

  useEffect(() => {
    // Animate metrics toward target
    const interval = setInterval(() => {
      setDisplayMetrics((prev) => ({
        ...prev,
        cpu: prev.cpu + (metrics.cpu - prev.cpu) * 0.1 + (Math.random() - 0.5) * 2,
        memory: prev.memory + (metrics.memory - prev.memory) * 0.05,
        network: prev.network + (metrics.network - prev.network) * 0.1 + (Math.random() - 0.5) * 3,
        disk: prev.disk + (metrics.disk - prev.disk) * 0.02,
      }));

      setCpuHistory((prev) => [
        ...prev.slice(1),
        Math.min(100, Math.max(0, metrics.cpu + (Math.random() - 0.5) * 8)),
      ]);
      setNetHistory((prev) => [
        ...prev.slice(1),
        Math.min(100, Math.max(0, metrics.network + (Math.random() - 0.5) * 10)),
      ]);
    }, 1000);
    return () => clearInterval(interval);
  }, [metrics]);

  // Gradually recover metrics when scenario resolved
  useEffect(() => {
    if (!scenarioResolved) return;
    const interval = setInterval(() => {
      setDisplayMetrics((prev) => ({
        ...prev,
        cpu: Math.max(15, prev.cpu - 3),
        memory: Math.max(25, prev.memory - 2),
        network: Math.max(10, prev.network - 4),
        disk: Math.max(40, prev.disk - 1),
      }));
    }, 500);
    return () => clearInterval(interval);
  }, [scenarioResolved]);

  const cpu = Math.round(Math.max(0, Math.min(100, displayMetrics.cpu)));
  const memory = Math.round(Math.max(0, Math.min(100, displayMetrics.memory)));
  const disk = Math.round(Math.max(0, Math.min(100, displayMetrics.disk)));
  const network = Math.round(Math.max(0, Math.min(100, displayMetrics.network)));

  return (
    <div className="h-full flex flex-col overflow-y-auto scrollbar-hide space-y-3 p-3">
      {/* Header */}
      <div className="flex items-center gap-2 pb-1 border-b border-border/40">
        <Activity className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-mono text-muted-foreground font-bold">SYSTEM MONITOR</span>
        <div className={`ml-auto w-2 h-2 rounded-full ${scenarioResolved ? "bg-neon-green" : "bg-destructive animate-pulse"}`} />
        <span className={`text-[10px] font-mono ${scenarioResolved ? "text-neon-green" : "text-destructive"}`}>
          {scenarioResolved ? "STABLE" : "CRITICAL"}
        </span>
      </div>

      {/* CPU Sparkline */}
      <div className="glass rounded-lg p-2.5 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono text-muted-foreground">CPU ACTIVITY</span>
          <MiniChart values={cpuHistory} />
        </div>
        <MetricBar label="CPU" value={cpu} icon={Cpu} />
        <MetricBar label="Memory" value={memory} icon={MemoryStick} />
      </div>

      <div className="glass rounded-lg p-2.5 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono text-muted-foreground">NETWORK I/O</span>
          <MiniChart values={netHistory} />
        </div>
        <MetricBar label="Network" value={network} icon={Wifi} />
        <MetricBar label="Disk" value={disk} icon={HardDrive} />
      </div>

      {/* Services */}
      <div className="glass rounded-lg p-2.5">
        <p className="text-[10px] font-mono text-muted-foreground mb-2">SERVICES</p>
        <div className="space-y-0">
          {metrics.services.map((svc, i) => (
            <ServiceRow key={i} service={svc} />
          ))}
          {metrics.services.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">No services monitored</p>
          )}
        </div>
      </div>

      {/* System health summary */}
      <div className="glass rounded-lg p-2.5">
        <p className="text-[10px] font-mono text-muted-foreground mb-2">HEALTH SUMMARY</p>
        {[
          { label: "HTTP Endpoint", ok: !scenarioResolved ? cpu < 90 : true },
          { label: "DB Connection", ok: !scenarioResolved ? memory < 85 : true },
          { label: "Cache Layer", ok: !scenarioResolved ? network < 80 : true },
          { label: "Auth Service", ok: !scenarioResolved ? false : true },
        ].map(({ label, ok }) => (
          <div key={label} className="flex items-center justify-between py-1">
            <span className="text-[11px] font-mono text-muted-foreground">{label}</span>
            <div className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-neon-green" : "bg-destructive animate-pulse"}`} />
              <span className={`text-[10px] font-mono ${ok ? "text-neon-green" : "text-destructive"}`}>
                {ok ? "OK" : "FAIL"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonitoringDashboard;

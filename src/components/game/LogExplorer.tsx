import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Search, Filter, FileText, AlertTriangle, Info, Bug } from "lucide-react";
import type { LogEntry } from "@/store/systemStore";

interface LogExplorerProps {
  logs: LogEntry[];
}

const levelConfig: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  INFO: { color: "text-primary", bg: "bg-primary/10", icon: Info },
  DEBUG: { color: "text-muted-foreground", bg: "bg-muted/30", icon: Bug },
  WARN: { color: "text-neon-amber", bg: "bg-neon-amber/10", icon: AlertTriangle },
  ERROR: { color: "text-destructive", bg: "bg-destructive/10", icon: AlertTriangle },
  ALERT: { color: "text-destructive", bg: "bg-destructive/20", icon: AlertTriangle },
};

const LogExplorer = ({ logs }: LogExplorerProps) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("ALL");
  const scrollRef = useRef<HTMLDivElement>(null);

  const levels = ["ALL", "ALERT", "ERROR", "WARN", "INFO", "DEBUG"];

  const filtered = logs.filter((log) => {
    const matchLevel = filter === "ALL" || log.level === filter;
    const matchSearch =
      !search ||
      log.message.toLowerCase().includes(search.toLowerCase()) ||
      log.source.toLowerCase().includes(search.toLowerCase());
    return matchLevel && matchSearch;
  });

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <div className="p-2 border-b border-border/40 space-y-2 flex-shrink-0">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs..."
            className="w-full bg-muted/50 rounded px-7 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        {/* Filter buttons */}
        <div className="flex gap-1 flex-wrap">
          {levels.map((lvl) => {
            const cfg = levelConfig[lvl] || { color: "text-muted-foreground", bg: "" };
            const isActive = filter === lvl;
            return (
              <button
                key={lvl}
                onClick={() => setFilter(lvl)}
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                  isActive
                    ? `${cfg.bg} ${cfg.color} border-current`
                    : "border-border/40 text-muted-foreground hover:border-border"
                }`}
              >
                {lvl}
              </button>
            );
          })}
          <span className="ml-auto text-[10px] text-muted-foreground font-mono self-center">
            {filtered.length} entries
          </span>
        </div>
      </div>

      {/* Log list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide font-mono text-xs">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No logs match filter
          </div>
        ) : (
          filtered.map((log, i) => {
            const cfg = levelConfig[log.level] || levelConfig.INFO;
            const Icon = cfg.icon;
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className={`flex items-start gap-2 px-2 py-1.5 border-b border-border/20 hover:bg-muted/30 transition-colors ${
                  log.level === "ALERT" || log.level === "ERROR" ? "bg-destructive/5" : ""
                }`}
              >
                <Icon className={`w-3 h-3 mt-0.5 shrink-0 ${cfg.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[9px] font-bold ${cfg.color}`}>{log.level}</span>
                    <span className="text-muted-foreground/60 text-[9px]">{log.source}</span>
                    <span className="text-muted-foreground/40 text-[9px] ml-auto shrink-0">
                      {log.timestamp.split(" ")[1]}
                    </span>
                  </div>
                  <p className="text-foreground/90 leading-relaxed break-all">{log.message}</p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LogExplorer;

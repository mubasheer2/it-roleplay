import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Server, Database, Shield, Globe, Layers, Box, X, Activity, AlertCircle } from "lucide-react";
import type { InfraNode } from "@/store/systemStore";

interface InfrastructureMapProps {
  nodes: InfraNode[];
}

const typeIcons: Record<string, React.ElementType> = {
  loadbalancer: Globe,
  api: Server,
  database: Database,
  cache: Layers,
  auth: Shield,
  worker: Box,
};

const typeLabels: Record<string, string> = {
  loadbalancer: "Load Balancer",
  api: "API Server",
  database: "Database",
  cache: "Cache",
  auth: "Auth Service",
  worker: "Worker",
};

const statusColors: Record<string, string> = {
  healthy: "border-neon-green/50 bg-neon-green/10 text-neon-green",
  degraded: "border-neon-amber/50 bg-neon-amber/10 text-neon-amber",
  down: "border-destructive/50 bg-destructive/10 text-destructive",
};

const statusGlow: Record<string, string> = {
  healthy: "shadow-[0_0_12px_hsl(160_60%_45%/0.3)]",
  degraded: "shadow-[0_0_12px_hsl(38_90%_55%/0.3)]",
  down: "shadow-[0_0_12px_hsl(0_72%_55%/0.4)]",
};

interface NodePosition {
  x: number;
  y: number;
}

const nodePositions: Record<string, NodePosition> = {
  lb: { x: 50, y: 10 },
  api: { x: 50, y: 38 },
  db: { x: 20, y: 70 },
  cache: { x: 50, y: 70 },
  auth: { x: 80, y: 70 },
};

function ConnectionLine({ from, to, status }: { from: NodePosition; to: NodePosition; status: string }) {
  const color = status === "down" ? "stroke-destructive" : status === "degraded" ? "stroke-neon-amber" : "stroke-primary";
  return (
    <line
      x1={`${from.x}%`}
      y1={`${from.y + 6}%`}
      x2={`${to.x}%`}
      y2={`${to.y - 4}%`}
      className={color}
      strokeWidth="1"
      strokeDasharray={status === "down" ? "4 3" : "none"}
      opacity="0.4"
    />
  );
}

const InfrastructureMap = ({ nodes }: InfrastructureMapProps) => {
  const [selectedNode, setSelectedNode] = useState<InfraNode | null>(null);

  if (!nodes.length) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-xs text-muted-foreground font-mono">No infrastructure data</p>
      </div>
    );
  }

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <div className="h-full flex flex-col p-3">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/40">
        <Activity className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-mono text-muted-foreground font-bold">INFRASTRUCTURE MAP</span>
        <div className="ml-auto flex items-center gap-2 text-[10px] font-mono">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-neon-green inline-block" />OK</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-neon-amber inline-block" />WARN</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-destructive inline-block" />DOWN</span>
        </div>
      </div>

      <div className="relative flex-1 min-h-0">
        {/* SVG connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {nodes.map((node) =>
            node.connections.map((connId) => {
              const fromPos = nodePositions[node.id];
              const toPos = nodePositions[connId];
              if (!fromPos || !toPos) return null;
              const connNode = nodeMap[connId];
              const lineStatus = node.status === "down" || connNode?.status === "down" ? "down" : node.status;
              return (
                <ConnectionLine
                  key={`${node.id}-${connId}`}
                  from={fromPos}
                  to={toPos}
                  status={lineStatus}
                />
              );
            })
          )}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => {
          const pos = nodePositions[node.id];
          if (!pos) return null;
          const Icon = typeIcons[node.type] || Server;
          const colors = statusColors[node.status];
          const glow = statusGlow[node.status];

          return (
            <motion.button
              key={node.id}
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)" }}
              className={`absolute flex flex-col items-center gap-1 p-2 rounded-lg border ${colors} ${glow} cursor-pointer transition-all hover:scale-110 min-w-[64px]`}
              onClick={() => setSelectedNode(node.id === selectedNode?.id ? null : node)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[9px] font-mono font-bold leading-none text-center">{node.name}</span>
              {node.status === "down" && (
                <motion.div
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full"
                />
              )}
              {node.status === "degraded" && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-neon-amber rounded-full animate-pulse" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Node detail panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-2 glass rounded-lg p-3 border border-border/50"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = typeIcons[selectedNode.type] || Server;
                  return <Icon className={`w-4 h-4 ${statusColors[selectedNode.status].split(" ")[2]}`} />;
                })()}
                <span className="text-xs font-mono font-bold text-foreground">{selectedNode.name}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${statusColors[selectedNode.status]}`}>
                  {selectedNode.status.toUpperCase()}
                </span>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="space-y-1">
                <p className="text-muted-foreground">CPU Usage</p>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${selectedNode.metrics.cpu > 80 ? "bg-destructive" : "bg-primary"}`}
                    style={{ width: `${selectedNode.metrics.cpu}%` }}
                  />
                </div>
                <p className={selectedNode.metrics.cpu > 80 ? "text-destructive" : "text-neon-green"}>
                  {selectedNode.metrics.cpu}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Memory</p>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${selectedNode.metrics.mem > 80 ? "bg-destructive" : "bg-primary"}`}
                    style={{ width: `${selectedNode.metrics.mem}%` }}
                  />
                </div>
                <p className={selectedNode.metrics.mem > 80 ? "text-destructive" : "text-neon-green"}>
                  {selectedNode.metrics.mem}%
                </p>
              </div>
            </div>
            {selectedNode.status === "down" && (
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-destructive font-mono">
                <AlertCircle className="w-3 h-3" />
                Service not responding. Investigate with terminal.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InfrastructureMap;

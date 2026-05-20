import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { roles, type Role } from "@/data/roles";
import { useGameStore } from "@/store/gameStore";
import { ChevronRight, Star, Info } from "lucide-react";

const difficultyColor: Record<string, string> = {
  Beginner: "text-terminal-green border-terminal-green/40 bg-terminal-green/10",
  Intermediate: "text-primary border-primary/40 bg-primary/10",
  Advanced: "text-neon-amber border-neon-amber/40 bg-neon-amber/10",
  Expert: "text-destructive border-destructive/40 bg-destructive/10",
};

const RoleCard = ({ role, index }: { role: Role; index: number }) => {
  const navigate = useNavigate();
  const setRole = useGameStore((s) => s.setRole);

  const handleSelect = () => {
    setRole(role);
    navigate("/game");
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleSelect}
      className={`glass rounded-xl p-5 text-left group transition-all duration-300 w-full relative ${
        role.isRecommended
          ? "ring-2 ring-terminal-green/60 hover:ring-terminal-green shadow-lg shadow-terminal-green/10"
          : "hover:glow-cyan-sm"
      }`}
    >
      {role.isRecommended && (
        <div className="absolute -top-2.5 left-4 flex items-center gap-1 bg-terminal-green text-background text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
          <Star className="w-2.5 h-2.5" />
          START HERE
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${role.isRecommended ? "bg-terminal-green/20" : "bg-muted"}`}>
          <role.icon className={`w-5 h-5 ${role.isRecommended ? "text-terminal-green" : "text-primary"}`} />
        </div>
        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${difficultyColor[role.difficulty]}`}>
          {role.difficulty}
        </span>
      </div>

      <h3 className={`font-mono font-bold text-base text-foreground mb-2 group-hover:text-primary transition-colors ${role.isRecommended ? "text-terminal-green group-hover:text-terminal-green" : ""}`}>
        {role.name}
      </h3>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
        {role.description}
      </p>

      {/* Sample scenarios */}
      <div className="space-y-1 mb-3">
        {role.scenarios.slice(0, 2).map((s, i) => (
          <div key={i} className="flex items-start gap-1.5 text-[10px] font-mono text-muted-foreground/70">
            <span className="text-primary mt-0.5">›</span>
            <span className="line-clamp-1">{s}</span>
          </div>
        ))}
      </div>

      <div className={`flex items-center text-sm font-mono mt-auto opacity-0 group-hover:opacity-100 transition-opacity ${role.isRecommended ? "text-terminal-green" : "text-primary"}`}>
        Play Now <ChevronRight className="w-4 h-4 ml-1" />
      </div>
    </motion.button>
  );
};

const RolesPage = () => {
  return (
    <div className="min-h-screen bg-background cyber-grid">
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-mono font-bold mb-3">
            <span className="gradient-text">Choose Your Role</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Each role has 7+ progressively harder scenarios. Difficulty increases round by round — start simple, become an expert.
          </p>
        </motion.div>

        {/* Tip banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 bg-terminal-green/10 border border-terminal-green/30 rounded-lg px-4 py-2.5 max-w-2xl mx-auto mb-8 text-sm text-terminal-green font-mono"
        >
          <Info className="w-4 h-4 shrink-0" />
          <span><strong>New?</strong> Start with "IT Support" — no technical knowledge required. You just need logical thinking!</span>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
          {roles.map((role, i) => (
            <RoleCard key={role.id} role={role} index={i} />
          ))}
        </div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 max-w-3xl mx-auto"
        >
          <h2 className="text-center font-mono text-sm text-muted-foreground mb-4">HOW IT WORKS</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { step: "1", label: "Pick a Role", desc: "Choose based on your interest level" },
              { step: "2", label: "Get a Scenario", desc: "AI generates a real-world crisis" },
              { step: "3", label: "Investigate", desc: "Use terminal, logs & dashboard" },
              { step: "4", label: "Solve & Earn XP", desc: "Answer in plain text, AI evaluates" },
            ].map((item) => (
              <div key={item.step} className="glass rounded-lg p-3 text-center">
                <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center font-mono font-bold text-sm text-primary-foreground mx-auto mb-2">
                  {item.step}
                </div>
                <p className="font-mono text-xs text-foreground font-bold mb-1">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RolesPage;

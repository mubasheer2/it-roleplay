import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Terminal, ChevronRight, Zap, Users, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden cyber-grid">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent/5 blur-[100px] animate-pulse-slow" />

      {/* Scan line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
        <div className="w-full h-1 bg-primary animate-scan-line" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8"
          >
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-mono text-primary">v1.0 — AI-Powered IT Simulator</span>
          </motion.div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-mono font-extrabold leading-tight mb-6">
            <span className="gradient-text">IT Play</span>
            <br />
            <span className="text-foreground">Roles</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Step into real IT crisis scenarios. Solve production incidents as a
            <span className="text-primary"> Software Engineer</span>,
            <span className="text-neon-amber"> DevOps Engineer</span>, or
            <span className="text-accent"> Security Analyst</span>.
            AI evaluates your every move.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => navigate("/roles")}
              size="lg"
              className="gradient-primary text-primary-foreground font-mono text-lg px-8 py-6 glow-cyan hover:opacity-90 transition-opacity"
            >
              <Terminal className="w-5 h-5 mr-2" />
              Start Playing
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="font-mono text-lg px-8 py-6 border-border text-foreground hover:bg-muted"
              onClick={() => navigate("/roles")}
            >
              View Roles
            </Button>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-3 gap-8 mt-16 max-w-lg mx-auto"
          >
            {[
              { icon: Users, label: "8 Roles", sub: "IT Careers" },
              { icon: Brain, label: "∞", sub: "AI Scenarios" },
              { icon: Zap, label: "Real-time", sub: "Feedback" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="font-mono text-xl font-bold text-foreground">{stat.label}</div>
                <div className="text-xs text-muted-foreground">{stat.sub}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

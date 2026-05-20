import { Code, Database, Shield, Cloud, Brain, BarChart3, Server, Terminal, Laptop } from "lucide-react";
import { type LucideIcon } from "lucide-react";

export interface Role {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  color: string;
  scenarios: string[];
  isRecommended?: boolean;
}

export const roles: Role[] = [
  {
    id: "it-support",
    name: "IT Support (Start Here)",
    description: "Perfect for beginners! Handle everyday tech problems: slow systems, broken apps, network issues. No deep technical knowledge needed — just logical thinking.",
    icon: Laptop,
    difficulty: "Beginner",
    color: "green",
    isRecommended: true,
    scenarios: [
      "Office WiFi is not working for everyone",
      "Email app keeps crashing for a user",
      "Printer not responding to any computer",
    ],
  },
  {
    id: "software-engineer",
    name: "Software Engineer",
    description: "Build, debug, and deploy production applications. Handle code reviews, system design, and incident response.",
    icon: Code,
    difficulty: "Intermediate",
    color: "cyan",
    scenarios: [
      "Production deployment causing 500 errors on login",
      "Memory leak in Node.js microservice",
      "Race condition in payment processing",
    ],
  },
  {
    id: "data-scientist",
    name: "Data Scientist",
    description: "Analyze data pipelines, build ML models, and derive insights from complex datasets.",
    icon: BarChart3,
    difficulty: "Advanced",
    color: "green",
    scenarios: [
      "ML model accuracy dropped 30% after retraining",
      "Data pipeline producing duplicate records",
      "Feature drift detected in production model",
    ],
  },
  {
    id: "devops-engineer",
    name: "DevOps Engineer",
    description: "Manage CI/CD pipelines, infrastructure, and ensure system reliability at scale.",
    icon: Server,
    difficulty: "Advanced",
    color: "amber",
    scenarios: [
      "Kubernetes pods crashing in production",
      "CI/CD pipeline failing intermittently",
      "Auto-scaling not responding to traffic spikes",
    ],
  },
  {
    id: "cybersecurity-analyst",
    name: "Cyber Security Analyst",
    description: "Detect threats, respond to incidents, and secure systems against vulnerabilities.",
    icon: Shield,
    difficulty: "Expert",
    color: "purple",
    scenarios: [
      "SQL injection attack detected on production",
      "Unauthorized access to admin dashboard",
      "Ransomware detected on company servers",
    ],
  },
  {
    id: "cloud-engineer",
    name: "Cloud Engineer",
    description: "Design and manage cloud infrastructure across AWS, GCP, and Azure.",
    icon: Cloud,
    difficulty: "Advanced",
    color: "cyan",
    scenarios: [
      "AWS S3 bucket publicly exposed with sensitive data",
      "Cloud costs increased 300% overnight",
      "Multi-region failover not working",
    ],
  },
  {
    id: "ai-engineer",
    name: "AI Engineer",
    description: "Build and deploy AI/ML systems, fine-tune models, and create intelligent applications.",
    icon: Brain,
    difficulty: "Expert",
    color: "purple",
    scenarios: [
      "LLM hallucinating in customer-facing chatbot",
      "Training pipeline OOM errors on GPU cluster",
      "Model serving latency exceeding SLA",
    ],
  },
  {
    id: "product-manager",
    name: "Product Manager",
    description: "Drive product strategy, manage stakeholders, and prioritize technical roadmaps.",
    icon: Terminal,
    difficulty: "Intermediate",
    color: "green",
    scenarios: [
      "Critical feature deadline at risk due to tech debt",
      "Conflicting requirements from two major clients",
      "Product launch blocked by security review",
    ],
  },
  {
    id: "database-admin",
    name: "Database Administrator",
    description: "Manage databases, optimize queries, handle migrations, and ensure data integrity.",
    icon: Database,
    difficulty: "Advanced",
    color: "amber",
    scenarios: [
      "Database replication lag causing stale reads",
      "Table lock blocking all write operations",
      "Backup restoration failing during disaster recovery",
    ],
  },
];

export const difficultyMultiplier: Record<string, number> = {
  Beginner: 0.8,
  Intermediate: 1.5,
  Advanced: 2,
  Expert: 2.5,
};

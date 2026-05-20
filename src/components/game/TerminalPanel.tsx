import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Terminal, X, Maximize2 } from "lucide-react";

interface TerminalLine {
  type: "input" | "output" | "error" | "system";
  content: string;
  dir?: string;
}

interface TerminalPanelProps {
  terminalResponses: Record<string, string>;
  terminalFilesystem: Record<string, string>;
}

const WELCOME = `\x1b[32m╔══════════════════════════════════════════╗\x1b[0m
\x1b[32m║  IT Play Roles - Secure Terminal v2.4   ║\x1b[0m
\x1b[32m╚══════════════════════════════════════════╝\x1b[0m
\x1b[33mType 'help' for available commands\x1b[0m
`;

function parseAnsi(text: string): React.ReactNode[] {
  const parts = text.split(/(\x1b\[\d+m)/);
  let color = "";
  return parts.map((part, i) => {
    if (part.match(/\x1b\[(\d+)m/)) {
      const code = part.match(/\x1b\[(\d+)m/)?.[1];
      if (code === "0") color = "";
      else if (code === "31") color = "text-destructive";
      else if (code === "32") color = "text-neon-green";
      else if (code === "33") color = "text-neon-amber";
      else if (code === "36") color = "text-primary";
      return null;
    }
    if (!part) return null;
    return (
      <span key={i} className={color || undefined}>
        {part}
      </span>
    );
  });
}

const TerminalPanel = ({ terminalResponses, terminalFilesystem }: TerminalPanelProps) => {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: "system", content: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [currentDir, setCurrentDir] = useState("/");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const prompt = `\x1b[32mroot@prod-server-01\x1b[0m:\x1b[36m${currentDir}\x1b[0m# `;

  const processCommand = useCallback(
    (cmd: string) => {
      const trimmed = cmd.trim();
      if (!trimmed) return;

      const newLines: TerminalLine[] = [
        { type: "input", content: `${prompt}${trimmed}`, dir: currentDir },
      ];

      // Update history
      setHistory((prev) => [trimmed, ...prev.slice(0, 49)]);
      setHistoryIdx(-1);

      // Parse command
      const parts = trimmed.split(/\s+/);
      const baseCmd = parts[0];
      const fullCmd = trimmed;

      // clear
      if (baseCmd === "clear" || baseCmd === "cls") {
        setLines([{ type: "system", content: WELCOME }]);
        return;
      }

      // cd
      if (baseCmd === "cd") {
        const target = parts[1] || "/";
        let newDir = currentDir;
        if (target === "..") {
          newDir = currentDir.split("/").slice(0, -1).join("/") || "/";
        } else if (target.startsWith("/")) {
          newDir = target;
        } else {
          newDir = `${currentDir === "/" ? "" : currentDir}/${target}`;
        }
        const exists = terminalFilesystem[newDir] !== undefined;
        if (exists) {
          setCurrentDir(newDir);
          newLines.push({ type: "output", content: "" });
        } else {
          newLines.push({
            type: "error",
            content: `bash: cd: ${target}: No such file or directory`,
          });
        }
        setLines((prev) => [...prev, ...newLines]);
        return;
      }

      // ls
      if (baseCmd === "ls") {
        const dir = parts[1]
          ? parts[1].startsWith("/")
            ? parts[1]
            : `${currentDir === "/" ? "" : currentDir}/${parts[1]}`
          : currentDir;
        const contents = terminalFilesystem[dir];
        if (contents !== undefined) {
          newLines.push({
            type: "output",
            content: contents || "(empty directory)",
          });
        } else {
          newLines.push({
            type: "error",
            content: `ls: cannot access '${dir}': No such file or directory`,
          });
        }
        setLines((prev) => [...prev, ...newLines]);
        return;
      }

      // Look up response
      const response =
        terminalResponses[fullCmd] ||
        terminalResponses[baseCmd] ||
        null;

      if (response !== null) {
        newLines.push({ type: "output", content: response });
      } else if (baseCmd === "ssh") {
        newLines.push({
          type: "output",
          content: `ssh: connect to host ${parts[1] || "server"} port 22: Connection established\nWelcome to Ubuntu 22.04.3 LTS\nLast login: ${new Date().toUTCString()}\nroot@${parts[1] || "server"}:~#`,
        });
      } else if (baseCmd === "ping") {
        const host = parts[1] || "localhost";
        newLines.push({
          type: "output",
          content: `PING ${host}: 56 data bytes\n64 bytes from ${host}: icmp_seq=0 ttl=64 time=1.234 ms\n64 bytes from ${host}: icmp_seq=1 ttl=64 time=0.987 ms\n64 bytes from ${host}: icmp_seq=2 ttl=64 time=1.102 ms`,
        });
      } else if (baseCmd === "echo") {
        newLines.push({ type: "output", content: parts.slice(1).join(" ") });
      } else if (baseCmd === "curl") {
        newLines.push({
          type: "output",
          content: `{"status":"error","code":503,"message":"Service Unavailable","timestamp":"${new Date().toISOString()}"}`,
        });
      } else if (baseCmd === "grep") {
        const pattern = parts[1];
        const file = parts[2];
        const fileKey = file?.startsWith("/") ? `cat ${file}` : `cat ${currentDir}/${file}`;
        const fileContent = terminalResponses[fileKey] || "";
        const matching = fileContent
          .split("\n")
          .filter((l) => l.toLowerCase().includes((pattern || "").toLowerCase()))
          .join("\n");
        newLines.push({
          type: "output",
          content: matching || `grep: no matches for '${pattern}'`,
        });
      } else if (baseCmd === "tail") {
        const file = parts[parts.length - 1];
        const fileKey = `cat ${file?.startsWith("/") ? file : `${currentDir}/${file}`}`;
        const fileContent = terminalResponses[fileKey] || "";
        const lastLines = fileContent.split("\n").slice(-10).join("\n");
        newLines.push({ type: "output", content: lastLines || `tail: ${file}: No such file` });
      } else if (baseCmd === "kill") {
        const pid = parts[parts.length - 1];
        newLines.push({
          type: "output",
          content: `Process ${pid} terminated.\n[${pid}] Killed`,
        });
      } else if (baseCmd === "journalctl") {
        newLines.push({
          type: "output",
          content: `-- Logs begin at ${new Date(Date.now() - 86400000).toUTCString()} --\nFeb 18 10:22:31 server systemd[1]: Started session service.\nFeb 18 10:23:12 server kernel: oom-kill event: constraint=CONSTRAINT_NONE\nFeb 18 10:24:01 server sshd[23445]: Failed password for root from 45.33.32.156`,
        });
      } else {
        newLines.push({
          type: "error",
          content: `bash: ${baseCmd}: command not found`,
        });
      }

      setLines((prev) => [...prev, ...newLines]);
    },
    [currentDir, terminalResponses, terminalFilesystem, prompt]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      processCommand(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const newIdx = Math.min(historyIdx + 1, history.length - 1);
      setHistoryIdx(newIdx);
      setInput(history[newIdx] || "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const newIdx = Math.max(historyIdx - 1, -1);
      setHistoryIdx(newIdx);
      setInput(newIdx === -1 ? "" : history[newIdx] || "");
    } else if (e.key === "Tab") {
      e.preventDefault();
      // Basic autocomplete
      const cmds = Object.keys(terminalResponses);
      const match = cmds.find((c) => c.startsWith(input));
      if (match) setInput(match);
    } else if (e.key === "c" && e.ctrlKey) {
      setLines((prev) => [
        ...prev,
        { type: "input", content: `${prompt}${input}^C` },
      ]);
      setInput("");
    }
  };

  return (
    <div
      className="h-full flex flex-col bg-[hsl(220_20%_3%)] font-mono text-sm"
      onClick={() => inputRef.current?.focus()}
      ref={containerRef}
    >
      {/* Terminal content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-0.5 scrollbar-hide">
        {lines.map((line, i) => (
          <div key={i}>
            {line.type === "system" && (
              <div className="whitespace-pre-wrap mb-2">
                {parseAnsi(line.content)}
              </div>
            )}
            {line.type === "input" && (
              <div className="whitespace-pre-wrap text-neon-green">
                {parseAnsi(line.content)}
              </div>
            )}
            {line.type === "output" && line.content && (
              <div className="whitespace-pre-wrap text-foreground/90 pl-2">
                {parseAnsi(line.content)}
              </div>
            )}
            {line.type === "error" && (
              <div className="whitespace-pre-wrap text-destructive pl-2">
                {line.content}
              </div>
            )}
          </div>
        ))}

        {/* Active input line */}
        <div className="flex items-center gap-0">
          <span className="text-neon-green whitespace-nowrap">
            {parseAnsi(prompt)}
          </span>
          <div className="relative flex-1">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent outline-none text-foreground caret-primary"
              autoFocus
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
            />
          </div>
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.7, repeat: Infinity }}
            className="inline-block w-2 h-4 bg-primary ml-0.5"
          />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default TerminalPanel;

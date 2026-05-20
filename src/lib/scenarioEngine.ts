import type { ScenarioData } from "@/store/gameStore";
import type { SystemMetrics, ServiceStatus, LogEntry, AlertEntry, InfraNode } from "@/store/systemStore";

export interface ScenarioEnvironment {
  metrics: SystemMetrics;
  services: ServiceStatus[];
  logs: LogEntry[];
  alerts: Omit<AlertEntry, "id" | "dismissed">[];
  nodes: InfraNode[];
  timeLimit: number;
  terminalFilesystem: Record<string, string>;
  terminalResponses: Record<string, string>;
}

function ts(minsAgo: number) {
  const d = new Date(Date.now() - minsAgo * 60000);
  return d.toISOString().replace("T", " ").substring(0, 19);
}

function mkLog(
  level: LogEntry["level"],
  source: string,
  message: string,
  minsAgo = 0
): LogEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: ts(minsAgo),
    level,
    source,
    message,
  };
}

export function buildEnvironmentFromScenario(scenario: ScenarioData, roundNumber: number): ScenarioEnvironment {
  const title = scenario.title?.toLowerCase() ?? "";
  const desc = scenario.description?.toLowerCase() ?? "";
  const systems = scenario.systems_affected ?? [];
  const urgency = scenario.urgency ?? "High";

  // Determine scenario type
  const isSecurity = title.includes("security") || title.includes("breach") || title.includes("attack") ||
    desc.includes("unauthorized") || desc.includes("intrusion") || desc.includes("malware") ||
    systems.some(s => s.toLowerCase().includes("auth"));

  const isDatabase = title.includes("database") || title.includes("db") || desc.includes("database") ||
    systems.some(s => s.toLowerCase().includes("database") || s.toLowerCase().includes("postgres") || s.toLowerCase().includes("mysql"));

  const isDeployment = title.includes("deploy") || title.includes("500") || desc.includes("deploy") || desc.includes("500 error");

  const isKubernetes = title.includes("kubernetes") || title.includes("pod") || desc.includes("kubernetes") || desc.includes("k8s");

  const isMemory = title.includes("memory") || title.includes("oom") || desc.includes("memory") || desc.includes("oom");

  const isNetwork = title.includes("network") || title.includes("traffic") || desc.includes("network") ||
    systems.some(s => s.toLowerCase().includes("network") || s.toLowerCase().includes("gateway"));

  // Base metrics adjusted for urgency
  const urgencyFactor = urgency === "Critical" ? 1.0 : urgency === "High" ? 0.75 : urgency === "Medium" ? 0.5 : 0.25;
  const baseCpu = isSecurity ? 45 + urgencyFactor * 40 : isMemory ? 85 : isDatabase ? 60 : 30 + urgencyFactor * 35;
  const baseMemory = isMemory ? 94 : isKubernetes ? 88 : isDatabase ? 75 : 40 + urgencyFactor * 40;
  const baseDisk = isDatabase ? 89 : 40 + urgencyFactor * 20;
  const baseNetwork = isSecurity ? 95 : isNetwork ? 90 : isDeployment ? 60 : 30 + urgencyFactor * 30;

  const metrics: SystemMetrics = {
    cpu: Math.min(99, Math.round(baseCpu)),
    memory: Math.min(99, Math.round(baseMemory)),
    disk: Math.min(99, Math.round(baseDisk)),
    network: Math.min(99, Math.round(baseNetwork)),
    services: [],
  };

  // Services based on affected systems
  const services: ServiceStatus[] = systems.map((sys) => {
    const s = sys.toLowerCase();
    const isFailed = urgency === "Critical" || (urgency === "High" && Math.random() > 0.5);
    return {
      name: sys,
      status: isFailed ? "failed" : "warning",
      pid: Math.floor(Math.random() * 30000 + 1000),
      cpu: isFailed ? 0 : Math.floor(Math.random() * 80 + 10),
      mem: isFailed ? 0 : Math.floor(Math.random() * 60 + 20),
    };
  });

  // Add some healthy services
  const healthyServices: ServiceStatus[] = [
    { name: "sshd", status: "running", pid: 1022, cpu: 0.1, mem: 2 },
    { name: "cron", status: "running", pid: 1033, cpu: 0.0, mem: 1 },
  ];

  const allServices = [...services, ...healthyServices];

  // Build logs
  const logs: LogEntry[] = [];

  if (isSecurity) {
    logs.push(
      mkLog("ALERT", "auth.log", `SECURITY ALERT: Multiple failed SSH login attempts from 192.168.1.105`, 2),
      mkLog("ERROR", "auth.log", `Failed password for root from 45.33.32.156 port 22 ssh2`, 3),
      mkLog("ERROR", "auth.log", `Failed password for admin from 45.33.32.156 port 22 ssh2`, 3),
      mkLog("ALERT", "firewall", `Suspicious outbound connection to 185.220.101.5:4444 detected`, 4),
      mkLog("ERROR", "auth.log", `Invalid user admin from 45.33.32.156 port 22`, 4),
      mkLog("WARN", "syslog", `Privilege escalation attempt detected by user: webapp`, 5),
      mkLog("INFO", "auth.log", `Accepted password for deploy from 10.0.0.15 port 22 ssh2`, 10),
      mkLog("INFO", "nginx", `GET /admin/panel HTTP/1.1 200 - from 45.33.32.156`, 6),
      mkLog("ALERT", "ids", `SQL injection pattern detected in request from 45.33.32.156`, 7),
    );
  } else if (isDatabase) {
    logs.push(
      mkLog("ERROR", "postgresql", `FATAL: remaining connection slots are reserved for non-replication superuser connections`, 1),
      mkLog("ERROR", "postgresql", `FATAL: sorry, too many clients already`, 1),
      mkLog("ERROR", "app-server", `Database connection timeout after 30000ms`, 2),
      mkLog("WARN", "postgresql", `slow query: SELECT * FROM orders WHERE user_id=$1 - 12432ms`, 2),
      mkLog("ERROR", "postgresql", `deadlock detected on table orders, rolling back transaction`, 3),
      mkLog("WARN", "postgresql", `checkpoint request exceeded 300 seconds`, 4),
      mkLog("ERROR", "app-server", `TypeError: Cannot read property 'rows' of null`, 5),
      mkLog("INFO", "postgresql", `database system is ready to accept connections`, 15),
    );
  } else if (isDeployment) {
    logs.push(
      mkLog("ERROR", "nginx", `connect() failed (111: Connection refused) while connecting to upstream`, 1),
      mkLog("ERROR", "app-server", `SyntaxError: Unexpected token in JSON at position 0`, 1),
      mkLog("ERROR", "app-server", `Error: ECONNREFUSED 127.0.0.1:5432`, 2),
      mkLog("ERROR", "nginx", `upstream timed out (110: Connection timed out) while reading response header`, 2),
      mkLog("WARN", "pm2", `App crashed. Restarting... (attempt 5/10)`, 3),
      mkLog("ERROR", "app-server", `UnhandledPromiseRejectionWarning: Error: connect ECONNREFUSED`, 3),
      mkLog("INFO", "deployment", `Deploy v2.4.1 started at ${ts(10)}`, 10),
      mkLog("INFO", "deployment", `Rolling update: 4/4 pods updated`, 9),
      mkLog("ERROR", "deployment", `Readiness probe failed for pod api-server-7d9b`, 8),
    );
  } else if (isMemory) {
    logs.push(
      mkLog("ALERT", "kernel", `Out of memory: Kill process 14322 (node) score 912 or sacrifice child`, 1),
      mkLog("ERROR", "node", `FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory`, 1),
      mkLog("WARN", "kernel", `Memory available: 124MB / 16384MB (99.2% used)`, 2),
      mkLog("ERROR", "node", `heap out of memory - heapUsed: 14991MB, heapTotal: 15011MB`, 2),
      mkLog("WARN", "cron", `gc overhead limit exceeded, forcing GC`, 3),
      mkLog("INFO", "app-server", `Loaded 2.4M records into memory cache`, 5),
      mkLog("DEBUG", "app-server", `Memory: rss=14.3GB heapTotal=14.8GB heapUsed=14.6GB`, 4),
    );
  } else if (isKubernetes) {
    logs.push(
      mkLog("ERROR", "kubelet", `Failed to pull image "registry.prod/api:v2.4.1": rpc error: code = Unknown`, 1),
      mkLog("WARN", "kube-scheduler", `0/3 nodes are available: 3 Insufficient memory`, 2),
      mkLog("ERROR", "kube-proxy", `Failed to sync endpoints: rpc error: code = Unavailable`, 2),
      mkLog("WARN", "kubelet", `Pod api-deployment-7d9b8f pod has unbound immediate PersistentVolumeClaims`, 3),
      mkLog("ERROR", "kubelet", `Back-off restarting failed container: CrashLoopBackOff`, 4),
      mkLog("ALERT", "kube-apiserver", `node "worker-02" NotReady for 5m30s`, 5),
    );
  } else {
    // Generic
    logs.push(
      mkLog("ERROR", "app-server", `${scenario.title} - Service unavailable`, 1),
      mkLog("WARN", "monitoring", `High resource utilization detected`, 2),
      mkLog("ERROR", "app-server", `Connection pool exhausted`, 3),
      mkLog("WARN", "nginx", `Upstream response slow: 8432ms`, 4),
      mkLog("INFO", "healthcheck", `Health endpoint returning 503`, 5),
    );
  }

  // Add generic info logs
  logs.push(
    mkLog("INFO", "syslog", `System boot successful`, 60),
    mkLog("INFO", "cron", `Scheduled backup job started`, 30),
    mkLog("INFO", "monitoring", `Metrics collection active`, 20),
  );

  // Alerts
  const alerts: Omit<AlertEntry, "id" | "dismissed">[] = [];

  if (urgency === "Critical") {
    alerts.push({
      level: "critical",
      title: `🚨 CRITICAL: ${scenario.title}`,
      message: scenario.description,
      timestamp: Date.now(),
    });
  }

  if (metrics.cpu > 80) {
    alerts.push({
      level: "critical",
      title: "CPU OVERLOAD",
      message: `CPU usage at ${metrics.cpu}% - System performance severely degraded`,
      timestamp: Date.now() - 60000,
    });
  }

  if (metrics.memory > 85) {
    alerts.push({
      level: "critical",
      title: "MEMORY CRITICAL",
      message: `Memory at ${metrics.memory}% - OOM killer may terminate processes`,
      timestamp: Date.now() - 120000,
    });
  }

  if (isSecurity) {
    alerts.push({
      level: "critical",
      title: "🔴 SECURITY BREACH DETECTED",
      message: "Unauthorized access attempts from external IP 45.33.32.156",
      timestamp: Date.now() - 180000,
    });
  }

  if (isDatabase) {
    alerts.push({
      level: "warning",
      title: "DATABASE CONNECTION POOL",
      message: "Connection pool exhausted. New connections being rejected.",
      timestamp: Date.now() - 90000,
    });
  }

  // Infrastructure nodes
  const nodes: InfraNode[] = [
    {
      id: "lb",
      name: "Load Balancer",
      type: "loadbalancer",
      status: isNetwork || urgency === "Critical" ? "degraded" : "healthy",
      connections: ["api"],
      metrics: { cpu: 25, mem: 30, requests: isNetwork ? 9800 : 450 },
    },
    {
      id: "api",
      name: "API Server",
      type: "api",
      status: isDeployment || urgency === "Critical" ? "down" : isMemory ? "degraded" : "healthy",
      connections: ["db", "cache", "auth"],
      metrics: { cpu: Math.round(metrics.cpu * 0.8), mem: Math.round(metrics.memory * 0.9) },
    },
    {
      id: "db",
      name: "Database",
      type: "database",
      status: isDatabase || urgency === "Critical" ? "down" : "healthy",
      connections: [],
      metrics: { cpu: Math.round(metrics.cpu * 0.5), mem: Math.round(metrics.memory * 0.7) },
    },
    {
      id: "cache",
      name: "Cache (Redis)",
      type: "cache",
      status: isDeployment ? "degraded" : "healthy",
      connections: [],
      metrics: { cpu: 5, mem: 60 },
    },
    {
      id: "auth",
      name: "Auth Service",
      type: "auth",
      status: isSecurity ? "down" : isDeployment ? "degraded" : "healthy",
      connections: ["db"],
      metrics: { cpu: isSecurity ? 90 : 10, mem: isSecurity ? 80 : 20 },
    },
  ];

  // Terminal filesystem and responses
  const terminalResponses: Record<string, string> = buildTerminalResponses(
    scenario, isSecurity, isDatabase, isDeployment, isMemory, isKubernetes, metrics
  );

  const terminalFilesystem: Record<string, string> = {
    "/": "bin  boot  dev  etc  home  lib  opt  proc  root  srv  sys  tmp  usr  var",
    "/var": "backups  cache  lib  log  mail  run  spool  tmp",
    "/var/log": "auth.log  syslog  nginx  postgresql  app.log  kern.log  fail2ban.log",
    "/etc": "nginx  postgresql  hosts  hostname  fstab  crontab  passwd",
    "/etc/nginx": "nginx.conf  sites-available  sites-enabled  conf.d",
    "/opt": "app  scripts  backups",
    "/proc": "cpuinfo  meminfo  loadavg  uptime  net  sys",
  };

  // Time limit: 7-8 minutes base, decreases slightly with rounds but never below 5 min
  const baseTime = urgency === "Critical" ? 420 : urgency === "High" ? 450 : 480;
  const timeLimit = Math.max(300, baseTime - roundNumber * 10);

  return {
    metrics,
    services: allServices,
    logs,
    alerts,
    nodes,
    timeLimit,
    terminalFilesystem,
    terminalResponses,
  };
}

function buildTerminalResponses(
  scenario: ScenarioData,
  isSecurity: boolean,
  isDatabase: boolean,
  isDeployment: boolean,
  isMemory: boolean,
  isKubernetes: boolean,
  metrics: SystemMetrics
): Record<string, string> {
  const hostname = "prod-server-01";

  const base: Record<string, string> = {
    help: `Available commands:\n  ssh <host>      Connect to remote host\n  ls              List files\n  cd <dir>        Change directory\n  cat <file>      View file contents\n  ps aux          List processes\n  top             System resource usage\n  netstat -tulnp  Network connections\n  docker ps       List containers\n  systemctl status <service>\n  systemctl restart <service>\n  systemctl stop <service>\n  tail -f <file>  Follow log\n  grep <pattern> <file>\n  kill -9 <pid>   Kill process\n  df -h           Disk usage\n  free -m         Memory usage\n  uptime          System uptime\n  whoami          Current user\n  hostname        Show hostname\n  ifconfig        Network interfaces\n  curl <url>      HTTP request\n  ping <host>     Ping host`,
    whoami: "root",
    hostname: hostname,
    uptime: `up 2 days, 4:22,  3 users,  load average: ${(metrics.cpu / 25).toFixed(2)}, ${(metrics.cpu / 20).toFixed(2)}, ${(metrics.cpu / 15).toFixed(2)}`,
    "df -h": `Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        50G   ${Math.round(metrics.disk / 2)}G   ${Math.round(50 - metrics.disk / 2)}G  ${metrics.disk}% /\ntmpfs           7.8G  ${isMemory ? "7.6G" : "1.2G"}  ${isMemory ? "0.2G" : "6.6G"}  ${isMemory ? "97%" : "16%"} /dev/shm`,
    "free -m": `              total        used        free      shared  buff/cache   available\nMem:          16384       ${Math.round(16384 * metrics.memory / 100)}       ${Math.round(16384 * (100 - metrics.memory) / 100)}         ${isMemory ? "8192" : "234"}        1024        ${Math.round(16384 * (100 - metrics.memory) / 100 + 500)}\nSwap:          4096       ${isMemory ? "4088" : "128"}       ${isMemory ? "8" : "3968"}`,
    ifconfig: `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n        inet 10.0.0.10  netmask 255.255.255.0  broadcast 10.0.0.255\n        TX packets 8234521  bytes 12847234810\n        RX packets 7845221  bytes 9874223410`,
    "ps aux": buildPsAux(isMemory, isSecurity, isDatabase),
    top: `top - ${new Date().toTimeString().split(" ")[0]} up 2 days,  load avg: ${(metrics.cpu / 25).toFixed(2)}\nTasks: 312 total, 1 running, 311 sleeping\n%Cpu(s): ${metrics.cpu}.0 us,  2.0 sy,  0.0 ni, ${100 - metrics.cpu - 5}.0 id\nMiB Mem: 16384.0 total, ${Math.round(16384 * (100 - metrics.memory) / 100)}.0 free, ${Math.round(16384 * metrics.memory / 100)}.0 used\n\nPID     USER  PR  NI VIRT   RES   SHR  S %CPU %MEM  COMMAND\n${isMemory ? "14322   node  20   0  14.8G  14.6G  12M  R 98.3 89.2  node\n" : ""}${isDatabase ? "23411   postgres 20 0  8.2G  7.8G  98M  D 87.3 47.6  postgres\n" : ""}1       root  20   0  2848   1844  1068  S  0.0  0.0  systemd`,
    "netstat -tulnp": buildNetstat(isSecurity, isDatabase),
    "docker ps": buildDockerPs(isDeployment, isDatabase),
  };

  // File contents
  base["cat /var/log/auth.log"] = isSecurity
    ? `${ts(5)} server sshd[23445]: Failed password for root from 45.33.32.156 port 22 ssh2\n${ts(4)} server sshd[23447]: Failed password for admin from 45.33.32.156 port 22 ssh2\n${ts(4)} server sshd[23448]: Invalid user admin from 45.33.32.156 port 22\n${ts(3)} server sshd[23451]: Failed password for root from 45.33.32.156 port 22 ssh2\n${ts(2)} server sshd[23455]: POSSIBLE BREAK-IN ATTEMPT from 45.33.32.156\n${ts(2)} server sudo: webapp : TTY=unknown ; PWD=/ ; USER=root ; COMMAND=/bin/bash\n${ts(1)} server su[23461]: Successful su for root by webapp`
    : `${ts(30)} server sshd[1022]: Accepted publickey for deploy from 10.0.0.15 port 22\n${ts(20)} server sshd[1033]: session opened for user deploy\n${ts(10)} server sudo: deploy : TTY=pts/0 ; USER=root ; COMMAND=/usr/bin/systemctl restart nginx`;

  base["cat /var/log/syslog"] = `${ts(5)} ${hostname} kernel: [${(Math.random() * 999999).toFixed(3)}] ${isSecurity ? "Possible SYN flooding on port 22. Sending cookies." : isMemory ? "Out of memory: Kill process 14322 (node) score 912" : "systemd[1]: Started Session 42 of user deploy."}\n${ts(3)} ${hostname} kernel: [${(Math.random() * 999999).toFixed(3)}] ${isMemory ? "oom-kill: constraint=CONSTRAINT_NONE,nodemask=(null),cpuset=/" : isDatabase ? "nf_conntrack: table full, dropping packet" : "EXT4-fs (sda1): re-mounted. Opts: errors=remount-ro"}\n${ts(1)} ${hostname} systemd[1]: ${isDeployment ? "api.service: Main process exited, code=exited, status=1/FAILURE" : "Started Daily apt upgrade and clean activities."}`;

  base["cat /var/log/nginx/error.log"] = isDeployment
    ? `${ts(2)} [error] 12345#0: *1 connect() failed (111: Connection refused) while connecting to upstream, upstream: "http://127.0.0.1:3000"\n${ts(1)} [error] 12345#0: *2 upstream timed out (110: Connection timed out) while reading response header\n${ts(1)} [crit] 12345#0: *3 connect() to 127.0.0.1:3000 failed (111: Connection refused)`
    : `${ts(10)} [warn] 12345#0: *100 upstream response time 4.329s\n${ts(5)} [error] 12345#0: open() "/var/www/html/favicon.ico" failed (2: No such file or directory)`;

  if (isDatabase) {
    base["cat /var/log/postgresql/postgresql.log"] = `${ts(2)} [4523] FATAL: remaining connection slots are reserved for non-replication superuser\n${ts(2)} [4524] FATAL: sorry, too many clients already\n${ts(1)} [4525] LOG: duration: 12432.234 ms  statement: SELECT * FROM orders WHERE...\n${ts(1)} [4526] ERROR: deadlock detected\n${ts(1)} [4526] DETAIL: Process 4523 waits for ShareLock on transaction 985432\n${ts(0)} [4527] LOG: connection received: host=10.0.0.10 port=44921`;
  }

  base["cat /proc/cpuinfo"] = `processor\t: 0\nvendor_id\t: GenuineIntel\nmodel name\t: Intel(R) Xeon(R) CPU E5-2680 v4\ncpu MHz\t\t: 2399.972\ncache size\t: 35840 KB\ncpu cores\t: 14`;

  // Systemctl responses
  for (const svc of ["nginx", "postgresql", "mysql", "redis", "api", "docker", "ssh"]) {
    const isAffected = isDatabase && (svc === "postgresql" || svc === "mysql") ||
      isDeployment && svc === "api" || isSecurity && svc === "ssh";
    base[`systemctl status ${svc}`] = `● ${svc}.service - ${svc} service\n   Loaded: loaded (/lib/systemd/system/${svc}.service; enabled)\n   Active: ${isAffected ? "\x1b[31mfailed (Result: exit-code)\x1b[0m" : "active (running)"} since ${ts(isAffected ? 2 : 30)}\n  Process: ${Math.floor(Math.random() * 30000)} ExecStart=${svc === "nginx" ? "/usr/sbin/nginx -g daemon on" : `/usr/bin/${svc}`}\n Main PID: ${Math.floor(Math.random() * 30000)} (${svc})\n   CGroup: /system.slice/${svc}.service\n           └─${Math.floor(Math.random() * 30000)} ${svc}`;

    base[`systemctl restart ${svc}`] = isAffected
      ? `Restarting ${svc}...\nJob for ${svc}.service failed. See 'journalctl -xe' for details.\nError: ${isDatabase ? "could not connect to database" : "port already in use"}`
      : `${svc} service restarted successfully.\n[  OK  ] Started ${svc} service.`;

    base[`systemctl stop ${svc}`] = `[  OK  ] Stopped ${svc} service.`;
  }

  base["systemctl restart nginx"] = isDeployment
    ? `Restarting nginx...\n[  OK  ] Reloaded nginx.\nWarning: upstream 127.0.0.1:3000 still unavailable`
    : `[  OK  ] Restarted nginx.`;

  if (isSecurity) {
    base["iptables -L"] = `Chain INPUT (policy ACCEPT)\ntarget  prot opt source               destination\nACCEPT  tcp  --  anywhere             anywhere             tcp dpt:22\nACCEPT  tcp  --  anywhere             anywhere             tcp dpt:80\nACCEPT  tcp  --  anywhere             anywhere             tcp dpt:443`;
    base["iptables -A INPUT -s 45.33.32.156 -j DROP"] = `[  OK  ] Firewall rule added. IP 45.33.32.156 blocked.\nRule will be applied immediately to all incoming traffic.`;
    base["last"] = `root     pts/1        45.33.32.156     ${ts(2)} still logged in\ndeploy   pts/0        10.0.0.15        ${ts(10)}   still logged in\nreboot   system boot  ${ts(2880)}`;
    base["who"] = `root     pts/1        ${ts(2).split(" ")[0]} ${ts(2).split(" ")[1]} (45.33.32.156)\ndeploy   pts/0        ${ts(10).split(" ")[0]} ${ts(10).split(" ")[1]} (10.0.0.15)`;
    base["w"] = `USER     TTY      FROM             LOGIN@   IDLE JCPU PCPU WHAT\nroot     pts/1    45.33.32.156     ${ts(2)}  0.00s  0.01s  0.00s bash\ndeploy   pts/0    10.0.0.15        ${ts(10)} 2:15   0.03s  0.01s top`;
    base["pkill -u root"] = `Sessions for root terminated.\nWarning: This will disconnect active root sessions.`;
    base["userdel webapp"] = `User webapp deleted successfully.\nGroup webapp removed.`;
  }

  if (isDatabase) {
    base["psql -c 'SELECT count(*) FROM pg_stat_activity;'"] = ` count \n-------\n   ${Math.floor(metrics.cpu * 2)}\n(1 row)\nWarning: max_connections=100, currently using ${Math.floor(metrics.cpu * 2)}`;
    base["psql -c 'SELECT pid, query, state FROM pg_stat_activity LIMIT 10;'"] = `  pid  |              query               |  state\n-------+----------------------------------+---------\n ${Math.floor(Math.random()*10000)} | SELECT * FROM orders WHERE...    | active\n ${Math.floor(Math.random()*10000)} | UPDATE users SET last_login=...  | idle in transaction\n ${Math.floor(Math.random()*10000)} | INSERT INTO audit_logs VALUES... | active`;
    base["psql -c 'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state=\\'idle in transaction\\';'"] = `pg_terminate_backend \n---------------------\n t\n t\n t\n(3 rows)\nConnection pool freed. Idle transactions terminated.`;
  }

  return base;
}

function buildPsAux(isMemory: boolean, isSecurity: boolean, isDatabase: boolean): string {
  let output = `USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\n`;
  if (isMemory) output += `node     14322 98.3 89.2 15597080 14685184 ? Rl   09:23  45:22 node /opt/app/server.js\n`;
  if (isSecurity) output += `root     23461  0.0  0.1  21416  5232 pts/1   S    10:45   0:00 bash\nroot     23462  0.1  0.0   5908  1456 pts/1   S+   10:45   0:00 /bin/sh /tmp/.hidden_script\n`;
  if (isDatabase) output += `postgres 23411 87.3 47.6 8589934 7864320 ? D    08:00  12:33 postgres: writer process\npostgres 23412 45.2 23.1 4294967 3774873 ? D    08:00  08:12 postgres: wal writer process\n`;
  output += `root         1  0.0  0.0   2848  1844 ?        Ss   2days   0:05 /sbin/init\nnginx    12345  0.5  1.2  45032 24576 ?         Ss   2days   0:48 nginx: master\ndeploy    1022  0.0  0.2  21416  5120 pts/0    S    09:00   0:00 bash`;
  return output;
}

function buildNetstat(isSecurity: boolean, isDatabase: boolean): string {
  let output = `Active Internet connections (only servers)\nProto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program\n`;
  output += `tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      1022/sshd\n`;
  output += `tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      12345/nginx\n`;
  output += `tcp        0      0 0.0.0.0:443             0.0.0.0:*               LISTEN      12345/nginx\n`;
  if (isDatabase) output += `tcp        0      0 0.0.0.0:5432            0.0.0.0:*               LISTEN      23411/postgres\n`;
  if (isSecurity) output += `tcp        0      0 10.0.0.10:4444          45.33.32.156:52341      ESTABLISHED 23461/bash  ← SUSPICIOUS\n`;
  output += `tcp6       0      0 :::3000                 :::*                    LISTEN      14322/node\n`;
  output += `udp        0      0 0.0.0.0:53              0.0.0.0:*                           1234/named`;
  return output;
}

function buildDockerPs(isDeployment: boolean, isDatabase: boolean): string {
  let output = `CONTAINER ID   IMAGE                COMMAND               STATUS                    PORTS\n`;
  if (isDeployment) {
    output += `7d9b8f3a1c2e   api-server:v2.4.1    "node server.js"      Restarting (1) 2 min ago  0.0.0.0:3000->3000/tcp\n`;
  } else {
    output += `7d9b8f3a1c2e   api-server:v2.4.1    "node server.js"      Up 2 days                 0.0.0.0:3000->3000/tcp\n`;
  }
  output += `a8c4e2f9b3d1   nginx:alpine         "/docker-entrypoint"  Up 2 days                 0.0.0.0:80->80/tcp\n`;
  if (isDatabase) {
    output += `9f2b1e8d5c7a   postgres:14          "docker-entrypoint"   Up 2 days (unhealthy)     0.0.0.0:5432->5432/tcp\n`;
  } else {
    output += `9f2b1e8d5c7a   postgres:14          "docker-entrypoint"   Up 2 days                 0.0.0.0:5432->5432/tcp\n`;
  }
  output += `3c8d1f4a9e2b   redis:7-alpine       "docker-entrypoint"   Up 2 days                 0.0.0.0:6379->6379/tcp`;
  return output;
}

import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

const db = new Database("bera.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password_hash TEXT,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS apps (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE,
    region TEXT,
    status TEXT DEFAULT 'idle',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS config_vars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_id TEXT,
    key TEXT,
    value TEXT,
    FOREIGN KEY(app_id) REFERENCES apps(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS releases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_id TEXT,
    version INTEGER,
    description TEXT,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(app_id) REFERENCES apps(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS addons (
    id TEXT PRIMARY KEY,
    app_id TEXT,
    name TEXT,
    plan TEXT,
    status TEXT,
    FOREIGN KEY(app_id) REFERENCES apps(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_id TEXT,
    source TEXT,
    content TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(app_id) REFERENCES apps(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_id TEXT,
    actor TEXT,
    action TEXT,
    description TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(app_id) REFERENCES apps(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS addons_catalog (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    category TEXT,
    icon TEXT
  );
`);

// Seed catalog
const catalogCount = db.prepare("SELECT COUNT(*) as count FROM addons_catalog").get() as any;
if (catalogCount.count === 0) {
  db.prepare("INSERT INTO addons_catalog (id, name, description, category, icon) VALUES (?, ?, ?, ?, ?)").run("bera-postgresql", "Bera Postgres", "Reliable SQL database", "Data Store", "database");
  db.prepare("INSERT INTO addons_catalog (id, name, description, category, icon) VALUES (?, ?, ?, ?, ?)").run("bera-redis", "Bera Redis", "In-memory data structure store", "Caching", "zap");
  db.prepare("INSERT INTO addons_catalog (id, name, description, category, icon) VALUES (?, ?, ?, ?, ?)").run("log-drain", "Log Drain", "External logging integration", "Logging", "terminal");
}

// Seed initial data if empty
const appCount = db.prepare("SELECT COUNT(*) as count FROM apps").get() as any;
if (appCount.count === 0) {
  const id = "demo-app";
  db.prepare("INSERT INTO apps (id, name, region, status) VALUES (?, ?, ?, ?)").run(id, "bera-demo-app", "us", "running");
  db.prepare("INSERT INTO config_vars (app_id, key, value) VALUES (?, ?, ?)").run(id, "DATABASE_URL", "postgres://user:pass@host:5432/db");
  db.prepare("INSERT INTO releases (app_id, version, description, status) VALUES (?, ?, ?, ?)").run(id, 1, "Initial deploy", "succeeded");
  db.prepare("INSERT INTO logs (app_id, source, content) VALUES (?, ?, ?)").run(id, "app", "Server started on port 3000");
  db.prepare("INSERT INTO logs (app_id, source, content) VALUES (?, ?, ?)").run(id, "app", "Connected to database");
  db.prepare("INSERT INTO activity (app_id, actor, action, description) VALUES (?, ?, ?, ?)").run(id, "kingvon.kenya@gmail.com", "deploy", "Deployed v1");
}

// Seed admin user if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE email = 'admin@berahost.com'").get();
if (!adminExists) {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(ADMIN_PASSWORD, salt);
  db.prepare("INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)").run("admin-id", "admin@berahost.com", hash, "admin");
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  app.use(express.json());

  // Auth Middleware
  const authenticateAdmin = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded.role !== "admin") return res.status(403).json({ error: "Forbidden" });
      req.user = decoded;
      next();
    } catch (e) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // Admin Auth Route
  app.post("/api/admin/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Not an admin" });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ token, user: { email: user.email, role: user.role } });
  });

  // WebSocket handling for real-time logs
  const clients = new Set<websocket>();
  wss.on("connection", (ws) => {
    clients.add(ws);
    ws.on("close", () => clients.delete(ws));
  });

  const broadcastLog = (appId: string, source: string, content: string) => {
    const logEntry = { appId, source, content, timestamp: new Date().toISOString() };
    const message = JSON.stringify({ type: "log", data: logEntry });
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
    // Persist log
    db.prepare("INSERT INTO logs (app_id, source, content) VALUES (?, ?, ?)").run(appId, source, content);
  };

  const createRelease = (appId: string, description: string) => {
    const lastRelease = db.prepare("SELECT MAX(version) as v FROM releases WHERE app_id = ?").get(appId) as any;
    const nextVersion = (lastRelease?.v || 0) + 1;
    db.prepare("INSERT INTO releases (app_id, version, description, status) VALUES (?, ?, ?, ?)")
      .run(appId, nextVersion, description, 'succeeded');
    
    db.prepare("INSERT INTO activity (app_id, actor, action, description) VALUES (?, ?, ?, ?)")
      .run(appId, "system", "release", description);
    
    return nextVersion;
  };

  // API Routes
  app.get("/api/apps", (req, res) => {
    const apps = db.prepare("SELECT * FROM apps ORDER BY created_at DESC").all();
    res.json(apps);
  });

  app.post("/api/apps", (req, res) => {
    const { name, region } = req.body;
    const id = Math.random().toString(36).substring(2, 9);
    try {
      db.prepare("INSERT INTO apps (id, name, region) VALUES (?, ?, ?)").run(id, name, region);
      const newApp = db.prepare("SELECT * FROM apps WHERE id = ?").get(id);
      res.json(newApp);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/apps/:id", (req, res) => {
    const appData = db.prepare("SELECT * FROM apps WHERE id = ?").get(req.params.id);
    if (!appData) return res.status(404).json({ error: "App not found" });
    res.json(appData);
  });

  app.delete("/api/apps/:id", (req, res) => {
    db.prepare("DELETE FROM apps WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/apps/:id/config", (req, res) => {
    const vars = db.prepare("SELECT * FROM config_vars WHERE app_id = ?").all(req.params.id);
    res.json(vars);
  });

  app.post("/api/apps/:id/config", (req, res) => {
    const { key, value } = req.body;
    const appId = req.params.id;
    db.prepare("INSERT INTO config_vars (app_id, key, value) VALUES (?, ?, ?)").run(appId, key, value);
    createRelease(appId, `Set config var ${key}`);
    res.json({ success: true });
  });

  app.delete("/api/config/:id", (req, res) => {
    const configVar = db.prepare("SELECT * FROM config_vars WHERE id = ?").get(req.params.id) as any;
    if (configVar) {
      db.prepare("DELETE FROM config_vars WHERE id = ?").run(req.params.id);
      createRelease(configVar.app_id, `Remove config var ${configVar.key}`);
    }
    res.json({ success: true });
  });

  app.get("/api/apps/:id/logs", (req, res) => {
    const logs = db.prepare("SELECT * FROM logs WHERE app_id = ? ORDER BY timestamp DESC LIMIT 100").all(req.params.id);
    res.json(logs.reverse());
  });

  app.get("/api/addons/catalog", (req, res) => {
    const catalog = db.prepare("SELECT * FROM addons_catalog").all();
    res.json(catalog);
  });

  app.get("/api/apps/:id/addons", (req, res) => {
    const addons = db.prepare("SELECT * FROM addons WHERE app_id = ?").all(req.params.id);
    res.json(addons);
  });

  app.post("/api/apps/:id/addons", (req, res) => {
    const { addonId, plan } = req.body;
    const appId = req.params.id;
    const catalogItem = db.prepare("SELECT * FROM addons_catalog WHERE id = ?").get(addonId) as any;
    if (!catalogItem) return res.status(404).json({ error: "Addon not found" });

    const id = Math.random().toString(36).substring(2, 9);
    db.prepare("INSERT INTO addons (id, app_id, name, plan, status) VALUES (?, ?, ?, ?, ?)")
      .run(id, appId, catalogItem.name, plan || "Free", "provisioning");
    
    // Inject config var
    const configKey = catalogItem.name.toUpperCase().replace(/ /g, "_") + "_URL";
    db.prepare("INSERT INTO config_vars (app_id, key, value) VALUES (?, ?, ?)")
      .run(appId, configKey, `bera://${addonId}:${Math.random().toString(36).substring(2, 6)}@internal:5432`);

    db.prepare("INSERT INTO activity (app_id, actor, action, description) VALUES (?, ?, ?, ?)")
      .run(appId, "system", "addon:create", `Attached ${catalogItem.name}`);

    res.json({ success: true });
  });

  app.get("/api/apps/:id/activity", (req, res) => {
    const activity = db.prepare("SELECT * FROM activity WHERE app_id = ? ORDER BY timestamp DESC").all(req.params.id);
    res.json(activity);
  });

  app.post("/api/apps/:id/deploy", async (req, res) => {
    const { repoUrl, branch } = req.body;
    const appId = req.params.id;

    db.prepare("UPDATE apps SET status = 'deploying' WHERE id = ?").run(appId);
    res.json({ status: "started" });

    const steps = [
      "-----> Building source...",
      "-----> Cloning repository...",
      `-----> Detected environment: Node.js`,
      "-----> Installing dependencies...",
      "       Running: npm install",
      "       Added 452 packages in 4s",
      "-----> Building assets...",
      "       Running: npm run build",
      "       Build successful (1.2s)",
      "-----> Discovering process types",
      "       Procfile declares types: web",
      "-----> Compressing...",
      "       Done: 42.5MB",
      "-----> Launching...",
      "       Released v" + ((db.prepare("SELECT COUNT(*) as count FROM releases WHERE app_id = ?").get(appId) as any).count + 1),
      "-----> App is live at https://berahost.up.railway.app/" + appId
    ];

    for (const step of steps) {
      broadcastLog(appId, "build", step);
      await new Promise(r => setTimeout(r, 800));
    }

    db.prepare("UPDATE apps SET status = 'running', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(appId);
    
    createRelease(appId, `Deploy ${branch || 'main'}`);
  });

  app.get("/api/apps/:id/releases", (req, res) => {
    const releases = db.prepare("SELECT * FROM releases WHERE app_id = ? ORDER BY version DESC").all(req.params.id);
    res.json(releases);
  });

  app.get("/api/admin/stats", authenticateAdmin, (req, res) => {
    const totalApps = db.prepare("SELECT COUNT(*) as count FROM apps").get() as any;
    const totalReleases = db.prepare("SELECT COUNT(*) as count FROM releases").get() as any;
    const totalAddons = db.prepare("SELECT COUNT(*) as count FROM addons").get() as any;
    const runningApps = db.prepare("SELECT COUNT(*) as count FROM apps WHERE status = 'running'").get() as any;
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
    
    res.json({
      totalApps: totalApps.count,
      totalReleases: totalReleases.count,
      totalAddons: totalAddons.count,
      runningApps: runningApps.count,
      totalUsers: totalUsers.count
    });
  });

  app.get("/api/admin/activity", authenticateAdmin, (req, res) => {
    const activity = db.prepare(`
      SELECT a.*, apps.name as app_name 
      FROM activity a 
      JOIN apps ON a.app_id = apps.id 
      ORDER BY timestamp DESC 
      LIMIT 50
    `).all();
    res.json(activity);
  });

  app.post("/api/admin/catalog", authenticateAdmin, (req, res) => {
    const { id, name, description, category, icon } = req.body;
    try {
      db.prepare("INSERT INTO addons_catalog (id, name, description, category, icon) VALUES (?, ?, ?, ?, ?)")
        .run(id, name, description, category, icon);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/admin/catalog/:id", authenticateAdmin, (req, res) => {
    db.prepare("DELETE FROM addons_catalog WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // User Management
  app.get("/api/admin/users", authenticateAdmin, (req, res) => {
    const users = db.prepare("SELECT id, email, role, created_at FROM users").all();
    res.json(users);
  });

  app.delete("/api/admin/users/:id", authenticateAdmin, (req, res) => {
    if (req.params.id === (req as any).user.id) {
      return res.status(400).json({ error: "Cannot delete yourself" });
    }
    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // App Control
  app.post("/api/admin/apps/:id/stop", authenticateAdmin, (req, res) => {
    db.prepare("UPDATE apps SET status = 'idle' WHERE id = ?").run(req.params.id);
    db.prepare("INSERT INTO activity (app_id, actor, action, description) VALUES (?, ?, ?, ?)")
      .run(req.params.id, "admin", "app:stop", "Admin stopped the application");
    res.json({ success: true });
  });

  app.post("/api/admin/apps/:id/start", authenticateAdmin, (req, res) => {
    db.prepare("UPDATE apps SET status = 'running' WHERE id = ?").run(req.params.id);
    db.prepare("INSERT INTO activity (app_id, actor, action, description) VALUES (?, ?, ?, ?)")
      .run(req.params.id, "admin", "app:start", "Admin started the application");
    res.json({ success: true });
  });

  app.delete("/api/admin/apps/:id", authenticateAdmin, (req, res) => {
    db.prepare("DELETE FROM apps WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Bera Host Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

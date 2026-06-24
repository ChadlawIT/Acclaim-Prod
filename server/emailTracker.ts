import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, "../data/email-timestamps.json");

interface UserEmailTimestamps {
  welcomeSentAt?: string;
  inviteSentAt?: string;
}

type EmailTimestampsStore = Record<string, UserEmailTimestamps>;

function load(): EmailTimestampsStore {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    }
  } catch {
    // ignore parse errors — return empty store
  }
  return {};
}

function save(store: EmailTimestampsStore): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
  } catch (err) {
    console.error("[emailTracker] Failed to write email timestamps:", err);
  }
}

export function recordWelcomeEmail(userId: string): void {
  const store = load();
  store[userId] = { ...store[userId], welcomeSentAt: new Date().toISOString() };
  save(store);
}

export function recordInviteEmail(userId: string): void {
  const store = load();
  store[userId] = { ...store[userId], inviteSentAt: new Date().toISOString() };
  save(store);
}

export function getAllTimestamps(): EmailTimestampsStore {
  return load();
}

export function getTimestampsForUser(userId: string): UserEmailTimestamps {
  return load()[userId] || {};
}

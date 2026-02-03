import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { Redis } from "@upstash/redis";

type StoredUser = {
  id: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
};

const KV_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN =
  process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

const dataDir = path.join(process.cwd(), ".data");
const usersFile = path.join(dataDir, "users.json");

const USERS_KEY = "auth:users";
const USER_EMAIL_KEY_PREFIX = "auth:user:email:";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashPassword(password: string, salt?: string) {
  const resolvedSalt = salt ?? crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, resolvedSalt, 64).toString("hex");
  return { salt: resolvedSalt, hash };
}

function isPasswordValid(password: string, salt: string, hash: string) {
  const hashedBuffer = Buffer.from(
    crypto.scryptSync(password, salt, 64).toString("hex"),
    "hex",
  );
  const storedBuffer = Buffer.from(hash, "hex");
  if (hashedBuffer.length !== storedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(hashedBuffer, storedBuffer);
}

function getRedis() {
  if (!KV_URL || !KV_TOKEN) return null;
  return new Redis({ url: KV_URL, token: KV_TOKEN });
}

// --- File-based store (local dev) ---
async function readUsersFile(): Promise<StoredUser[]> {
  try {
    const raw = await fs.readFile(usersFile, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as StoredUser[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeUsersFile(users: StoredUser[]) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2));
}

// --- KV store (Vercel production) ---
async function findUserByEmailKV(email: string): Promise<StoredUser | null> {
  const redis = getRedis();
  if (!redis) return null;
  const key = `${USER_EMAIL_KEY_PREFIX}${normalizeEmail(email)}`;
  const user = await redis.get<StoredUser>(key);
  return user;
}

async function createUserKV(
  user: StoredUser,
): Promise<{ user: StoredUser; error: null } | { user: null; error: string }> {
  const redis = getRedis();
  if (!redis) return { user: null, error: "Storage not configured." };
  const key = `${USER_EMAIL_KEY_PREFIX}${user.email}`;
  const exists = await redis.get(key);
  if (exists) return { user: null, error: "Email already registered." };
  await redis.set(key, user);
  await redis.sadd(USERS_KEY, user.email);
  return { user, error: null };
}

// --- Unified API ---
export async function findUserByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const redis = getRedis();
  if (redis) {
    return findUserByEmailKV(normalizedEmail);
  }
  const users = await readUsersFile();
  return users.find((u) => u.email === normalizedEmail) ?? null;
}

export async function createUser(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const redis = getRedis();

  if (redis) {
    const existing = await findUserByEmailKV(normalizedEmail);
    if (existing) return { user: null, error: "Email already registered." };
    const { salt, hash } = hashPassword(password);
    const newUser: StoredUser = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      passwordHash: hash,
      passwordSalt: salt,
      createdAt: new Date().toISOString(),
    };
    return createUserKV(newUser);
  }

  const users = await readUsersFile();
  const existingUser = users.find((u) => u.email === normalizedEmail);
  if (existingUser) return { user: null, error: "Email already registered." };

  const { salt, hash } = hashPassword(password);
  const newUser: StoredUser = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  await writeUsersFile(users);
  return { user: newUser, error: null };
}

export async function verifyUserCredentials(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const isValid = isPasswordValid(
    password,
    user.passwordSalt,
    user.passwordHash,
  );
  return isValid ? user : null;
}

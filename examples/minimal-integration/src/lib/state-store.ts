import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type {
  AppState,
  CheckoutRecord,
  LocalAccessStatus,
  SuccessRecord,
  WebhookEventRecord,
} from "../types";

const currentDir = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(currentDir, "../../data");
const appStatePath = resolve(dataDir, "app-state.json");
const webhookEventsPath = resolve(dataDir, "webhook-events.json");
const maxWebhookEvents = 20;

function createInitialState(): AppState {
  const now = new Date().toISOString();

  return {
    localAccessStatus: "unknown",
    lastCheckout: null,
    lastSuccess: null,
    lastWebhook: null,
    lastUpdatedAt: now,
  };
}

async function ensureDataFiles(): Promise<void> {
  await mkdir(dataDir, { recursive: true });

  try {
    const content = await readFile(appStatePath, "utf8");
    JSON.parse(content);
  } catch {
    await writeFile(appStatePath, `${JSON.stringify(createInitialState(), null, 2)}\n`, "utf8");
  }

  try {
    const content = await readFile(webhookEventsPath, "utf8");
    JSON.parse(content);
  } catch {
    await writeFile(webhookEventsPath, "[]\n", "utf8");
  }
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  await ensureDataFiles();
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await ensureDataFiles();
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function readAppState(): Promise<AppState> {
  return readJsonFile<AppState>(appStatePath);
}

export async function readWebhookEvents(): Promise<WebhookEventRecord[]> {
  return readJsonFile<WebhookEventRecord[]>(webhookEventsPath);
}

async function writeAppState(nextState: AppState): Promise<void> {
  await writeJsonFile(appStatePath, nextState);
}

export async function recordCheckout(record: CheckoutRecord): Promise<void> {
  const state = await readAppState();
  await writeAppState({
    ...state,
    localAccessStatus: "checkout-created",
    lastCheckout: record,
    lastUpdatedAt: new Date().toISOString(),
  });
}

export async function recordSuccess(params: Record<string, string>): Promise<void> {
  const state = await readAppState();
  const successRecord: SuccessRecord = {
    seenAt: new Date().toISOString(),
    params,
  };

  await writeAppState({
    ...state,
    lastSuccess: successRecord,
    lastUpdatedAt: new Date().toISOString(),
  });
}

export async function recordWebhook(
  event: WebhookEventRecord,
  nextStatus: LocalAccessStatus,
): Promise<void> {
  const [state, existingEvents] = await Promise.all([readAppState(), readWebhookEvents()]);
  const nextEvents = [event, ...existingEvents].slice(0, maxWebhookEvents);

  await Promise.all([
    writeAppState({
      ...state,
      localAccessStatus: nextStatus,
      lastWebhook: event,
      lastUpdatedAt: new Date().toISOString(),
    }),
    writeJsonFile(webhookEventsPath, nextEvents),
  ]);
}

export async function getDebugSnapshot(): Promise<{
  state: AppState;
  recentWebhookEvents: WebhookEventRecord[];
}> {
  const [state, recentWebhookEvents] = await Promise.all([readAppState(), readWebhookEvents()]);
  return { state, recentWebhookEvents };
}


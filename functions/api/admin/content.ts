import { requireAdmin, type AccessEnvironment } from "../../_lib/access";

interface D1Result<T> { results?: T[]; meta?: { changes?: number } }
interface Statement {
  bind(...values: unknown[]): Statement;
  all<T>(): Promise<D1Result<T>>;
  run(): Promise<D1Result<unknown>>;
}
interface Database { prepare(query: string): Statement }
interface Env extends AccessEnvironment { SAL_CONTENT?: Database }
interface Row { id: string; title: string; data_json: string; published: number; sort_order: number; created_at: string; updated_at: string }

const fields: Record<string, string[]> = {
  programs: ["title", "level", "institute", "intake", "url"],
  notices: ["title", "institute", "url", "year", "status"],
  news: ["title", "summary", "date", "category", "url", "image"],
  events: ["title", "summary", "date", "time", "location", "url"],
  resources: ["title", "section", "description", "url"]
};
const noStore = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

function responseRows(rows: Row[]) {
  return rows.map((row) => ({ ...JSON.parse(row.data_json), id: row.id, title: row.title, published: Boolean(row.published), sortOrder: row.sort_order, createdAt: row.created_at, updatedAt: row.updated_at }));
}

async function readBody(request: Request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 32_000) throw new Error("Content is too large. Keep entries under 32 KB.");
  return await request.json();
}

function normalizeItem(collection: string, raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Send a content object.");
  const input = raw as Record<string, unknown>;
  const data: Record<string, string> = {};
  for (const key of fields[collection]) {
    const value = input[key];
    if (value === undefined || value === null) { data[key] = ""; continue; }
    if (typeof value !== "string") throw new Error(`${key} must be text.`);
    const trimmed = value.trim();
    if (trimmed.length > 5000) throw new Error(`${key} is too long.`);
    data[key] = trimmed;
  }
  if (!data.title) throw new Error("A title is required.");
  if (!data.url) throw new Error("A destination URL is required.");
  let destination: URL;
  try { destination = new URL(data.url); } catch { throw new Error("Enter a valid destination URL."); }
  if (!["https:", "http:"].includes(destination.protocol) || destination.username || destination.password) throw new Error("Only public HTTP and HTTPS links are allowed.");
  if (collection === "programs" && !["diploma", "bachelor", "master", "doctoral"].includes(data.level)) throw new Error("Choose a valid program level.");
  const published = input.published !== false;
  const sortOrder = Number.isInteger(input.sortOrder) ? Number(input.sortOrder) : 0;
  return { data, published, sortOrder };
}

export async function onRequest({ request, env }: { request: Request; env: Env }) {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;
  if (!env.SAL_CONTENT) return Response.json({ error: "The SAL_CONTENT D1 binding is missing." }, { status: 503, headers: noStore });
  const url = new URL(request.url);
  const collection = url.searchParams.get("collection") || "";
  if (!Object.hasOwn(fields, collection)) return Response.json({ error: "Unknown content collection." }, { status: 400, headers: noStore });

  if (!["GET", "POST", "PUT", "DELETE"].includes(request.method)) return Response.json({ error: "Method not allowed." }, { status: 405, headers: { ...noStore, Allow: "GET, POST, PUT, DELETE" } });
  if (request.method !== "GET") {
    const origin = request.headers.get("Origin");
    if (origin && origin !== url.origin) return Response.json({ error: "Cross-origin updates are not allowed." }, { status: 403, headers: noStore });
  }

  try {
    if (request.method === "GET") {
      const result = await env.SAL_CONTENT.prepare("SELECT id, title, data_json, published, sort_order, created_at, updated_at FROM content_items WHERE collection = ? ORDER BY sort_order ASC, title ASC").bind(collection).all<Row>();
      return Response.json(responseRows(result.results || []), { headers: noStore });
    }

    if (request.method === "DELETE") {
      const id = url.searchParams.get("id");
      if (!id) return Response.json({ error: "An item id is required." }, { status: 400, headers: noStore });
      await env.SAL_CONTENT.prepare("DELETE FROM content_items WHERE collection = ? AND id = ?").bind(collection, id).run();
      return Response.json({ ok: true }, { headers: noStore });
    }

    const raw = await readBody(request);
    const normalized = normalizeItem(collection, raw);
    const dataJson = JSON.stringify(normalized.data);
    const itemId = request.method === "PUT" ? url.searchParams.get("id") : crypto.randomUUID();
    if (!itemId) return Response.json({ error: "An item id is required for updates." }, { status: 400, headers: noStore });

    if (request.method === "POST") {
      await env.SAL_CONTENT.prepare("INSERT INTO content_items (collection, id, title, data_json, published, sort_order) VALUES (?, ?, ?, ?, ?, ?)").bind(collection, itemId, normalized.data.title, dataJson, normalized.published ? 1 : 0, normalized.sortOrder).run();
    } else {
      const result = await env.SAL_CONTENT.prepare("UPDATE content_items SET title = ?, data_json = ?, published = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE collection = ? AND id = ?").bind(normalized.data.title, dataJson, normalized.published ? 1 : 0, normalized.sortOrder, collection, itemId).run();
      if (!result.meta?.changes) return Response.json({ error: "The item no longer exists. Reload the list and try again." }, { status: 404, headers: noStore });
    }
    const saved = await env.SAL_CONTENT.prepare("SELECT id, title, data_json, published, sort_order, created_at, updated_at FROM content_items WHERE collection = ? AND id = ?").bind(collection, itemId).all<Row>();
    return Response.json(responseRows(saved.results || [])[0] || { ok: true }, { status: request.method === "POST" ? 201 : 200, headers: noStore });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save this item.";
    const status = message.startsWith("D1_ERROR") ? 409 : 400;
    return Response.json({ error: message }, { status, headers: noStore });
  }
}

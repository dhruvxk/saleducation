interface D1Result<T> { results?: T[] }
interface Database {
  prepare(query: string): { bind(...values: unknown[]): { all<T>(): Promise<D1Result<T>> } };
}
interface Env { SAL_CONTENT?: Database }
interface Row { id: string; title: string; data_json: string; sort_order: number; updated_at: string }

const collections = new Set(["programs", "notices", "news", "events", "resources"]);

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  const collection = new URL(request.url).searchParams.get("collection") || "";
  if (!collections.has(collection)) return Response.json({ error: "Unknown content collection." }, { status: 400 });
  if (!env.SAL_CONTENT) return Response.json({ error: "Content database is not configured." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  try {
    const result = await env.SAL_CONTENT.prepare("SELECT id, title, data_json, sort_order, updated_at FROM content_items WHERE collection = ? AND published = 1 ORDER BY sort_order ASC, title ASC").bind(collection).all<Row>();
    const items = (result.results || []).map((row) => ({ ...JSON.parse(row.data_json), id: row.id, title: row.title, sortOrder: row.sort_order, updatedAt: row.updated_at }));
    return Response.json(items, { headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return Response.json({ error: "Could not load published content." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

import { OPENROUTER_BASE_URL, openrouterHeaders } from "@/lib/openrouter";
import type { Model } from "@/types/models";
import { OPENROUTER_AUTO } from "@/types/models";

const timestamp = () => new Date().toTimeString().slice(0, 8);

export async function GET() {
  const start = Date.now();

  try {
    const res = await fetch(`${OPENROUTER_BASE_URL}/models`, {
      headers: openrouterHeaders(),
      // Next.js fetch caching: revalidate every hour
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.error(
        `[${timestamp()}] [models] fetch failed: ${res.status} ${res.statusText}`
      );
      return Response.json(
        { error: "Failed to fetch model list from OpenRouter" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const models: Model[] = data.data ?? [];

    // Sort alphabetically by name, then pin openrouter/auto first
    const sorted = models
      .filter((m) => m.id !== "openrouter/auto")
      .sort((a, b) => a.name.localeCompare(b.name));

    const result = [OPENROUTER_AUTO, ...sorted];

    console.log(
      `[${timestamp()}] [models] fetched ${result.length} models in ${Date.now() - start}ms`
    );

    return Response.json(result);
  } catch (err) {
    console.error(`[${timestamp()}] [models] error:`, err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

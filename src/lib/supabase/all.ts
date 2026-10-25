import type { SupabaseClient } from "@supabase/supabase-js";
/** PostgREST limite les résultats : lire toutes les pages avant les agrégations. */
export async function toutes<T>(client: SupabaseClient, table: "orders" | "products" | "expenses"): Promise<T[]> {
  const rows: T[] = [];
  const size = 500;
  for (let start = 0; ; start += size) {
    const { data, error } = await client.from(table).select("*").order("id").range(start, start + size - 1);
    if (error) throw new Error(`Lecture impossible : ${table}`);
    rows.push(...(data as T[]));
    if (data.length < size) return rows;
  }
}

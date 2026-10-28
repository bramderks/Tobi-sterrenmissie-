import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getSql() {
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;
  if (!url) throw new Error("Database URL ontbreekt");
  return neon(url);
}

async function ensureTable() {
  const sql = getSql();
  await sql`CREATE TABLE IF NOT EXISTS tobi_app_state (
    id TEXT PRIMARY KEY,
    state JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  return sql;
}

export async function GET() {
  try {
    const sql = await ensureTable();
    const rows = await sql`SELECT state, updated_at FROM tobi_app_state WHERE id = 'shared'`;
    return NextResponse.json({ state: rows[0]?.state ?? null, updatedAt: rows[0]?.updated_at ?? null });
  } catch (error) {
    console.error("Tobi state GET failed", error);
    return NextResponse.json({ error: "Gedeelde opslag niet beschikbaar." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body?.state || typeof body.state !== "object" || Array.isArray(body.state)) {
      return NextResponse.json({ error: "Ongeldige gegevens." }, { status: 400 });
    }
    const sql = await ensureTable();
    if (body.initialize === true) {
      await sql`INSERT INTO tobi_app_state (id, state, updated_at)
        VALUES ('shared', ${JSON.stringify(body.state)}::jsonb, NOW())
        ON CONFLICT (id) DO NOTHING`;
    } else {
      await sql`INSERT INTO tobi_app_state (id, state, updated_at)
        VALUES ('shared', ${JSON.stringify(body.state)}::jsonb, NOW())
        ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state, updated_at = NOW()`;
    }
    const rows = await sql`SELECT state, updated_at FROM tobi_app_state WHERE id = 'shared'`;
    return NextResponse.json({ state: rows[0]?.state ?? null, updatedAt: rows[0]?.updated_at ?? null });
  } catch (error) {
    console.error("Tobi state PUT failed", error);
    return NextResponse.json({ error: "Opslaan naar gedeelde opslag is niet gelukt." }, { status: 503 });
  }
}

/**
 * Neon + Drizzle client. Only instantiated when DATABASE_URL is present; the
 * MVP UI does not import this — it reads from the seeded client store. Wire this
 * into server actions/route handlers when moving off mock data.
 */
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;

export const db = url ? drizzle(neon(url), { schema }) : null;
export { schema };

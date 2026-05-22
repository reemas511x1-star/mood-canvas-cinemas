import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TMDB_BASE = "https://api.themoviedb.org/3";

function key() {
  const k = process.env.TMDB_API_KEY;
  if (!k) throw new Error("TMDB_API_KEY missing");
  return k;
}

export const searchTmdb = createServerFn({ method: "GET" })
  .inputValidator((input: { query: string; language?: string }) =>
    z.object({
      query: z.string().min(1).max(120),
      language: z.enum(["en", "ar"]).default("en"),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const lang = data.language === "ar" ? "ar-SA" : "en-US";
    const url = `${TMDB_BASE}/search/multi?api_key=${key()}&language=${lang}&query=${encodeURIComponent(data.query)}&include_adult=false&page=1`;
    const r = await fetch(url);
    if (!r.ok) throw new Error("TMDB search failed");
    const j = await r.json();
    const results = (j.results ?? [])
      .filter((x: any) => x.media_type === "movie" || x.media_type === "tv")
      .slice(0, 12)
      .map((x: any) => ({
        tmdb_id: x.id,
        media_type: x.media_type as "movie" | "tv",
        title: x.title ?? x.name ?? "Untitled",
        original_title: x.original_title ?? x.original_name ?? null,
        poster_path: x.poster_path ?? null,
        backdrop_path: x.backdrop_path ?? null,
        overview: x.overview ?? null,
        release_year: parseInt(((x.release_date ?? x.first_air_date) ?? "").slice(0, 4), 10) || null,
        tmdb_rating: x.vote_average ?? null,
      }));
    return results;
  });

export const fetchTmdbDetails = createServerFn({ method: "GET" })
  .inputValidator((input: { tmdb_id: number; media_type: "movie" | "tv"; language?: string }) =>
    z.object({
      tmdb_id: z.number().int().positive(),
      media_type: z.enum(["movie", "tv"]),
      language: z.enum(["en", "ar"]).default("en"),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const lang = data.language === "ar" ? "ar-SA" : "en-US";
    const url = `${TMDB_BASE}/${data.media_type}/${data.tmdb_id}?api_key=${key()}&language=${lang}&append_to_response=credits`;
    const r = await fetch(url);
    if (!r.ok) throw new Error("TMDB details failed");
    return r.json();
  });

export const fetchPerson = createServerFn({ method: "GET" })
  .inputValidator((input: { person_id: number; language?: string }) =>
    z.object({
      person_id: z.number().int().positive(),
      language: z.enum(["en", "ar"]).default("en"),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const lang = data.language === "ar" ? "ar-SA" : "en-US";
    const url = `${TMDB_BASE}/person/${data.person_id}?api_key=${key()}&language=${lang}&append_to_response=combined_credits`;
    const r = await fetch(url);
    if (!r.ok) throw new Error("TMDB person failed");
    return r.json();
  });

export const tmdbTitleByQuery = createServerFn({ method: "GET" })
  .inputValidator((input: { query: string; language?: string }) =>
    z.object({
      query: z.string().min(1).max(120),
      language: z.enum(["en", "ar"]).default("en"),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const lang = data.language === "ar" ? "ar-SA" : "en-US";
    const url = `${TMDB_BASE}/search/multi?api_key=${key()}&language=${lang}&query=${encodeURIComponent(data.query)}&include_adult=false&page=1`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = await r.json();
    const top = (j.results ?? []).find((x: any) => x.media_type === "movie" || x.media_type === "tv");
    if (!top) return null;
    return {
      tmdb_id: top.id,
      media_type: top.media_type as "movie" | "tv",
      title: top.title ?? top.name,
      poster_path: top.poster_path ?? null,
      backdrop_path: top.backdrop_path ?? null,
      overview: top.overview ?? null,
      release_year: parseInt(((top.release_date ?? top.first_air_date) ?? "").slice(0, 4), 10) || null,
      tmdb_rating: top.vote_average ?? null,
    };
  });
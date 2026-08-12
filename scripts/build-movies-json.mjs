#!/usr/bin/env node
// 将 TMDb 响应(genre list + now-playing + 每部电影的 details/credits/videos)合并成 data/movies.json
// 用法: node scripts/build-movies-json.mjs --genres <json> --trending <json> --details <json> --out <path>

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const genresRaw = arg('genres');
const trendingRaw = arg('trending');
const detailsRaw = arg('details');
const outPath = arg('out');

if (!genresRaw || !trendingRaw || !outPath) {
  console.error('Usage: --genres <json> --trending <json> [--details <json>] --out <path>');
  process.exit(1);
}

const { genres } = JSON.parse(genresRaw);
const { results = [] } = JSON.parse(trendingRaw);
const details = detailsRaw ? JSON.parse(detailsRaw) : {};

const genreMap = new Map(genres.map((g) => [g.id, g.name]));

function pickTrailer(videos) {
  if (!videos || !Array.isArray(videos.results)) return null;
  // 优先官方 YouTube 预告片
  const yt = videos.results.filter((v) => v.site === 'YouTube');
  const trailer = yt.find((v) => v.type === 'Trailer' && v.official) || yt.find((v) => v.type === 'Trailer') || yt.find((v) => v.type === 'Teaser') || yt[0];
  return trailer ? { key: trailer.key, name: trailer.name, site: trailer.site, type: trailer.type } : null;
}

function pickDirector(credits) {
  if (!credits || !Array.isArray(credits.crew)) return null;
  const d = credits.crew.find((c) => c.job === 'Director');
  return d ? { id: d.id, name: d.name } : null;
}

function pickCast(credits, n = 8) {
  if (!credits || !Array.isArray(credits.cast)) return [];
  return credits.cast.slice(0, n).map((c) => ({
    id: c.id,
    name: c.name,
    character: c.character || null,
    profile: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
  }));
}

const movies = results.slice(0, 12).map((m) => {
  const d = details[m.id] || {};
  const detailsObj = d.details || {};
  return {
    id: m.id,
    title: m.title || m.original_title,
    originalTitle: m.original_title,
    year: m.release_date ? Number(m.release_date.slice(0, 4)) : null,
    releaseDate: m.release_date || null,
    rating: typeof m.vote_average === 'number' ? Number(m.vote_average.toFixed(1)) : null,
    voteCount: m.vote_count || 0,
    overview: m.overview || '',
    poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
    backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w780${m.backdrop_path}` : null,
    genres: (m.genre_ids || []).map((id) => genreMap.get(id)).filter(Boolean),
    // 详情 API
    runtime: detailsObj.runtime || null,
    tagline: detailsObj.tagline || null,
    status: detailsObj.status || null,
    originalLanguage: detailsObj.original_language || null,
    productionCompanies: (detailsObj.production_companies || []).slice(0, 4).map((p) => p.name),
    // 演职员
    director: pickDirector(d.credits),
    cast: pickCast(d.credits),
    // 预告片
    trailer: pickTrailer(d.videos),
  };
});

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(
  outPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      source: 'TMDb movie/now_playing?region=CN',
      movies,
    },
    null,
    2
  )
);

console.log(`Wrote ${movies.length} movies to ${outPath}`);

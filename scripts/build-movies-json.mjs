#!/usr/bin/env node
// 将 TMDb 响应(genre list + weekly trending)合并成 data/movies.json
// 用法: node scripts/build-movies-json.mjs --genres <json-string> --trending <json-string> --out <path>

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const genresRaw = arg('genres');
const trendingRaw = arg('trending');
const outPath = arg('out');

if (!genresRaw || !trendingRaw || !outPath) {
  console.error('Usage: --genres <json-string> --trending <json-string> --out <path>');
  process.exit(1);
}

const { genres } = JSON.parse(genresRaw);
const { results = [] } = JSON.parse(trendingRaw);

const genreMap = new Map(genres.map((g) => [g.id, g.name]));

const movies = results.slice(0, 12).map((m) => ({
  id: m.id,
  title: m.title || m.original_title,
  originalTitle: m.original_title,
  year: m.release_date ? Number(m.release_date.slice(0, 4)) : null,
  rating: typeof m.vote_average === 'number' ? Number(m.vote_average.toFixed(1)) : null,
  overview: m.overview || '',
  poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
  backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w780${m.backdrop_path}` : null,
  genres: (m.genre_ids || []).map((id) => genreMap.get(id)).filter(Boolean),
}));

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
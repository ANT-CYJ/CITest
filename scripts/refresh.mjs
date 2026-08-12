#!/usr/bin/env node
// 一站式:TMDb genres + now-playing(去重) + 单片详情/credits/videos → data/movies.json
// 用法: TMDB_API_KEY=... node scripts/refresh.mjs <output.json>

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const [, , outPath] = process.argv;
if (!outPath) {
  console.error('Usage: node scripts/refresh.mjs <output.json>');
  process.exit(1);
}

const KEY = process.env.TMDB_API_KEY;
const LANG = process.env.LANG || 'zh-CN';
const REGION = process.env.REGION || 'CN';
const BASE = process.env.BASE || 'https://api.themoviedb.org/3';
const LIST_SIZE = 12;

if (!KEY) {
  console.error('::error::TMDB_API_KEY is not set in env');
  process.exit(1);
}

async function get(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return r.json();
}

async function main() {
  console.log('→ Fetching genre list...');
  const { genres } = await get(`${BASE}/genre/movie/list?api_key=${KEY}&language=${LANG}`);

  console.log('→ Fetching now-playing page 1-2...');
  const [p1, p2] = await Promise.all([
    get(`${BASE}/movie/now_playing?api_key=${KEY}&language=${LANG}&region=${REGION}&page=1`),
    get(`${BASE}/movie/now_playing?api_key=${KEY}&language=${LANG}&region=${REGION}&page=2`),
  ]);
  // 合并去重,保留 40 部供 build 步骤筛选
  const seen = new Set();
  const merged = [];
  for (const m of [...(p1.results || []), ...(p2.results || [])]) {
    if (!seen.has(m.id)) { seen.add(m.id); merged.push(m); }
  }
  const top = merged.slice(0, 40);
  console.log(`  Got ${top.length} movies (${p1.results.length}+${p2.results.length}).`);

  console.log(`→ Fetching details for top ${LIST_SIZE}...`);
  const details = {};
  await Promise.all(top.slice(0, LIST_SIZE).map(async (m) => {
    const urls = [
      `${BASE}/movie/${m.id}?api_key=${KEY}&language=${LANG}`,
      `${BASE}/movie/${m.id}/credits?api_key=${KEY}&language=${LANG}`,
      `${BASE}/movie/${m.id}/videos?api_key=${KEY}&language=${LANG}`,
    ];
    try {
      const [det, cred, vid] = await Promise.all(urls.map(get));
      details[m.id] = { details: det, credits: cred, videos: vid };
      console.log(`  ✓ ${m.id} ${m.title}`);
    } catch (e) {
      console.error(`  ✗ ${m.id} ${e.message}`);
      details[m.id] = { details: null, credits: null, videos: null, error: e.message };
    }
  }));

  console.log('→ Building movies.json...');
  const genreMap = new Map(genres.map((g) => [g.id, g.name]));

  function pickTrailer(videos) {
    if (!videos || !Array.isArray(videos.results)) return null;
    const yt = videos.results.filter((v) => v.site === 'YouTube');
    const t = yt.find((v) => v.type === 'Trailer' && v.official) || yt.find((v) => v.type === 'Trailer') || yt.find((v) => v.type === 'Teaser') || yt[0];
    return t ? { key: t.key, name: t.name, site: t.site, type: t.type } : null;
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

  const movies = top.slice(0, LIST_SIZE).map((m) => {
    const d = details[m.id] || {};
    const det = d.details || {};
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
      runtime: det.runtime || null,
      tagline: det.tagline || null,
      status: det.status || null,
      originalLanguage: det.original_language || null,
      productionCompanies: (det.production_companies || []).slice(0, 4).map((p) => p.name),
      director: pickDirector(d.credits),
      cast: pickCast(d.credits),
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

  const withTrailer = movies.filter((m) => m.trailer).length;
  const withCast = movies.filter((m) => m.cast.length > 0).length;
  console.log(`✓ Wrote ${movies.length} movies to ${outPath} (${withTrailer} with trailer, ${withCast} with cast).`);
}

main().catch((e) => {
  console.error('::error::' + e.message);
  console.error(e.stack);
  process.exit(1);
});

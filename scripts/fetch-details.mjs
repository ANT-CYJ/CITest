#!/usr/bin/env node
// 并发拉每部电影的 details / credits / videos,写到 details.json
// 用法: TMDB_API_KEY=... node scripts/fetch-details.mjs <input.json> <output.json>

import { readFileSync, writeFileSync } from 'node:fs';

const [, , input, output] = process.argv;
if (!input || !output) {
  console.error('Usage: node scripts/fetch-details.mjs <input.json> <output.json>');
  process.exit(1);
}

const key = process.env.TMDB_API_KEY;
const lang = process.env.LANG || 'zh-CN';
const base = process.env.BASE || 'https://api.themoviedb.org/3';

if (!key) {
  console.error('::error::TMDB_API_KEY is not set in env');
  process.exit(1);
}

const list = JSON.parse(readFileSync(input, 'utf8')).results || [];
const top = list.slice(0, 12);
console.log(`Fetching details for ${top.length} movies...`);

const out = {};
await Promise.all(top.map(async (m) => {
  const urls = [
    `${base}/movie/${m.id}?api_key=${key}&language=${lang}`,
    `${base}/movie/${m.id}/credits?api_key=${key}&language=${lang}`,
    `${base}/movie/${m.id}/videos?api_key=${key}&language=${lang}`,
  ];
  try {
    const [det, cred, vid] = await Promise.all(urls.map(async (u) => {
      const r = await fetch(u);
      if (!r.ok) throw new Error(`HTTP ${r.status} for ${u}`);
      return r.json();
    }));
    out[m.id] = { details: det, credits: cred, videos: vid };
    console.log(`  ✓ ${m.id} ${m.title || m.original_title}`);
  } catch (e) {
    console.error(`  ✗ ${m.id} ${e.message}`);
    out[m.id] = { details: null, credits: null, videos: null, error: e.message };
  }
}));

writeFileSync(output, JSON.stringify(out));
console.log(`Wrote ${Object.keys(out).length} entries to ${output}`);

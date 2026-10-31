#!/usr/bin/env node
// Submit all sitemap URLs to IndexNow (Bing, Yandex, etc.).
// Usage: node scripts/indexnow-submit.mjs [--dry-run] [--sitemap <url>]
const HOST = 'www.solobeaute.com';
const KEY = '82ec834368e33669fba225834811e3ea';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const i = args.indexOf('--sitemap');
const sitemapUrl = i >= 0 ? args[i + 1] : `https://${HOST}/sitemap.xml`;

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.text();
}

async function collectUrls(url, depth = 0) {
  const xml = await fetchText(url);
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
  if (/<sitemapindex/i.test(xml) && depth < 2) {
    const nested = await Promise.all(locs.map((u) => collectUrls(u, depth + 1)));
    return nested.flat();
  }
  return locs;
}

const urls = [...new Set(await collectUrls(sitemapUrl))].filter((u) => new URL(u).host === HOST);
if (urls.length === 0) throw new Error('No URLs found in sitemap');
console.log(`Found ${urls.length} URLs in ${sitemapUrl}`);

if (dryRun) {
  console.log(urls.join('\n'));
  process.exit(0);
}

const keyRes = await fetch(KEY_LOCATION);
if (!keyRes.ok || (await keyRes.text()).trim() !== KEY) {
  throw new Error(`Key file not live at ${KEY_LOCATION}; deploy first.`);
}

for (let s = 0; s < urls.length; s += 10000) {
  const urlList = urls.slice(s, s + 10000);
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
  });
  console.log(`POST ${ENDPOINT} (${urlList.length} URLs) -> ${res.status} ${res.statusText}`);
  const body = await res.text();
  if (body) console.log(body);
  if (res.status !== 200 && res.status !== 202) process.exitCode = 1;
}

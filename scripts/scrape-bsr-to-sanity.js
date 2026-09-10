/**
 * scrape-bsr-to-sanity.js (v2)
 *
 * Scrapes blog posts from bsrlive.com (a Cargo site) and converts them to
 * Sanity-ready NDJSON (Portable Text body).
 *
 * Key insight: Cargo embeds each page's raw content HTML directly in a
 * `window.__PRELOADED_STATE__` JSON blob in the page source, keyed by page
 * ID, with clean semantic classes:
 *   .blog-title          - article title
 *   .blog-subtitle        - dek/subtitle (optional)
 *   .blog-writer-name     - "by AUTHOR"
 *   .blog-pub-date        - "published DATE"
 *   .blog-body            - body paragraphs (multiple spans, each possibly
 *                            containing several paragraphs separated by
 *                            double <br/>)
 *   .end-of-blog-blurb    - closing sign-off line
 *   .blog-photo-captions  - image captions (skipped - not handling images yet)
 *
 * This is far more reliable than scraping the rendered DOM.
 *
 * Scope: only scrapes URLs matching /blog-post-N-(MMDDYY)-initials, i.e. the
 * actual blog posts. Interview pages and news posts are intentionally
 * excluded for now.
 *
 * Usage:
 *   npm install axios cheerio
 *   node scrape-bsr-to-sanity-v2.js
 *
 * Output:
 *   posts.ndjson  -> sanity dataset import posts.ndjson production
 */

import fs from "node:fs";
import path from "node:path";
import axios from "axios";
import * as cheerio from "cheerio";

const SITEMAP_URL = "https://bsrlive.com/sitemap.xml";
const OUTPUT_FILE = "posts.ndjson";
const DEBUG_DIR = "debug-html";
const REQUEST_DELAY_MS = 500;

// Only real blog posts, e.g. /blog-post-18-(050926)-l-w-
// (This naturally excludes /5-interviews, /news-spring-26-*, etc.)
const BLOG_POST_PATH_RE = /\/blog-post-\d+-\(\d{6}\)-[a-z0-9-]+/i;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getBlogPostUrls() {
  const { data: xml } = await axios.get(SITEMAP_URL);
  const $ = cheerio.load(xml, { xmlMode: true });
  const urls = [];
  $("url > loc").each((_, el) => {
    const loc = $(el).text().trim();
    if (BLOG_POST_PATH_RE.test(loc)) urls.push(loc);
  });
  return [...new Set(urls)];
}

function slugFromUrl(url) {
  const raw = new URL(url).pathname.replace(/^\/+/, "");
  return raw
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function randomKey() {
  return Math.random().toString(36).slice(2, 12);
}

// Extracts and parses the window.__PRELOADED_STATE__ JSON blob from the page HTML
function extractPreloadedState(html) {
  const $ = cheerio.load(html);
  let raw = null;
  $("script").each((_, el) => {
    const text = $(el).html() || "";
    if (text.includes("window.__PRELOADED_STATE__")) raw = text;
  });
  if (!raw) return null;

  const jsonText = raw
    .replace(/^\s*window\.__PRELOADED_STATE__\s*=\s*/, "")
    .replace(/;\s*$/, "");

  try {
    return JSON.parse(jsonText);
  } catch (err) {
    console.warn(`  ! Failed to parse __PRELOADED_STATE__: ${err.message}`);
    return null;
  }
}

function parsePublishedDate(text, url) {
  if (text) {
    const cleaned = text.replace(/(\d+)(st|nd|rd|th)/, "$1");
    const parsed = new Date(cleaned);
    if (!isNaN(parsed.getTime())) return parsed.toISOString();
  }
  const match = url.match(/\((\d{2})(\d{2})(\d{2})\)/);
  if (match) {
    const [, mm, dd, yy] = match;
    const iso = `20${yy}-${mm}-${dd}T00:00:00.000Z`;
    const parsed = new Date(iso);
    if (!isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return null;
}

// Recursively converts inline HTML nodes into Portable Text spans, collecting
// link markDefs along the way. `\n` is emitted for <br> (soft line break).
function inlineNodesToSpans($, node, markDefs, activeMarks = []) {
  const spans = [];
  $(node)
    .contents()
    .each((_, child) => {
      if (child.type === "text") {
        const text = $(child).text();
        if (!text) return;
        spans.push({ _type: "span", _key: randomKey(), text, marks: [...activeMarks] });
      } else if (child.type === "tag") {
        const tag = child.tagName.toLowerCase();
        if (tag === "b" || tag === "strong") {
          spans.push(...inlineNodesToSpans($, child, markDefs, [...activeMarks, "strong"]));
        } else if (tag === "i" || tag === "em") {
          spans.push(...inlineNodesToSpans($, child, markDefs, [...activeMarks, "em"]));
        } else if (tag === "u") {
          spans.push(...inlineNodesToSpans($, child, markDefs, [...activeMarks, "underline"]));
        } else if (tag === "a") {
          const href = $(child).attr("href") || "";
          const markKey = randomKey();
          markDefs.push({ _type: "link", _key: markKey, href });
          spans.push(...inlineNodesToSpans($, child, markDefs, [...activeMarks, markKey]));
        } else if (tag === "br") {
          spans.push({ _type: "span", _key: randomKey(), text: "\n", marks: [...activeMarks] });
        } else {
          spans.push(...inlineNodesToSpans($, child, markDefs, activeMarks));
        }
      }
    });
  return spans;
}

function htmlFragmentToBlock(fragmentHtml) {
  const $ = cheerio.load(`<div id="root">${fragmentHtml}</div>`);
  const root = $("#root").get(0);
  const markDefs = [];
  const children = inlineNodesToSpans($, root, markDefs);
  return {
    _type: "block",
    _key: randomKey(),
    style: "normal",
    markDefs,
    children: children.length
      ? children
      : [{ _type: "span", _key: randomKey(), text: "", marks: [] }],
  };
}

// A .blog-body span's innerHTML may contain several paragraphs separated by
// a double <br/>. Split on that, trim leading/trailing single <br/>s.
function splitBodySpanIntoParagraphs(innerHtml) {
  const rawParts = innerHtml.split(/(?:\s|\n)*<br\s*\/?>(?:\s|\n)*<br\s*\/?>(?:\s|\n)*/i);
  return rawParts
    .map((p) => p.replace(/^(?:\s|<br\s*\/?>)+|(?:\s|<br\s*\/?>)+$/gi, "").trim())
    .filter((p) => p.length > 0);
}

function extractPost(state, url) {
  const pageId = state.frontendState && state.frontendState.activePID;
  const page = pageId && state.pages && state.pages.byId && state.pages.byId[pageId];
  if (!page) {
    console.warn(`  ! Could not find active page in preloaded state for ${url}`);
    return null;
  }

  const $ = cheerio.load(`<div id="root">${page.content || ""}</div>`);

  const titleText = $(".blog-title").first().text().replace(/\s+/g, " ").trim();
  const writerText = $(".blog-writer-name").first().text().replace(/\s+/g, " ").trim();
  const pubDateText = $(".blog-pub-date").first().text().replace(/\s+/g, " ").trim();

  const author = writerText.replace(/^by\s+/i, "").trim() || null;
  const publishedRaw = pubDateText.replace(/^published\s+/i, "").trim() || null;
  const publishedAt = parsePublishedDate(publishedRaw, url);

  // The Studio blog schema requires both fields for every imported document.
  if (!author || author.length > 35 || !publishedAt) {
    console.warn(`  ! Invalid required fields for ${url}`);
    return null;
  }

  const bodyParagraphsHtml = [];
  $(".blog-body").each((_, span) => {
    const innerHtml = $(span).html() || "";
    bodyParagraphsHtml.push(...splitBodySpanIntoParagraphs(innerHtml));
  });

  const body = bodyParagraphsHtml.map(htmlFragmentToBlock);

  const slug = slugFromUrl(url);

  return {
    _type: "blog",
    _id: `post-${slug}`,
    title: titleText || page.title || slug,
    slug: { _type: "slug", current: slug },
    author,
    publishedAt,
    body,
  };
}

async function scrapePost(url) {
  const { data: html } = await axios.get(url);

  if (!fs.existsSync(DEBUG_DIR)) fs.mkdirSync(DEBUG_DIR);
  const slug = slugFromUrl(url);
  fs.writeFileSync(path.join(DEBUG_DIR, `${slug}.html`), html);

  const state = extractPreloadedState(html);
  if (!state) {
    console.warn(`  ! No __PRELOADED_STATE__ found for ${url}`);
    return null;
  }

  return extractPost(state, url);
}

async function main() {
  console.log("Fetching sitemap...");
  const urls = await getBlogPostUrls();
  console.log(`Found ${urls.length} blog post URLs.`);

  const out = fs.createWriteStream(OUTPUT_FILE);
  let success = 0;
  let failed = 0;

  for (const url of urls) {
    try {
      console.log(`Scraping ${url}`);
      const doc = await scrapePost(url);
      if (doc) {
        out.write(JSON.stringify(doc) + "\n");
        success++;
      } else {
        failed++;
      }
    } catch (err) {
      console.error(`  ! Failed on ${url}: ${err.message}`);
      failed++;
    }
    await sleep(REQUEST_DELAY_MS);
  }

  out.end();
  console.log(`\nDone. ${success} posts written to ${OUTPUT_FILE}, ${failed} failed.`);
  console.log(`Raw HTML for each post saved in ./${DEBUG_DIR}/ for troubleshooting.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * scrape-bsr-news-to-sanity.js
 *
 * Scrapes NEWS posts (not blog posts, not interviews) from bsrlive.com and
 * converts them to Sanity-ready NDJSON (Portable Text body).
 *
 * Same underlying technique as the blog-post scraper: Cargo embeds each
 * page's raw content HTML in a `window.__PRELOADED_STATE__` JSON blob.
 * The news template differs from the blog template though:
 *   .blog-title     - headline (same class as blog posts)
 *   .blog-subtitle   - dek (same class as blog posts)
 *   .blog-pub-date   - "published DATE" (same class as blog posts)
 *   (no .blog-writer-name - news posts in the sample have no byline)
 *   (no .end-of-blog-blurb - no sign-off line)
 *   body text - NOT wrapped in .blog-body. It's plain
 *     <span style="--font-scale: ...">...</span> blocks. One such span in
 *     the sample wraps only an embedded <iframe> (a podcast player) with no
 *     real text - that one is skipped. The other contains the actual
 *     write-up, paragraphs separated by a double <br/>, same as blog posts.
 *
 * Caveat: this logic is based on a single sample news page. If other news
 * posts are laid out differently, check the saved debug HTML and adjust the
 * body-span detection below.
 *
 * Scope: only /news-spring-N-M style URLs (two numeric segments) - this
 * excludes the /news-spring-26 index/set page and /7-news landing page,
 * and obviously excludes blog posts and interviews.
 *
 * Usage:
 *   npm install axios cheerio
 *   node scripts/scrape-bsr-news-to-sanity.js
 *
 * Output:
 *   news-posts.ndjson  -> sanity dataset import news-posts.ndjson --dataset production
 */

import fs from "node:fs";
import path from "node:path";
import axios from "axios";
import * as cheerio from "cheerio";

const SITEMAP_URL = "https://bsrlive.com/sitemap.xml";
const OUTPUT_FILE = "news-posts.ndjson";
const DEBUG_DIR = "debug-html-news";
const REQUEST_DELAY_MS = 500;

// Real news posts have two numeric segments, e.g. /news-spring-26-422
// This excludes /news-spring-26 (the set/index page) and /7-news (landing page).
const NEWS_POST_PATH_RE = /\/news-[a-z0-9]+-\d+-\d+$/i;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getNewsPostUrls() {
  const { data: xml } = await axios.get(SITEMAP_URL);
  const $ = cheerio.load(xml, { xmlMode: true });
  const urls = [];
  $("url > loc").each((_, el) => {
    const loc = $(el).text().trim();
    if (NEWS_POST_PATH_RE.test(loc)) urls.push(loc);
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
  // News URLs don't reliably embed a date the way blog post URLs do, so no
  // URL-based fallback here - rely on .blog-pub-date text.
  return null;
}

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

function splitIntoParagraphs(innerHtml) {
  const rawParts = innerHtml.split(/(?:\s|\n)*<br\s*\/?>(?:\s|\n)*<br\s*\/?>(?:\s|\n)*/i);
  return rawParts
    .map((p) => p.replace(/^(?:\s|<br\s*\/?>)+|(?:\s|<br\s*\/?>)+$/gi, "").trim())
    .filter((p) => p.length > 0);
}

function extractNewsPost(state, url) {
  const pageId = state.frontendState && state.frontendState.activePID;
  const page = pageId && state.pages && state.pages.byId && state.pages.byId[pageId];
  if (!page) {
    console.warn(`  ! Could not find active page in preloaded state for ${url}`);
    return null;
  }

  const $ = cheerio.load(`<div id="root">${page.content || ""}</div>`);

  const titleText = $(".blog-title").first().text().replace(/\s+/g, " ").trim();
  const pubDateText = $(".blog-pub-date").first().text().replace(/\s+/g, " ").trim();
  const publishedRaw = pubDateText.replace(/^published\s+/i, "").trim() || null;
  const publishedAt = parsePublishedDate(publishedRaw, url);

  // The Studio news schema requires an author and publication date. Source
  // news pages have no byline, so use a consistent editorial author value.
  if (!publishedAt) {
    console.warn(`  ! Missing required publishedAt for ${url}`);
    return null;
  }

  // Body text lives in plain `<span style="--font-scale: ...">` blocks that
  // are NOT the title/subtitle/pub-date (those have their own classes) and
  // that aren't just a wrapper around an embedded iframe with no real text.
  const bodyParagraphsHtml = [];
  $('span[style*="font-scale"]').each((_, span) => {
    const $span = $(span);
    // Skip if this span (or an ancestor already processed) is the title/subtitle/pubdate
    if ($span.hasClass("blog-title") || $span.hasClass("blog-subtitle") || $span.hasClass("blog-pub-date")) {
      return;
    }
    // Skip spans nested inside title/subtitle/pub-date wrappers
    if ($span.parents(".blog-title, .blog-subtitle, .blog-pub-date").length > 0) {
      return;
    }
    // Skip spans that are just an iframe embed (no meaningful text of their own,
    // only inherited from a nested iframe's fallback content)
    const directText = $span
      .clone()
      .children()
      .remove()
      .end()
      .text()
      .trim();
    const hasIframe = $span.find("iframe").length > 0;
    if (hasIframe && directText.length === 0) return;

    // Skip if this span is nested inside another qualifying span we'll already process
    // (avoids double-counting when spans are nested)
    const isNestedInAnotherFontScaleSpan =
      $span.parents('span[style*="font-scale"]').length > 0;
    if (isNestedInAnotherFontScaleSpan) return;

    const innerHtml = $span.html() || "";
    bodyParagraphsHtml.push(...splitIntoParagraphs(innerHtml));
  });

  const body = bodyParagraphsHtml.map(htmlFragmentToBlock);
  const slug = slugFromUrl(url);

  return {
    _type: "news",
    _id: `news-${slug}`,
    title: titleText || page.title || slug,
    slug: { _type: "slug", current: slug },
    author: "BSR News",
    publishedAt,
    description: body,
  };
}

async function scrapeNewsPost(url) {
  const { data: html } = await axios.get(url);

  if (!fs.existsSync(DEBUG_DIR)) fs.mkdirSync(DEBUG_DIR);
  const slug = slugFromUrl(url);
  fs.writeFileSync(path.join(DEBUG_DIR, `${slug}.html`), html);

  const state = extractPreloadedState(html);
  if (!state) {
    console.warn(`  ! No __PRELOADED_STATE__ found for ${url}`);
    return null;
  }

  return extractNewsPost(state, url);
}

async function main() {
  console.log("Fetching sitemap...");
  const urls = await getNewsPostUrls();
  console.log(`Found ${urls.length} news post URLs.`);

  const out = fs.createWriteStream(OUTPUT_FILE);
  let success = 0;
  let failed = 0;

  for (const url of urls) {
    try {
      console.log(`Scraping ${url}`);
      const doc = await scrapeNewsPost(url);
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
  console.log(`\nDone. ${success} news posts written to ${OUTPUT_FILE}, ${failed} failed.`);
  console.log(`Raw HTML for each post saved in ./${DEBUG_DIR}/ for troubleshooting.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

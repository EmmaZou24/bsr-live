/**
 * Scrapes YouTube interviews from the Cargo /5-interviews page and converts
 * them to Sanity-ready NDJSON.
 *
 * Linked YouTube media-items receive their Cargo image as coverImage and
 * articleImages. Cargo YouTube URL media-items (the rendered player cards)
 * are imported without an image.
 * YouTube titles are read from the public oEmbed endpoint.
 *
 * Usage:
 *   SANITY_API_TOKEN=... node scripts/scrape-bsr-interviews-to-sanity.js
 *
 * Optional:
 *   INTERVIEW_PUBLISHED_AT=2026-10-29T00:00:00.000Z
 */

import axios from "axios";
import fs from "node:fs";
import * as cheerio from "cheerio";
import { uploadCargoImage } from "./sanity-image-assets.js";

const INTERVIEWS_URL = "https://bsrlive.com/5-interviews";
const OUTPUT_FILE = "interviews.ndjson";
const AUTHOR = "BSR Interviews";
const PUBLISHED_AT = process.env.INTERVIEW_PUBLISHED_AT || new Date().toISOString();

function randomKey() {
  return Math.random().toString(36).slice(2, 12);
}

function slugFromVideoId(videoId) {
  return `interview-${videoId.toLowerCase()}`;
}

function youtubeVideoId(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") return parsed.pathname.slice(1).split("/")[0];
    if (parsed.hostname.endsWith("youtube.com")) {
      if (parsed.pathname === "/watch") return parsed.searchParams.get("v");
      if (parsed.pathname.startsWith("/embed/")) return parsed.pathname.split("/")[2];
    }
  } catch {
    return null;
  }
  return null;
}

function canonicalYoutubeUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
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
  return JSON.parse(jsonText);
}

async function youtubeTitle(videoId) {
  const { data } = await axios.get("https://www.youtube.com/oembed", {
    params: { url: canonicalYoutubeUrl(videoId), format: "json" },
  });
  return data.title || `YouTube interview ${videoId}`;
}

function emptyDescription(title) {
  return [
    {
      _type: "block",
      _key: randomKey(),
      style: "normal",
      markDefs: [],
      children: [{ _type: "span", _key: randomKey(), text: title, marks: [] }],
    },
  ];
}

async function main() {
  const { data: html } = await axios.get(INTERVIEWS_URL);
  const state = extractPreloadedState(html);
  const pageId = state?.frontendState?.activePID;
  const page = pageId ? state.pages?.byId?.[pageId] : null;
  if (!page) throw new Error("Could not find the interviews page in preloaded state");

  const $ = cheerio.load(`<div id="root">${page.content || ""}</div>`);
  const mediaByHash = new Map((page.media || []).map((media) => [media.hash, media]));
  const elementByHash = new Map(
    $("media-item[hash]")
      .toArray()
      .map((element) => [$(element).attr("hash"), element]),
  );
  const entries = [];

  for (const media of page.media || []) {
    if (!media.is_url || media.url_type !== "youtube") continue;
    const sourceUrl = media.url || "";
    const element = elementByHash.get(media.hash);
    const videoId = youtubeVideoId(sourceUrl);
    if (!videoId || !element || entries.some((entry) => entry.videoId === videoId)) continue;
    entries.push({
      element,
      videoId,
      media,
      isLinked: false,
    });
  }

  $("media-item[href], iframe[src]").each((_, element) => {
    const sourceUrl = $(element).attr("href") || $(element).attr("src") || "";
    const videoId = youtubeVideoId(sourceUrl);
    if (!videoId || entries.some((entry) => entry.videoId === videoId)) return;
    entries.push({
      element,
      videoId,
      media: mediaByHash.get($(element).attr("hash")),
      isLinked: element.tagName.toLowerCase() === "media-item",
    });
  });

  const out = [];
  for (const entry of entries) {
    const title = await youtubeTitle(entry.videoId);
    const coverImage =
      entry.isLinked && entry.media?.is_image && !entry.media.is_placeholder
        ? await uploadCargoImage($, entry.element, entry.media)
        : null;
    const slug = slugFromVideoId(entry.videoId);
    out.push({
      _type: "interview",
      _id: `interview-${entry.videoId}`,
      title,
      slug: { _type: "slug", current: slug },
      author: AUTHOR,
      publishedAt: PUBLISHED_AT,
      ...(coverImage ? { coverImage, articleImages: [coverImage] } : { articleImages: [] }),
      description: emptyDescription(title),
      interviewLink: canonicalYoutubeUrl(entry.videoId),
    });
    console.log(`${entry.isLinked ? "Linked" : "Embedded"}: ${title}`);
  }

  fs.writeFileSync(OUTPUT_FILE, out.map((document) => JSON.stringify(document)).join("\n") + "\n");
  console.log(`\nDone. ${out.length} interviews written to ${OUTPUT_FILE}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
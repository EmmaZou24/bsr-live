import axios from "axios";
import { createClient } from "@sanity/client";

const CARGO_IMAGE_WIDTH = 1200;

const sanityToken = process.env.SANITY_API_TOKEN;
const sanityClient = sanityToken
    ? createClient({
        projectId: process.env.SANITY_PROJECT_ID || "1coo076c",
        dataset: process.env.SANITY_DATASET || "production",
        apiVersion: "2025-01-01",
        token: sanityToken,
        useCdn: false,
    })
    : null;

const uploadedImages = new Map();

function cargoImageUrl(media) {
    return `https://freight.cargo.site/w/${CARGO_IMAGE_WIDTH}/i/${media.hash}/${encodeURIComponent(media.name)}`;
}

function imageAlt($, element, media) {
    const caption = $(element).find("figcaption").text().replace(/\s+/g, " ").trim();
    return caption || media.display_name || media.name || "";
}

export async function uploadCargoImage($, element, media) {
    if (uploadedImages.has(media.hash)) return uploadedImages.get(media.hash);
    if (!sanityClient) {
        throw new Error(
            "Images were found, but SANITY_API_TOKEN is not set. Set SANITY_API_TOKEN before scraping articles with images.",
        );
    }

    const { data, headers } = await axios.get(cargoImageUrl(media), {
        responseType: "arraybuffer",
    });
    const asset = await sanityClient.assets.upload("image", Buffer.from(data), {
        filename: media.name,
        contentType: headers["content-type"] || media.mime_type,
    });
    const image = {
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
        alt: imageAlt($, element, media),
    };
    uploadedImages.set(media.hash, image);
    return image;
}

export async function uploadArticleImages($, page) {
    const mediaByHash = new Map((page.media || []).map((media) => [media.hash, media]));
    const elements = $(page.content || "media-item[hash]").find("media-item[hash]").toArray();
    const images = [];

    for (const element of elements) {
        const media = mediaByHash.get($(element).attr("hash"));
        if (!media || !media.is_image || media.is_placeholder) continue;
        images.push(await uploadCargoImage($, element, media));
    }

    return images;
}
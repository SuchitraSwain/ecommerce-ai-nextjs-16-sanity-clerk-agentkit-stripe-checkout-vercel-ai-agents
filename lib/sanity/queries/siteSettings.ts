import { defineQuery } from "next-sanity";

export const SITE_SETTINGS_QUERY = defineQuery(`*[
  _type == "siteSettings"
][0]{
  _id,
  storeName,
  tagline
}`);

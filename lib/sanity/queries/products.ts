import { defineQuery } from "next-sanity";

// ============================================
// Product List Projection (reused across queries)
// ============================================
const PRODUCT_LIST_PROJECTION = `{
  _id,
  name,
  "slug": slug.current,
  price,
  "image": images[0]{
    asset->{
      _id,
      url
    },
    hotspot
  },
  category->{
    _id,
    title,
    "slug": slug.current
  },
  material,
  color,
  stock
}`;

// ============================================
// All Products Query
// ============================================

/**
 * Get all products with category expanded
 * Used on landing page
 */
export const ALL_PRODUCTS_QUERY = defineQuery(`*[
  _type == "product"
] | order(name asc) {
  _id,
  name,
  "slug": slug.current,
  description,
  price,
  "images": images[]{
    _key,
    asset->{
      _id,
      url
    },
    hotspot
  },
  category->{
    _id,
    title,
    "slug": slug.current
  },
  material,
  color,
  dimensions,
  stock,
  featured,
  assemblyRequired
}`);

/**
 * Get featured products for homepage
 */
export const FEATURED_PRODUCTS_QUERY = defineQuery(`*[
  _type == "product"
  && featured == true
  && stock > 0
] | order(name asc) {
  _id,
  name,
  "slug": slug.current,
  price,
  "image": images[0]{
    asset->{
      _id,
      url
    },
    hotspot
  },
  category->{
    _id,
    title,
    "slug": slug.current
  },
  stock
}`);

/**
 * Get products by category slug
 */
export const PRODUCTS_BY_CATEGORY_QUERY = defineQuery(`*[
  _type == "product"
  && category->slug.current == $categorySlug
] | order(name asc) {
  _id,
  name,
  "slug": slug.current,
  price,
  "image": images[0]{
    asset->{
      _id,
      url
    },
    hotspot
  },
  category->{
    _id,
    title,
    "slug": slug.current
  },
  material,
  color,
  stock
}`);

/**
 * Get single product by slug
 * Used on product detail page
 */
export const PRODUCT_BY_SLUG_QUERY = defineQuery(`*[
  _type == "product"
  && slug.current == $slug
][0] {
  _id,
  name,
  "slug": slug.current,
  description,
  price,
  "images": images[]{
    _key,
    asset->{
      _id,
      url
    },
    hotspot
  },
  category->{
    _id,
    title,
    "slug": slug.current
  },
  material,
  color,
  dimensions,
  stock,
  featured,
  assemblyRequired
}`);

// ============================================
// Search & Filter Queries (Server-Side)
// Uses GROQ score() for relevance ranking
// ============================================

/**
 * Search products with relevance scoring
 * Uses score() + boost() for better ranking
 * Orders by relevance score descending
 */
export const SEARCH_PRODUCTS_QUERY = defineQuery(`*[
  _type == "product"
  && (
    name match $searchQuery + "*"
    || description match $searchQuery + "*"
  )
] | score(
  boost(name match $searchQuery + "*", 3),
  boost(description match $searchQuery + "*", 1)
) | order(_score desc) {
  _id,
  _score,
  name,
  "slug": slug.current,
  price,
  "image": images[0]{
    asset->{
      _id,
      url
    },
    hotspot
  },
  category->{
    _id,
    title,
    "slug": slug.current
  },
  material,
  color,
  stock
}`);

/**
 * Filter products - ordered by name (A-Z)
 * Returns up to 4 images for hover preview in product cards
 */
export const FILTER_PRODUCTS_BY_NAME_QUERY = defineQuery(`*[
  _type == "product"
  && ($categorySlug == "" || category->slug.current == $categorySlug)
  && ($color == "" || color == $color)
  && ($material == "" || material == $material)
  && ($minPrice == 0 || price >= $minPrice)
  && ($maxPrice == 0 || price <= $maxPrice)
  && ($searchQuery == "" || name match $searchQuery + "*" || description match $searchQuery + "*")
] | order(name asc) {
  _id,
  name,
  "slug": slug.current,
  price,
  "images": images[0...4]{
    _key,
    asset->{
      _id,
      url
    }
  },
  category->{
    _id,
    title,
    "slug": slug.current
  },
  material,
  color,
  stock
}`);

/**
 * Filter products - ordered by price ascending
 * Returns up to 4 images for hover preview in product cards
 */
export const FILTER_PRODUCTS_BY_PRICE_ASC_QUERY = defineQuery(`*[
  _type == "product"
  && ($categorySlug == "" || category->slug.current == $categorySlug)
  && ($color == "" || color == $color)
  && ($material == "" || material == $material)
  && ($minPrice == 0 || price >= $minPrice)
  && ($maxPrice == 0 || price <= $maxPrice)
  && ($searchQuery == "" || name match $searchQuery + "*" || description match $searchQuery + "*")
] | order(price asc) {
  _id,
  name,
  "slug": slug.current,
  price,
  "images": images[0...4]{
    _key,
    asset->{
      _id,
      url
    }
  },
  category->{
    _id,
    title,
    "slug": slug.current
  },
  material,
  color,
  stock
}`);

/**
 * Filter products - ordered by price descending
 * Returns up to 4 images for hover preview in product cards
 */
export const FILTER_PRODUCTS_BY_PRICE_DESC_QUERY = defineQuery(`*[
  _type == "product"
  && ($categorySlug == "" || category->slug.current == $categorySlug)
  && ($color == "" || color == $color)
  && ($material == "" || material == $material)
  && ($minPrice == 0 || price >= $minPrice)
  && ($maxPrice == 0 || price <= $maxPrice)
  && ($searchQuery == "" || name match $searchQuery + "*" || description match $searchQuery + "*")
] | order(price desc) {
  _id,
  name,
  "slug": slug.current,
  price,
  "images": images[0...4]{
    _key,
    asset->{
      _id,
      url
    }
  },
  category->{
    _id,
    title,
    "slug": slug.current
  },
  material,
  color,
  stock
}`);

/**
 * Filter products - ordered by relevance (when searching)
 * Uses score() for search term matching
 * Returns up to 4 images for hover preview in product cards
 */
export const FILTER_PRODUCTS_BY_RELEVANCE_QUERY = defineQuery(`*[
  _type == "product"
  && ($categorySlug == "" || category->slug.current == $categorySlug)
  && ($color == "" || color == $color)
  && ($material == "" || material == $material)
  && ($minPrice == 0 || price >= $minPrice)
  && ($maxPrice == 0 || price <= $maxPrice)
  && ($searchQuery == "" || name match $searchQuery + "*" || description match $searchQuery + "*")
] | score(
  boost(name match $searchQuery + "*", 3),
  boost(description match $searchQuery + "*", 1)
) | order(_score desc, name asc) {
  _id,
  name,
  "slug": slug.current,
  price,
  "images": images[0...4]{
    _key,
    asset->{
      _id,
      url
    }
  },
  category->{
    _id,
    title,
    "slug": slug.current
  },
  material,
  color,
  stock
}`);

/**
 * Get products by IDs (for cart/checkout)
 */
export const PRODUCTS_BY_IDS_QUERY = defineQuery(`*[
  _type == "product"
  && _id in $ids
] {
  _id,
  name,
  "slug": slug.current,
  price,
  "image": images[0]{
    asset->{
      _id,
      url
    },
    hotspot
  },
  stock
}`);

/**
 * Get low stock products (admin)
 */
export const LOW_STOCK_PRODUCTS_QUERY = defineQuery(`*[
  _type == "product"
  && stock > 0
  && stock <= 5
] | order(stock asc) {
  _id,
  name,
  "slug": slug.current,
  stock,
  "image": images[0]{
    asset->{
      _id,
      url
    }
  }
}`);

/**
 * Get out of stock products (admin)
 */
export const OUT_OF_STOCK_PRODUCTS_QUERY = defineQuery(`*[
  _type == "product"
  && stock == 0
] | order(name asc) {
  _id,
  name,
  "slug": slug.current,
  "image": images[0]{
    asset->{
      _id,
      url
    }
  }
}`);

// ============================================
// AI Shopping Assistant Query
// Uses score() + boost() with all filters for AI agent
// ============================================

/**
 * Search products for AI shopping assistant
 * Full-featured search with all filters and product details
 */
export const AI_SEARCH_PRODUCTS_QUERY = defineQuery(`*[
  _type == "product"
  && (
    $searchQuery == ""
    || name match $searchQuery + "*"
    || description match $searchQuery + "*"
    || category->title match $searchQuery + "*"
  )
  && ($categorySlug == "" || category->slug.current == $categorySlug)
  && ($material == "" || material == $material)
  && ($color == "" || color == $color)
  && ($minPrice == 0 || price >= $minPrice)
  && ($maxPrice == 0 || price <= $maxPrice)
] | order(name asc) [0...20] {
  _id,
  name,
  "slug": slug.current,
  description,
  price,
  "image": images[0]{
    asset->{
      _id,
      url
    }
  },
  category->{
    _id,
    title,
    "slug": slug.current
  },
  material,
  color,
  dimensions,
  stock,
  featured,
  assemblyRequired
}`);

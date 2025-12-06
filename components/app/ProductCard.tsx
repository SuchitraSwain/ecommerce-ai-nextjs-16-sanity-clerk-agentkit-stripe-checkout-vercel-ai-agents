"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AddToCartButton } from "@/components/app/AddToCartButton";
import { StockBadge } from "@/components/app/StockBadge";
import type { FILTER_PRODUCTS_BY_NAME_QUERYResult } from "@/sanity.types";

type Product = FILTER_PRODUCTS_BY_NAME_QUERYResult[number];

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [hoveredImageIndex, setHoveredImageIndex] = useState<number | null>(
    null,
  );

  const images = product.images ?? [];
  const mainImageUrl = images[0]?.asset?.url;
  const displayedImageUrl =
    hoveredImageIndex !== null
      ? images[hoveredImageIndex]?.asset?.url
      : mainImageUrl;

  const stock = product.stock ?? 0;
  const isOutOfStock = stock <= 0;
  const hasMultipleImages = images.length > 1;

  return (
    <Card className="group overflow-hidden border-zinc-200 bg-white transition-all hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-900">
          {displayedImageUrl ? (
            <Image
              src={displayedImageUrl}
              alt={product.name ?? "Product image"}
              fill
              className="object-cover transition-all duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-400">
              No image
            </div>
          )}
          {isOutOfStock && (
            <Badge variant="destructive" className="absolute right-2 top-2">
              Out of Stock
            </Badge>
          )}
        </div>
      </Link>

      {/* Thumbnail strip - only show if multiple images */}
      {hasMultipleImages && (
        <div className="flex gap-1 border-t border-zinc-100 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-900">
          {images.map((image, index) => (
            <button
              key={image._key ?? index}
              type="button"
              className={cn(
                "relative h-12 flex-1 overflow-hidden rounded-md transition-all",
                hoveredImageIndex === index
                  ? "ring-2 ring-zinc-900 dark:ring-zinc-100"
                  : "opacity-60 hover:opacity-100",
              )}
              onMouseEnter={() => setHoveredImageIndex(index)}
              onMouseLeave={() => setHoveredImageIndex(null)}
            >
              {image.asset?.url && (
                <Image
                  src={image.asset.url}
                  alt={`${product.name} - view ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              )}
            </button>
          ))}
        </div>
      )}

      <CardContent className="p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-1 font-medium text-zinc-900 transition-colors hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300">
            {product.name}
          </h3>
        </Link>
        {product.category && (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {product.category.title}
          </p>
        )}
        <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          £{(product.price ?? 0).toFixed(2)}
        </p>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 p-4 pt-0">
        <StockBadge productId={product._id} stock={stock} className="mx-auto" />
        <AddToCartButton
          productId={product._id}
          name={product.name ?? "Unknown Product"}
          price={product.price ?? 0}
          image={mainImageUrl ?? undefined}
          stock={stock}
        />
      </CardFooter>
    </Card>
  );
}

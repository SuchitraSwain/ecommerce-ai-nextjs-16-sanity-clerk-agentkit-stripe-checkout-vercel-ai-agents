"use client";

import Image from "next/image";
import Link from "next/link";
import { AlertCircle, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartActions } from "@/lib/store/cart-store-provider";
import { cn } from "@/lib/utils";
import type { CartItem as CartItemType } from "@/lib/store/cart-store";
import type { StockInfo } from "@/lib/hooks/useCartStock";

interface CartItemProps {
  item: CartItemType;
  stockInfo?: StockInfo;
}

export function CartItem({ item, stockInfo }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartActions();

  const isOutOfStock = stockInfo?.isOutOfStock ?? false;
  const exceedsStock = stockInfo?.exceedsStock ?? false;
  const currentStock = stockInfo?.currentStock ?? Infinity;
  const hasIssue = isOutOfStock || exceedsStock;

  // At max stock (can't add more)
  const atMaxStock =
    !isOutOfStock && !exceedsStock && item.quantity >= currentStock;

  // Low stock warning (3 or fewer remaining after this purchase)
  const remainingAfterPurchase = currentStock - item.quantity;
  const isLowStock =
    !isOutOfStock &&
    !exceedsStock &&
    currentStock <= 3 &&
    remainingAfterPurchase >= 0;

  return (
    <div
      className={cn(
        "flex gap-4 py-4",
        hasIssue && "rounded-lg bg-red-50 p-3 dark:bg-red-950/30",
      )}
    >
      {/* Image */}
      <div
        className={cn(
          "relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800",
          isOutOfStock && "opacity-50",
        )}
      >
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-400">
            No image
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col">
        <div className="flex justify-between">
          <Link
            href={`/products/${item.productId}`}
            className={cn(
              "font-medium text-zinc-900 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300",
              isOutOfStock && "text-zinc-400 dark:text-zinc-500",
            )}
          >
            {item.name}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-red-500"
            onClick={() => removeItem(item.productId)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Remove {item.name}</span>
          </Button>
        </div>

        <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
          £{item.price.toFixed(2)}
        </p>

        {/* Stock Messages */}
        {isOutOfStock && (
          <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            Sold out — please remove this item
          </div>
        )}

        {exceedsStock && !isOutOfStock && (
          <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-4 w-4" />
            {currentStock === 1
              ? "Only 1 left — please reduce to 1"
              : `Only ${currentStock} in stock — please reduce quantity`}
          </div>
        )}

        {atMaxStock && (
          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {currentStock === 1
              ? "You've got the last one!"
              : `You've got the last ${currentStock} in stock!`}
          </div>
        )}

        {isLowStock && !atMaxStock && (
          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            {currentStock === 1
              ? "Last one — grab it before it's gone!"
              : currentStock === 2
                ? "Only 2 left!"
                : `Only ${currentStock} left`}
          </div>
        )}

        {/* Quantity Controls */}
        <div className="mt-2 flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
            disabled={isOutOfStock}
          >
            <Minus className="h-3 w-3" />
            <span className="sr-only">Decrease quantity</span>
          </Button>
          <span
            className={cn(
              "w-8 text-center text-sm",
              exceedsStock && "font-medium text-amber-600 dark:text-amber-400",
            )}
          >
            {item.quantity}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
            disabled={isOutOfStock || item.quantity >= currentStock}
          >
            <Plus className="h-3 w-3" />
            <span className="sr-only">Increase quantity</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { Package, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { sanityFetch } from "@/sanity/lib/live";
import { ORDERS_BY_USER_QUERY } from "@/lib/sanity/queries/orders";
import { getOrderStatus } from "@/lib/constants/orderStatus";

export const metadata = {
  title: "Your Orders | Furniture Shop",
  description: "View your order history",
};

export default async function OrdersPage() {
  const { userId } = await auth();

  const { data: orders } = await sanityFetch({
    query: ORDERS_BY_USER_QUERY,
    params: { clerkUserId: userId ?? "" },
  });

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <Package className="mx-auto h-16 w-16 text-zinc-300 dark:text-zinc-600" />
          <h1 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            No orders yet
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            When you place an order, it will appear here.
          </p>
          <Button asChild className="mt-8">
            <Link href="/">Start Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Your Orders
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Track and manage your orders
        </p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const status = getOrderStatus(order.status);
          const StatusIcon = status.icon;
          const images = (order.itemImages ?? []).filter(Boolean).slice(0, 4);
          const extraCount = (order.itemCount ?? 0) - images.length;

          return (
            <Link
              key={order._id}
              href={`/orders/${order._id}`}
              className="group block rounded-xl border border-zinc-200 bg-white transition-all hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
            >
              <div className="flex gap-5 p-5">
                {/* Left: Product Images Stack */}
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
                  {images.length > 0 ? (
                    <div className="relative h-full w-full">
                      {images.map((imageUrl, idx) => (
                        <div
                          key={`${order._id}-img-${idx}`}
                          className="absolute overflow-hidden rounded-lg border-2 border-white bg-zinc-100 shadow-sm dark:border-zinc-900 dark:bg-zinc-800"
                          style={{
                            width: images.length === 1 ? "100%" : "56px",
                            height: images.length === 1 ? "100%" : "56px",
                            top: images.length === 1 ? 0 : `${idx * 6}px`,
                            left: images.length === 1 ? 0 : `${idx * 6}px`,
                            zIndex: images.length - idx,
                          }}
                        >
                          <Image
                            src={imageUrl as string}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>
                      ))}
                      {extraCount > 0 && (
                        <div
                          className="absolute flex items-center justify-center rounded-lg border-2 border-white bg-zinc-200 text-xs font-medium text-zinc-600 dark:border-zinc-900 dark:bg-zinc-700 dark:text-zinc-300"
                          style={{
                            width: "56px",
                            height: "56px",
                            top: `${Math.min(images.length, 3) * 6}px`,
                            left: `${Math.min(images.length, 3) * 6}px`,
                            zIndex: 0,
                          }}
                        >
                          +{extraCount}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      <ShoppingBag className="h-8 w-8 text-zinc-400" />
                    </div>
                  )}
                </div>

                {/* Right: Order Details */}
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  {/* Top: Order Info + Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        Order #{order.orderNumber?.split("-").pop()}
                      </p>
                      <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              },
                            )
                          : "Date unknown"}
                      </p>
                    </div>
                    <Badge
                      className={`${status.color} shrink-0 flex items-center gap-1`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </div>

                  {/* Bottom: Items + Total */}
                  <div className="mt-2 flex items-end justify-between">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {order.itemCount}{" "}
                      {order.itemCount === 1 ? "item" : "items"}
                    </p>
                    <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      £{(order.total ?? 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer: View Details */}
              <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
                <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                  {order.itemNames?.slice(0, 2).filter(Boolean).join(", ")}
                  {(order.itemNames?.length ?? 0) > 2 && "..."}
                </p>
                <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-zinc-500 transition-colors group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-100">
                  View order
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

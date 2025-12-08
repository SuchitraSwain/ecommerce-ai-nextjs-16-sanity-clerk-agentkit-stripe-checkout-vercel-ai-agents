"use client";

import { Suspense, useState } from "react";
import { useDocuments } from "@sanity/sdk-react";
import { ShoppingCart } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  OrderRow,
  OrderRowSkeleton,
  AdminSearch,
  useOrderSearchFilter,
} from "@/components/admin";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "paid", label: "Paid" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

interface OrderListContentProps {
  statusFilter: string;
  searchFilter?: string;
}

function OrderListContent({
  statusFilter,
  searchFilter,
}: OrderListContentProps) {
  // Combine status and search filters
  const filters: string[] = [];
  if (statusFilter !== "all") {
    filters.push(`status == "${statusFilter}"`);
  }
  if (searchFilter) {
    filters.push(`(${searchFilter})`);
  }
  const filter = filters.length > 0 ? filters.join(" && ") : undefined;

  const {
    data: orders,
    hasMore,
    loadMore,
    isPending,
  } = useDocuments({
    documentType: "order",
    filter,
    orderings: [{ field: "_createdAt", direction: "desc" }],
    batchSize: 20,
  });

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <ShoppingCart className="h-8 w-8 text-zinc-400" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          No orders found
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {searchFilter
            ? "Try adjusting your search terms."
            : statusFilter === "all"
              ? "Orders will appear here when customers make purchases."
              : `No ${statusFilter} orders at the moment.`}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead className="hidden sm:table-cell">Customer</TableHead>
              <TableHead className="hidden text-center md:table-cell">
                Items
              </TableHead>
              <TableHead className="hidden sm:table-cell">Total</TableHead>
              <TableHead className="text-center sm:text-left">Status</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((handle) => (
              <OrderRow key={handle.documentId} {...handle} />
            ))}
          </TableBody>
        </Table>
      </div>

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            onClick={() => loadMore()}
            disabled={isPending}
          >
            {isPending ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </>
  );
}

function OrderListSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead className="hidden sm:table-cell">Customer</TableHead>
            <TableHead className="hidden text-center md:table-cell">
              Items
            </TableHead>
            <TableHead className="hidden sm:table-cell">Total</TableHead>
            <TableHead className="text-center sm:text-left">Status</TableHead>
            <TableHead className="hidden md:table-cell">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3, 4, 5].map((i) => (
            <OrderRowSkeleton key={i} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { filter: searchFilter, isSearching } =
    useOrderSearchFilter(searchQuery);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          Orders
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
          Manage and track customer orders
        </p>
      </div>

      {/* Search and Tabs */}
      <div className="flex flex-col gap-4">
        <AdminSearch
          placeholder="Search by order # or email..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="w-full sm:max-w-xs"
        />
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="w-max">
              {STATUS_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="text-xs sm:text-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Order List */}
      {isSearching ? (
        <OrderListSkeleton />
      ) : (
        <Suspense
          key={`${statusFilter}-${searchFilter ?? ""}`}
          fallback={<OrderListSkeleton />}
        >
          <OrderListContent
            statusFilter={statusFilter}
            searchFilter={searchFilter}
          />
        </Suspense>
      )}
    </div>
  );
}

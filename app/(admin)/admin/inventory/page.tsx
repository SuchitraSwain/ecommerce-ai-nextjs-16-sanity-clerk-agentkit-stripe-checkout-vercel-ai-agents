"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  useDocuments,
  useApplyDocumentActions,
  createDocumentHandle,
  createDocument,
} from "@sanity/sdk-react";
import { Plus, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ProductRow,
  ProductRowSkeleton,
  AdminSearch,
  useProductSearchFilter,
} from "@/components/admin";

interface ProductListContentProps {
  filter?: string;
  onCreateProduct: () => void;
  isCreating: boolean;
}

function ProductListContent({
  filter,
  onCreateProduct,
  isCreating,
}: ProductListContentProps) {
  const {
    data: products,
    hasMore,
    loadMore,
    isPending,
  } = useDocuments({
    documentType: "product",
    filter,
    orderings: [
      { field: "stock", direction: "asc" },
      { field: "name", direction: "asc" },
    ],
    batchSize: 20,
  });

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Package className="h-8 w-8 text-zinc-400" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {filter ? "No products found" : "No products yet"}
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {filter
            ? "Try adjusting your search terms."
            : "Get started by adding your first product."}
        </p>
        {!filter && (
          <Button
            onClick={onCreateProduct}
            disabled={isCreating}
            className="mt-4"
          >
            {isCreating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Add Product
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-16 sm:table-cell">Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="hidden w-28 md:table-cell">Price</TableHead>
              <TableHead className="hidden w-28 md:table-cell">Stock</TableHead>
              <TableHead className="hidden w-16 lg:table-cell">
                Featured
              </TableHead>
              <TableHead className="hidden w-[140px] text-right sm:table-cell">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((handle) => (
              <ProductRow key={handle.documentId} {...handle} />
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

function ProductListSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="hidden w-16 sm:table-cell">Image</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="hidden w-28 md:table-cell">Price</TableHead>
            <TableHead className="hidden w-28 md:table-cell">Stock</TableHead>
            <TableHead className="hidden w-16 lg:table-cell">
              Featured
            </TableHead>
            <TableHead className="hidden w-[140px] text-right sm:table-cell">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3, 4, 5].map((i) => (
            <ProductRowSkeleton key={i} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function InventoryContent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const { filter, isSearching } = useProductSearchFilter(searchQuery);
  const apply = useApplyDocumentActions();

  const handleCreateProduct = () => {
    startTransition(async () => {
      const newDocHandle = createDocumentHandle({
        documentId: crypto.randomUUID(),
        documentType: "product",
      });
      await apply(createDocument(newDocHandle));
      router.push(`/admin/inventory/${newDocHandle.documentId}`);
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            Inventory
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
            Manage your product stock and pricing
          </p>
        </div>
        <Button
          onClick={handleCreateProduct}
          disabled={isPending}
          className="w-full sm:w-auto"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          New Product
        </Button>
      </div>

      {/* Search */}
      <AdminSearch
        placeholder="Search products..."
        value={searchQuery}
        onChange={setSearchQuery}
        className="w-full sm:max-w-sm"
      />

      {/* Product List */}
      {isSearching ? (
        <ProductListSkeleton />
      ) : (
        <Suspense fallback={<ProductListSkeleton />}>
          <ProductListContent
            filter={filter}
            onCreateProduct={handleCreateProduct}
            isCreating={isPending}
          />
        </Suspense>
      )}
    </div>
  );
}

export default function InventoryPage() {
  return <InventoryContent />;
}

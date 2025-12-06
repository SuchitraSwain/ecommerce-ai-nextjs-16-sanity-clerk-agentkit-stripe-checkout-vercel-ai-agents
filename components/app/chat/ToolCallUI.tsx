import { Search, CheckCircle2, Loader2 } from "lucide-react";
import type { ToolCallPart } from "./types";
import type { SearchProductsResult } from "@/lib/ai/types";
import { getToolDisplayName } from "./utils";
import { ProductCardWidget } from "./ProductCardWidget";

interface ToolCallUIProps {
  toolPart: ToolCallPart;
  closeChat: () => void;
}

export function ToolCallUI({ toolPart, closeChat }: ToolCallUIProps) {
  const toolName = toolPart.toolName || toolPart.type.replace("tool-", "");
  const displayName = getToolDisplayName(toolName);

  // Check for completion
  const isComplete =
    toolPart.state === "result" ||
    toolPart.result !== undefined ||
    toolPart.output !== undefined;

  const searchQuery =
    toolName === "searchProducts" && toolPart.args?.query
      ? String(toolPart.args.query)
      : undefined;

  // Get product results if available
  const result = (toolPart.result || toolPart.output) as SearchProductsResult;

  const hasProducts =
    result?.found && result.products && result.products.length > 0;

  return (
    <div className="space-y-2">
      {/* Tool status indicator */}
      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <Search className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div
          className={`flex items-center gap-3 rounded-xl px-4 py-2 text-sm ${
            isComplete
              ? "bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
              : "bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
          }`}
        >
          {isComplete ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <Loader2 className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-spin shrink-0" />
          )}
          <div className="flex flex-col">
            <span
              className={`font-medium ${
                isComplete
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-amber-700 dark:text-amber-300"
              }`}
            >
              {isComplete ? `${displayName} complete` : `${displayName}...`}
            </span>
            {searchQuery && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Query: &quot;{searchQuery}&quot;
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Product results */}
      {hasProducts && result.products && (
        <div className="ml-11 mt-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
            {result.products.length} product
            {result.products.length !== 1 ? "s" : ""} found
          </p>
          <div className="space-y-2">
            {result.products.map((product) => (
              <ProductCardWidget
                key={product.id}
                product={product}
                onClose={closeChat}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

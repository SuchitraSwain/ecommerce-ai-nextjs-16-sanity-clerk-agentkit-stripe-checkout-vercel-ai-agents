import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createSelectors } from "./createSelectors";
import useStore from "./useStore";

// Types for cart items
export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartState {
  // State
  items: CartItem[];
  isOpen: boolean;

  // Computed (as functions for selectors)
  totalItems: number;
  totalPrice: number;

  // Actions
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const useCartStoreBase = create<CartState>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      isOpen: false,

      // Computed values (recalculated on access)
      get totalItems() {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
      get totalPrice() {
        return get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
      },

      // Actions
      addItem: (item) =>
        set((state) => {
          const existingItem = state.items.find(
            (i) => i.productId === item.productId
          );

          if (existingItem) {
            // Increment quantity if item exists
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }

          // Add new item with quantity 1
          return {
            items: [...state.items, { ...item, quantity: 1 }],
          };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      updateQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            // Remove item if quantity is 0 or less
            return {
              items: state.items.filter((i) => i.productId !== productId),
            };
          }

          return {
            items: state.items.map((i) =>
              i.productId === productId ? { ...i, quantity } : i
            ),
          };
        }),

      clearCart: () => set({ items: [] }),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: "cart-storage", // localStorage key
      partialize: (state) => ({ items: state.items }), // Only persist items, not UI state
    }
  )
);

// Export store with auto-generated selectors
export const useCartStore = createSelectors(useCartStoreBase);

// ============================================
// SSR-Safe Hooks (use these in Next.js components)
// ============================================

/**
 * SSR-safe cart items hook
 * Returns undefined on server, actual items after hydration
 * @see https://zustand.docs.pmnd.rs/integrations/persisting-store-data#usage-in-next.js
 */
export const useCartItems = () =>
  useStore(useCartStore, (state) => state.items);

/**
 * SSR-safe total items count
 * Returns undefined on server, actual count after hydration
 */
export const useTotalItems = () =>
  useStore(useCartStore, (state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  );

/**
 * SSR-safe total price
 * Returns undefined on server, actual price after hydration
 */
export const useTotalPrice = () =>
  useStore(useCartStore, (state) =>
    state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

/**
 * SSR-safe cart open state
 * Returns undefined on server, actual state after hydration
 */
export const useCartIsOpen = () =>
  useStore(useCartStore, (state) => state.isOpen);

// ============================================
// Direct Selectors (use for actions, not persisted state)
// ============================================

/**
 * Type-safe selector for finding a specific cart item
 * Safe to use directly as it's derived from items
 */
export const useCartItem = (productId: string) =>
  useStore(useCartStore, (state) =>
    state.items.find((i) => i.productId === productId)
  );

/**
 * Get cart actions (safe to use directly - not persisted)
 */
export const useCartActions = () => ({
  addItem: useCartStore.use.addItem(),
  removeItem: useCartStore.use.removeItem(),
  updateQuantity: useCartStore.use.updateQuantity(),
  clearCart: useCartStore.use.clearCart(),
  toggleCart: useCartStore.use.toggleCart(),
  openCart: useCartStore.use.openCart(),
  closeCart: useCartStore.use.closeCart(),
});

import { CartStoreProvider } from "@/lib/store/cart-store-provider";
import { ChatStoreProvider } from "@/lib/store/chat-store-provider";
import { ClerkProviderWrapper } from "@/components/providers/ClerkProviderWrapper";
import { SanityLive, sanityFetch } from "@/sanity/lib/live";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/app/Header";
import { CartSheet } from "@/components/app/CartSheet";
import { ChatSheet } from "@/components/app/ChatSheet";
import { AppShell } from "@/components/app/AppShell";
import { SITE_SETTINGS_QUERY } from "@/lib/sanity/queries/siteSettings";

async function AppLayout({ children }: { children: React.ReactNode }) {
  // Fetch site settings
  const { data: siteSettings } = await sanityFetch({
    query: SITE_SETTINGS_QUERY,
  });

  const content = (
    <CartStoreProvider>
      <ChatStoreProvider>
        <AppShell>
          <Header storeName={siteSettings?.storeName ?? "Luna & Sol"} />
          <main>{children}</main>
        </AppShell>
        <CartSheet />
        <ChatSheet />
        <Toaster position="bottom-center" />
        <SanityLive />
      </ChatStoreProvider>
    </CartStoreProvider>
  );

  // Always wrap with ClerkProviderWrapper to allow hooks to work
  // It will handle invalid keys gracefully
  return <ClerkProviderWrapper>{content}</ClerkProviderWrapper>;
}

export default AppLayout;

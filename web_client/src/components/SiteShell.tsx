"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { ConfigProvider } from "antd";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdminDesktopShell from "@/components/AdminDesktopShell";
import { ModalProvider } from "@/app/context/QuickViewModalContext";
import { CartModalProvider } from "@/app/context/CartSidebarModalContext";
import { WishlistModalProvider } from "@/app/context/WishlistSidebarModalContext";
import { TenantProvider, useTenant } from "@/app/context/TenantContext";
import { ReduxProvider } from "@/redux/provider";
import QuickViewModal from "@/components/Common/QuickViewModal";
import CartSidebarModal from "@/components/Common/CartSidebarModal";
import WishlistSidebarModal from "@/components/Common/WishlistSidebarModal";
import { PreviewSliderProvider } from "@/app/context/PreviewSliderContext";
import PreviewSliderModal from "@/components/Common/PreviewSlider";
import { GoogleOAuthProvider } from "@react-oauth/google";
import LoaderOverlay from "@/components/Common/LoaderOverlay";
import { usePathname } from "next/navigation";
import { subscribeApiLoader } from "@/http/apiLoader";
import ScrollToTop from "@/components/Common/ScrollToTop";
import CartSync from "@/components/Common/CartSync";
import WishlistSync from "@/components/Common/WishlistSync";
import ServerOfflineBanner from "@/components/Common/ServerOfflineBanner";
import RateLimitBanner from "@/components/Common/RateLimitBanner";
import ChatbotAssistant from "@/components/Common/ChatbotAssistant";
import ButtonLoaderManager from "@/components/Common/ButtonLoaderManager";
import { DEFAULT_TENANT, type PublicTenant } from "@/lib/theme";

function SiteShellInner({ children }: { children: React.ReactNode }) {
  const { branding, tenant } = useTenant();
  // Keep initial SSR/hydration paint unblocked for fast LCP and crawler visibility
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const [pageLoading, setPageLoading] = useState(false);
  const pathname = usePathname();
  const hasNavigatedRef = useRef(false);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPageLoadingRef = useRef(false);
  const [pendingGetRequests, setPendingGetRequests] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeApiLoader(setPendingGetRequests);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      ) {
        return;
      }

      try {
        const targetUrl = new URL(anchor.href, window.location.href);
        if (
          targetUrl.origin === window.location.origin &&
          targetUrl.pathname !== window.location.pathname
        ) {
          isPageLoadingRef.current = true;
          setPageLoading(true);
          setShowLoader(true);
          if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
          }
        }
      } catch (err) {}
    };

    document.addEventListener("click", handleLinkClick, true);
    return () => {
      document.removeEventListener("click", handleLinkClick, true);
    };
  }, []);

  useEffect(() => {
    if (!hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      return;
    }

    isPageLoadingRef.current = true;
    setPageLoading(true);
    setShowLoader(true);

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (navTimerRef.current) {
      clearTimeout(navTimerRef.current);
    }
    navTimerRef.current = setTimeout(() => {
      setPageLoading(false);
    }, 350);

    return () => {
      if (navTimerRef.current) {
        clearTimeout(navTimerRef.current);
      }
    };
  }, [pathname]);

  useEffect(() => {
    if (!isPageLoadingRef.current) {
      return;
    }

    if (!pageLoading && pendingGetRequests === 0) {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      hideTimerRef.current = setTimeout(() => {
        isPageLoadingRef.current = false;
        setShowLoader(false);
        hideTimerRef.current = null;
      }, 250);
    }

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [pendingGetRequests, pageLoading]);

  useEffect(() => {
    return () => {
      if (navTimerRef.current) {
        clearTimeout(navTimerRef.current);
      }
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: branding.primaryColor || "#3C50E0",
          borderRadius: 12,
        },
      }}
    >
      {showLoader && <LoaderOverlay message={"Loading..."} />}
      {!tenant.isDefault && (
        <div
          className="w-full px-4 py-1.5 text-center text-xs font-medium text-white"
          style={{ backgroundColor: branding.primaryDarkColor || branding.primaryColor }}
        >
          <span>
            Viewing store <strong>{branding.storeName}</strong> (<code>/s/{tenant.slug}</code>)
          </span>
          <a
            href="/?tenant=smk"
            className="ml-3 inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold text-white transition hover:bg-white/30"
          >
            Switch to Main Platform
          </a>
        </div>
      )}
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
        <ReduxProvider>
          <CartSync />
          <WishlistSync />
          <CartModalProvider>
            <WishlistModalProvider>
              <ModalProvider>
                <PreviewSliderProvider>
                  <ServerOfflineBanner />
                  <RateLimitBanner />
                  <Header />
                  <main className="relative min-h-[70vh] bg-transparent">
                    <Suspense fallback={null}>
                      <AdminDesktopShell>{children}</AdminDesktopShell>
                    </Suspense>
                  </main>

                  <QuickViewModal />
                  <CartSidebarModal />
                  <WishlistSidebarModal />
                  <PreviewSliderModal />
                </PreviewSliderProvider>
              </ModalProvider>
            </WishlistModalProvider>
          </CartModalProvider>
        </ReduxProvider>
      </GoogleOAuthProvider>
      <ScrollToTop />
      <Footer />
      <ChatbotAssistant />
      <ButtonLoaderManager />
    </ConfigProvider>
  );
}

export default function SiteShell({
  children,
  initialTenant = DEFAULT_TENANT,
}: {
  children: React.ReactNode;
  initialTenant?: PublicTenant;
}) {
  return (
    <TenantProvider initialTenant={initialTenant}>
      <SiteShellInner>{children}</SiteShellInner>
    </TenantProvider>
  );
}

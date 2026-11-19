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
import { usePathname, useRouter } from "next/navigation";
import { withTenantPath } from "@/lib/tenantUrl";
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
  const { branding, basePath } = useTenant();
  const router = useRouter();
  // Keep initial SSR/hydration paint unblocked for fast LCP and crawler visibility
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const [pageLoading, setPageLoading] = useState(false);
  const pathname = usePathname();
  const hasNavigatedRef = useRef(false);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPageLoadingRef = useRef(false);
  const [pendingGetRequests, setPendingGetRequests] = useState(0);
  const [unavailableCode, setUnavailableCode] = useState<
    "TENANT_SUSPENDED" | "TENANT_NOT_FOUND" | null
  >(null);

  useEffect(() => {
    const unsubscribe = subscribeApiLoader(setPendingGetRequests);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleTenantUnavailable = (event: Event) => {
      const code = (event as CustomEvent)?.detail?.code;
      if (code === "TENANT_SUSPENDED" || code === "TENANT_NOT_FOUND") {
        setUnavailableCode(code);
        setShowLoader(false);
      }
    };
    window.addEventListener("tenant:unavailable", handleTenantUnavailable);
    return () => {
      window.removeEventListener("tenant:unavailable", handleTenantUnavailable);
    };
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
        if (targetUrl.origin === window.location.origin) {
          // Safeguard: when inside a path-scoped tenant store (/s/<slug>),
          // ensure no relative link can accidentally drop the tenant prefix.
          if (
            basePath &&
            !anchor.hasAttribute("data-no-tenant-prefix") &&
            targetUrl.pathname !== basePath &&
            !targetUrl.pathname.startsWith(`${basePath}/`) &&
            !targetUrl.pathname.startsWith("/s/") &&
            !e.metaKey &&
            !e.ctrlKey &&
            !e.shiftKey &&
            !e.altKey &&
            e.button === 0
          ) {
            e.preventDefault();
            e.stopPropagation();
            const scoped = withTenantPath(
              `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`,
              basePath
            );
            isPageLoadingRef.current = true;
            setPageLoading(true);
            setShowLoader(true);
            if (hideTimerRef.current) {
              clearTimeout(hideTimerRef.current);
              hideTimerRef.current = null;
            }
            router.push(scoped);
            return;
          }

          if (targetUrl.pathname !== window.location.pathname) {
            isPageLoadingRef.current = true;
            setPageLoading(true);
            setShowLoader(true);
            if (hideTimerRef.current) {
              clearTimeout(hideTimerRef.current);
              hideTimerRef.current = null;
            }
          }
        }
      } catch (err) {}
    };

    document.addEventListener("click", handleLinkClick, true);
    return () => {
      document.removeEventListener("click", handleLinkClick, true);
    };
  }, [basePath, router]);

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

  if (unavailableCode) {
    const isSuspended = unavailableCode === "TENANT_SUSPENDED";
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-16 text-slate-900">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
            {isSuspended ? "⏸️" : "🔍"}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isSuspended ? "Store Currently Unavailable" : "Store Not Found"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {isSuspended
              ? "This storefront has been temporarily paused by its administrator. Please check back later."
              : "The store link you visited does not exist or may have changed."}
          </p>
        </div>
      </main>
    );
  }

  const isPlatformAdminRoute =
    pathname === "/platform-admin" ||
    pathname?.startsWith("/platform-admin/") ||
    pathname === "/launch" ||
    pathname?.startsWith("/launch/");

  if (isPlatformAdminRoute) {
    return (
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#3C50E0",
            borderRadius: 12,
          },
        }}
      >
        {showLoader && <LoaderOverlay message={"Loading..."} />}
        <main className="min-h-screen bg-slate-100 text-slate-900">
          {children}
        </main>
        <ButtonLoaderManager />
      </ConfigProvider>
    );
  }

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
  initialBasePath = "",
}: {
  children: React.ReactNode;
  initialTenant?: PublicTenant;
  initialBasePath?: string;
}) {
  return (
    <TenantProvider initialTenant={initialTenant} initialBasePath={initialBasePath}>
      <SiteShellInner>{children}</SiteShellInner>
    </TenantProvider>
  );
}

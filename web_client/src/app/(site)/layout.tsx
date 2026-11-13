"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import "../css/euclid-circular-a-font.css";
import "../css/style.css";
import "react-image-crop/dist/ReactCrop.css";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import AdminDesktopShell from "@/components/AdminDesktopShell";

import { ModalProvider } from "../context/QuickViewModalContext";
import { CartModalProvider } from "../context/CartSidebarModalContext";
import { WishlistModalProvider } from "../context/WishlistSidebarModalContext";
import { ReduxProvider } from "@/redux/provider";
import QuickViewModal from "@/components/Common/QuickViewModal";
import CartSidebarModal from "@/components/Common/CartSidebarModal";
import WishlistSidebarModal from "@/components/Common/WishlistSidebarModal";
import { PreviewSliderProvider } from "../context/PreviewSliderContext";
import PreviewSliderModal from "@/components/Common/PreviewSlider";
import { GoogleOAuthProvider } from '@react-oauth/google';
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showLoader, setShowLoader] = useState<boolean>(true);
  const [pageLoading, setPageLoading] = useState(false);
  const pathname = usePathname();
  const hasNavigatedRef = useRef(false);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPageLoadingRef = useRef(true); // true on initial mount and when navigating to new pages
  const [pendingGetRequests, setPendingGetRequests] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeApiLoader(setPendingGetRequests);
    return unsubscribe;
  }, []);

  // Listen for clicks on navigation links to trigger global loader immediately on page navigation
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

  // Trigger global loader when pathname changes (new page loaded / route transition)
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

  // Global loader is shown for initial mount and when loading a new page until settled
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
    <html lang="en" suppressHydrationWarning={true}>
      <body className="bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_24%),linear-gradient(180deg,#ffffff_0%,#f6faff_100%)] pb-[calc(6rem+env(safe-area-inset-bottom))] text-dark xl:pb-0">
        {showLoader && <LoaderOverlay message={"Loading..."} />}
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
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
      </body>
    </html>
  );
}

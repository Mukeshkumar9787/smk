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
import ChatbotAssistant from "@/components/Common/ChatbotAssistant";

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
  const isInitialMountRef = useRef(true);
  const [pendingGetRequests, setPendingGetRequests] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeApiLoader(setPendingGetRequests);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      return;
    }
    setPageLoading(true);
    if (navTimerRef.current) {
      clearTimeout(navTimerRef.current);
    }
    navTimerRef.current = setTimeout(() => setPageLoading(false), 300);
    return () => {
      if (navTimerRef.current) {
        clearTimeout(navTimerRef.current);
      }
    };
  }, [pathname]);

  // Synchronize showLoader with pending requests and page transitions using a debounce buffer
  useEffect(() => {
    const isBusy = pendingGetRequests > 0 || pageLoading;

    if (isBusy) {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      setShowLoader(true);
    } else {
      // Grace period to bridge micro-gaps between consecutive or chained API requests
      const delay = isInitialMountRef.current ? 350 : 250;
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      hideTimerRef.current = setTimeout(() => {
        isInitialMountRef.current = false;
        setShowLoader(false);
        hideTimerRef.current = null;
      }, delay);
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
      </body>
    </html>
  );
}

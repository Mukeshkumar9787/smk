"use client";

import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

interface ActiveElementInfo {
  ring: HTMLElement;
  reqIds: Set<number>;
  maxTimeout: ReturnType<typeof setTimeout>;
}

export default function ButtonLoaderManager() {
  const pathname = usePathname();
  // Elements currently showing the loading ring
  const activeElementsRef = useRef<Map<HTMLElement, ActiveElementInfo>>(new Map());
  // The most recent button or add-to-cart section clicked by the user
  const pendingClickRef = useRef<{ element: HTMLElement; timestamp: number } | null>(null);

  // Clean up all active loaders and pending clicks on route navigation
  useEffect(() => {
    pendingClickRef.current = null;
    activeElementsRef.current.forEach(({ ring, maxTimeout }, element) => {
      clearTimeout(maxTimeout);
      try {
        ring.remove();
        element.classList.remove("btn-loading-around");
        delete element.dataset.btnLoading;
      } catch (e) {}
    });
    activeElementsRef.current.clear();
  }, [pathname]);

  useEffect(() => {
    // 1. Capture click on any button or inside an Add-to-Cart section
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Check if click is inside an Add-to-Cart controller section (covers +, -, count, and whole section)
      const addCartSection = target.closest(
        '[data-add-to-cart-section="true"], .add-to-cart-section'
      ) as HTMLElement | null;

      // Or a standard interactive button / submit input
      const button = target.closest(
        "button, [role='button'], a.btn, a.btn-primary, a.btn-danger, input[type='submit'], input[type='button']"
      ) as HTMLElement | null;

      // For Add to Cart, always prioritize loading the WHOLE add to cart section rather than just plus/minus
      const targetElement = addCartSection || button;
      if (!targetElement) return;

      // If already loading or disabled or explicitly opts out, ignore
      if (
        targetElement.hasAttribute("disabled") ||
        targetElement.getAttribute("aria-disabled") === "true" ||
        targetElement.dataset.noButtonLoader === "true" ||
        targetElement.classList.contains("no-button-loader") ||
        targetElement.dataset.btnLoading === "true"
      ) {
        return;
      }

      // Record as candidate. We DO NOT add a loader yet!
      // Loader is ONLY attached if an API call starts from this click.
      pendingClickRef.current = {
        element: targetElement,
        timestamp: Date.now(),
      };
    };

    // 2. An API request was initiated!
    const handleReqStart = (e: Event) => {
      const customEvent = e as CustomEvent<{ reqId?: number }>;
      const reqId = customEvent.detail?.reqId || Date.now();
      const now = Date.now();
      const pending = pendingClickRef.current;

      // Only attach loader if a button/section was clicked within the last 350ms
      if (!pending || now - pending.timestamp > 350) {
        return;
      }

      const element = pending.element;
      // Clear pending click now that it's matched with an API request
      pendingClickRef.current = null;

      if (!element || !element.isConnected) {
        return;
      }

      // If this element already has an active loader, just associate the new reqId
      const existing = activeElementsRef.current.get(element);
      if (existing) {
        existing.reqIds.add(reqId);
        return;
      }

      // Calculate border-radius and dimensions for SVG ring
      const computed = window.getComputedStyle(element);
      const pos = computed.position;
      if (pos === "static" || !pos) {
        element.style.position = "relative";
      }

      const rawRadius = parseFloat(computed.borderRadius) || 10;
      const isPill = rawRadius > 24 || element.classList.contains("rounded-full");
      const rx = isPill ? 999 : Math.min(rawRadius + 2, 28);

      element.dataset.btnLoading = "true";
      element.classList.add("btn-loading-around");

      const ring = document.createElement("div");
      ring.className = "btn-perimeter-loader-wrapper";
      ring.setAttribute("aria-hidden", "true");
      ring.innerHTML = `
        <svg class="btn-loader-ring-svg" xmlns="http://www.w3.org/2000/svg">
          <rect x="1.5" y="1.5" width="calc(100% - 3px)" height="calc(100% - 3px)" rx="${rx}" class="btn-loader-ring-rect" />
        </svg>
        <span class="btn-loader-spinner-badge">
          <span class="btn-loader-spinner-inner"></span>
        </span>
      `;

      element.appendChild(ring);

      // Safety fallback timer: max 15 seconds in case of extreme network timeout
      const maxTimeout = setTimeout(() => {
        try {
          ring.remove();
          element.classList.remove("btn-loading-around");
          delete element.dataset.btnLoading;
          activeElementsRef.current.delete(element);
        } catch (e) {}
      }, 15000);

      const reqIds = new Set<number>();
      reqIds.add(reqId);

      activeElementsRef.current.set(element, {
        ring,
        reqIds,
        maxTimeout,
      });
    };

    // 3. An API request returned (success or failure)
    const handleReqEnd = (e: Event) => {
      const customEvent = e as CustomEvent<{ reqId?: number }>;
      const reqId = customEvent.detail?.reqId;

      activeElementsRef.current.forEach((info, element) => {
        if (reqId) {
          info.reqIds.delete(reqId);
        } else {
          info.reqIds.clear();
        }

        // When all API requests for this element have returned, remove the loader!
        if (info.reqIds.size === 0) {
          clearTimeout(info.maxTimeout);
          info.ring.classList.add("fade-out");
          setTimeout(() => {
            try {
              info.ring.remove();
              element.classList.remove("btn-loading-around");
              delete element.dataset.btnLoading;
              activeElementsRef.current.delete(element);
            } catch (err) {}
          }, 180);
        }
      });
    };

    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("app-api-request-start", handleReqStart);
    window.addEventListener("app-api-request-end", handleReqEnd);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("app-api-request-start", handleReqStart);
      window.removeEventListener("app-api-request-end", handleReqEnd);
    };
  }, []);

  return null;
}

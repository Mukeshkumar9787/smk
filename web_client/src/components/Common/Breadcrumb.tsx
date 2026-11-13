"use client";

import Link from "next/link";
import React from "react";
import { getLoggedInUserData, getStoredToken } from "@/utils/helper";
import { ROLE_TYPES } from "@/utils/constants";

const PATH_BY_LABEL = {
  "shop": "/shop",
  "shop details": "/shop-details",
  "shop without sidebar": "/shop-without-sidebar",
  "checkout": "/checkout",
  "cart": "/cart",
  "wishlist": "/wishlist",
  "my account": "/my-account",
  "signin": "/signin",
  "signin with otp": "/signin-otp",
  "signup": "/signup",
  "reset password": "/reset-password",
  "contact": "/contact",
  "order": "/orders",
  "orders": "/orders",
  "users": "/users",
  "config": "/config",
  "product": "/product",
  "category": "/category",
  "color": "/color",
  "size": "/size",
  "hsn": "/hsn",
  "error": "/error",
  "mailsuccess": "/mail-success",
  "blog grid": "/blogs/blog-grid",
  "blog grid sidebar": "/blogs/blog-grid-with-sidebar",
  "blog details": "/blogs/blog-details",
  "blog details sidebar": "/blogs/blog-details-with-sidebar",
};

const normalizeLabel = (value) => (value || "").toString().replaceAll("/", "").trim();

const getHrefForLabel = (label) => {
  const normalized = normalizeLabel(label).toLowerCase();
  if (!normalized) return "";
  if (PATH_BY_LABEL[normalized]) return PATH_BY_LABEL[normalized];
  return `/${normalized.replace(/\s+/g, "-")}`;
};

const Breadcrumb = ({
  title,
  pages,
  adminOnly = true,
  variant = "default",
  showTitle = true,
  className = "",
  tone = "default",
}) => {
  const [canRender, setCanRender] = React.useState(false);

  React.useEffect(() => {
    if (!adminOnly) {
      setCanRender(false);
      return;
    }

    let isMounted = true;

    const validateAdmin = async () => {
      if (!getStoredToken()) {
        if (isMounted) setCanRender(false);
        return;
      }

      const user = await getLoggedInUserData();
      if (isMounted) {
        setCanRender(user?.role === ROLE_TYPES.ADMIN);
      }
    };

    setCanRender(false);
    validateAdmin();

    return () => {
      isMounted = false;
    };
  }, [adminOnly]);

  const isInline = variant === "inline";
  const isLightTone = tone === "light";
  const rootLabel = adminOnly ? "Dashboard" : "Home";
  const rootHref = adminOnly ? "/dashboard" : "/";

  const breadcrumbPages = (pages || [])
    .map((page) => {
      if (typeof page === "string") {
        return { label: normalizeLabel(page), href: getHrefForLabel(page) };
      }
      return {
        label: normalizeLabel(page?.label || ""),
        href: page?.href || getHrefForLabel(page?.label || ""),
      };
    })
    .filter((page) => page.label);

  if (!canRender) return null;

  const breadcrumbList = (
    <ul className={`flex items-center gap-2 text-custom-sm flex-wrap ${isInline ? (isLightTone ? "text-sky-100" : "text-slate-500") : ""}`}>
      <li className={isInline ? (isLightTone ? "text-sky-100/80 hover:text-white" : "text-slate-500 hover:text-sky-700") : "text-dark-4 hover:text-blue"}>
        <Link href={rootHref}>{rootLabel}</Link>
      </li>
      {breadcrumbPages.map((page, key) => {
        const isLast = key === breadcrumbPages.length - 1;
        return (
          <React.Fragment key={`${page.label}-${key}`}>
            <li className={isInline ? (isLightTone ? "text-sky-100/50" : "text-slate-400") : "text-dark-4"}>/</li>
            <li
              className={`capitalize ${
                isInline
                  ? isLast
                    ? isLightTone
                      ? "font-medium text-white"
                      : "font-medium text-slate-950"
                    : isLightTone
                      ? "text-sky-100/80 hover:text-white"
                      : "text-slate-500 hover:text-sky-700"
                  : isLast
                    ? "text-blue"
                    : "text-dark-4 hover:text-blue"
              }`}
            >
              {!isLast ? <Link href={page.href}>{page.label}</Link> : page.label}
            </li>
          </React.Fragment>
        );
      })}
    </ul>
  );

  if (isInline) {
    return (
      <div className={className}>
        {showTitle && (
          <h1 className="font-semibold text-dark text-xl sm:text-2xl">
            {title}
          </h1>
        )}
        {breadcrumbList}
      </div>
    );
  }

  return (
    <div className={`overflow-hidden bg-transparent ${className}`}>
      <div>
        <div className="max-w-[1170px] w-full mx-auto px-4 pb-0 pt-5 sm:px-8 xl:px-0 xl:pb-0 xl:pt-8">
          <div className="surface-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 sm:px-6">
            {showTitle && (
              <h1 className="font-semibold text-dark text-xl sm:text-2xl">
                {title}
              </h1>
            )}
            {breadcrumbList}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Breadcrumb;

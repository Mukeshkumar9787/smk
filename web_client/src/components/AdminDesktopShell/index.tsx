"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminMenuData } from "@/components/Header/menuData";
import { getLoggedInUserData, getStoredToken } from "@/utils/helper";
import { ROLE_TYPES } from "@/utils/constants";
import { LAUNCH_STORE_URL, PLATFORM_ADMIN_URL } from "@/utils/appUrls";
import { useTenant } from "@/app/context/TenantContext";
import { stripTenantPrefix } from "@/lib/tenantUrl";

const adminLinks = adminMenuData.flatMap((item) => item.submenu || []);

const AdminDesktopShell = ({ children }: { children: React.ReactNode }) => {
  const rawPathname = usePathname();
  const pathname = stripTenantPrefix(rawPathname);
  const { tenant, storeHref } = useTenant();
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isPlatformAdmin, setIsPlatformAdmin] = React.useState(false);
  const allLinks = adminLinks;

  const isAdminPage = adminLinks.some((item) =>
    item.path ? pathname === item.path || pathname.startsWith(`${item.path}/`) : false
  );

  if (
    pathname === PLATFORM_ADMIN_URL ||
    pathname.startsWith(`${PLATFORM_ADMIN_URL}/`) ||
    pathname === LAUNCH_STORE_URL ||
    pathname.startsWith(`${LAUNCH_STORE_URL}/`)
  ) {
    return <>{children}</>;
  }

  React.useEffect(() => {
    const loadUser = async () => {
      if (!getStoredToken()) return;

      const user = await getLoggedInUserData();
      setIsAdmin(user?.role === ROLE_TYPES.ADMIN);
      setIsPlatformAdmin(Boolean(user?.isPlatformAdmin));
    };

    loadUser();
  }, []);

  if (!isAdmin || !isAdminPage) {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto flex max-w-[1400px] gap-6 px-4 sm:px-7.5 xl:px-8">
      <aside className="hidden xl:block xl:w-[248px] xl:flex-shrink-0">
        <div className="sticky top-28 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            Admin Manage
          </p>
          <nav className="mt-5 space-y-2">
            {allLinks.map((item) => {
              const isActive = item.path
                ? pathname === item.path || pathname.startsWith(`${item.path}/`)
                : false;

              return (
                <Link
                  key={item.path}
                  href={storeHref(item.path || "/")}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-blue text-white shadow-lg"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  <span>{item.title}</span>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isActive ? "bg-white" : "bg-slate-300"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
};

export default AdminDesktopShell;

"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  DEFAULT_TENANT,
  buildThemeCssVariables,
  type PublicTenant,
  type TenantBranding,
} from "@/lib/theme";
import { withTenantPath } from "@/lib/tenantUrl";

interface TenantContextValue {
  tenant: PublicTenant;
  branding: TenantBranding;
  basePath: string;
  storeHref: (path: string) => string;
  setTenant: React.Dispatch<React.SetStateAction<PublicTenant>>;
  updateBrandingLocally: (partial: Partial<TenantBranding>) => void;
}

const TenantContext = createContext<TenantContextValue>({
  tenant: DEFAULT_TENANT,
  branding: DEFAULT_TENANT.branding,
  basePath: "",
  storeHref: (path: string) => path,
  setTenant: () => {},
  updateBrandingLocally: () => {},
});

export function TenantProvider({
  initialTenant = DEFAULT_TENANT,
  initialBasePath = "",
  children,
}: {
  initialTenant?: PublicTenant;
  initialBasePath?: string;
  children: React.ReactNode;
}) {
  const [tenant, setTenant] = useState<PublicTenant>(initialTenant || DEFAULT_TENANT);
  const basePath = initialBasePath || "";

  useEffect(() => {
    if (initialTenant?.id) {
      setTenant(initialTenant);
    }
  }, [initialTenant]);

  // Apply live CSS variables to document root whenever branding changes
  useEffect(() => {
    if (typeof document === "undefined") return;
    const vars = buildThemeCssVariables(tenant.branding);
    const root = document.documentElement;
    for (const [key, val] of Object.entries(vars)) {
      root.style.setProperty(key, val);
    }
  }, [tenant.branding]);

  const storeHref = useCallback(
    (path: string) => withTenantPath(path, basePath),
    [basePath]
  );

  const updateBrandingLocally = (partial: Partial<TenantBranding>) => {
    setTenant((prev) => ({
      ...prev,
      name: partial.storeName || prev.name,
      branding: {
        ...prev.branding,
        ...partial,
      },
    }));
  };

  return (
    <TenantContext.Provider
      value={{
        tenant,
        branding: tenant.branding,
        basePath,
        storeHref,
        setTenant,
        updateBrandingLocally,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}

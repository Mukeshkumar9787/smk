"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  DEFAULT_TENANT,
  buildThemeCssVariables,
  type PublicTenant,
  type TenantBranding,
} from "@/lib/theme";

interface TenantContextValue {
  tenant: PublicTenant;
  branding: TenantBranding;
  setTenant: React.Dispatch<React.SetStateAction<PublicTenant>>;
  updateBrandingLocally: (partial: Partial<TenantBranding>) => void;
}

const TenantContext = createContext<TenantContextValue>({
  tenant: DEFAULT_TENANT,
  branding: DEFAULT_TENANT.branding,
  setTenant: () => {},
  updateBrandingLocally: () => {},
});

export function TenantProvider({
  initialTenant = DEFAULT_TENANT,
  children,
}: {
  initialTenant?: PublicTenant;
  children: React.ReactNode;
}) {
  const [tenant, setTenant] = useState<PublicTenant>(initialTenant || DEFAULT_TENANT);

  useEffect(() => {
    if (initialTenant?.id) {
      setTenant(initialTenant);
    }
  }, [initialTenant]);

  // Apply live CSS variables to document root whenever branding changes (e.g. in Branding Studio)
  useEffect(() => {
    if (typeof document === "undefined") return;
    const vars = buildThemeCssVariables(tenant.branding);
    const root = document.documentElement;
    for (const [key, val] of Object.entries(vars)) {
      root.style.setProperty(key, val);
    }
  }, [tenant.branding]);

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

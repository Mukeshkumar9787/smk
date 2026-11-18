import { AsyncLocalStorage } from "async_hooks";

export const DEFAULT_TENANT_ID = "tenant_smk_default";
export const DEFAULT_TENANT_SLUG = "smk";

const tenantStorage =
  globalThis.__smkTenantStorage ||
  (globalThis.__smkTenantStorage = new AsyncLocalStorage());

export function runWithTenant(tenant, callback) {
  return tenantStorage.run(
    {
      tenantId: tenant?.id || DEFAULT_TENANT_ID,
      tenantSlug: tenant?.slug || DEFAULT_TENANT_SLUG,
      tenant: tenant || null,
    },
    callback
  );
}

export function getTenantContext() {
  return tenantStorage.getStore() || null;
}

export function getCurrentTenantId() {
  return tenantStorage.getStore()?.tenantId || DEFAULT_TENANT_ID;
}

export function getCurrentTenant() {
  return tenantStorage.getStore()?.tenant || null;
}

export function requireTenantId() {
  const store = tenantStorage.getStore();
  if (!store?.tenantId) {
    return DEFAULT_TENANT_ID;
  }
  return store.tenantId;
}

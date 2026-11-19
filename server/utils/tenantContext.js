import { AsyncLocalStorage } from "async_hooks";

export const DEFAULT_TENANT_ID = "tenant_smk_default";
export const DEFAULT_TENANT_SLUG = "smk";

const tenantStorage =
  globalThis.__smkTenantStorage ||
  (globalThis.__smkTenantStorage = new AsyncLocalStorage());

export function runWithTenant(tenant, callback, userContext = {}) {
  const current = tenantStorage.getStore() || {};
  return tenantStorage.run(
    {
      ...current,
      tenantId: tenant?.id || current.tenantId || DEFAULT_TENANT_ID,
      tenantSlug: tenant?.slug || current.tenantSlug || DEFAULT_TENANT_SLUG,
      tenant: tenant || current.tenant || null,
      userId: userContext.userId !== undefined ? userContext.userId : current.userId || null,
      isStoreAdmin: userContext.isStoreAdmin !== undefined ? Boolean(userContext.isStoreAdmin) : Boolean(current.isStoreAdmin),
      bypassRls: userContext.bypassRls !== undefined ? Boolean(userContext.bypassRls) : Boolean(current.bypassRls),
    },
    callback
  );
}

export function runWithBypass(callback) {
  const current = tenantStorage.getStore() || {};
  return tenantStorage.run(
    {
      ...current,
      tenantId: current.tenantId || DEFAULT_TENANT_ID,
      tenantSlug: current.tenantSlug || DEFAULT_TENANT_SLUG,
      tenant: current.tenant || null,
      bypassRls: true,
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

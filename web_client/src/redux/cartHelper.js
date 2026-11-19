import { getTenantStorageKey } from "@/lib/tenantUrl";

// cartStorage.ts — tenant-isolated cart persistence
export const loadCartFromStorage = () => {
  try {
    const key = getTenantStorageKey("cart");
    let serializedState = localStorage.getItem(key);
    if (!serializedState && key === "tenant:smk:cart") {
      serializedState = localStorage.getItem("cart");
      if (serializedState) {
        localStorage.setItem(key, serializedState);
      }
    }
    if (!serializedState) return { items: [] };
    return JSON.parse(serializedState);
  } catch {
    return undefined;
  }
};

export const saveCartToStorage = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(getTenantStorageKey("cart"), serializedState);
  } catch {
    // ignore write errors
  }
};

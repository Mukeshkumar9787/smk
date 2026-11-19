import { getUserInfo } from "@/http/apiCalls";
import { getTenantStorageKey, withTenantPath } from "@/lib/tenantUrl";
import { DASHBOARD_URL } from "./appUrls";
import { ORDER_STATUS } from "./constants";
import { ROLE_TYPES } from "./constants";

const clearExpiredSession = () => {
  localStorage.removeItem(getTenantStorageKey("token"));
  localStorage.removeItem(getTenantStorageKey("cart"));
};

const parseJwtPayload = (token) => {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - normalizedPayload.length % 4) % 4),
      "="
    );

    return JSON.parse(window.atob(paddedPayload));
  } catch (error) {
    return null;
  }
};

export const isTokenExpired = (token) => {
  if (!token) return true;

  const payload = parseJwtPayload(token);
  if (!payload?.exp) return true;

  return payload.exp * 1000 <= Date.now();
};

export const getStoredToken = () => {
  if (typeof window === "undefined") return null;

  const isPlatformAdminRoute = window.location?.pathname?.startsWith("/platform-admin");
  const token = isPlatformAdminRoute
    ? localStorage.getItem("platform_token") || localStorage.getItem(getTenantStorageKey("token")) || localStorage.getItem("token")
    : localStorage.getItem(getTenantStorageKey("token")) || localStorage.getItem("token") || localStorage.getItem("platform_token");

  if (!token) return null;

  if (isTokenExpired(token)) {
    clearExpiredSession();
    return null;
  }

  return token;
};

export function getContrastTextColor(hexColor) {
  // Remove #
  const hex = hexColor.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // Convert to linear RGB
  const toLinear = (c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const luminance =
    0.2126 * toLinear(r) +
    0.7152 * toLinear(g) +
    0.0722 * toLinear(b);

  // WCAG recommended threshold
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

export const getCurrencyDetails = () => {
  return {
    currencyName: "Indian Rupee",
    isoCode: "INR",
    currencyCode: "Rs",
    currencySymbol: "₹"
  }
}

export const getProductCountFromCart = (id, cartItems) => cartItems.find(i => i.id === id)?.quantity || 0;

export const getLoggedInUserData = async () => {
  try {
    if (!getStoredToken()) return null;

    if (typeof window !== "undefined") {
      const isPlatformRoute =
        window.location?.pathname?.startsWith("/platform-admin") ||
        window.location?.pathname?.startsWith("/launch");
      if (isPlatformRoute) {
        const storedAdmin = localStorage.getItem("platform_admin");
        if (storedAdmin) {
          try {
            const parsed = JSON.parse(storedAdmin);
            if (parsed && parsed.isPlatformAdmin) {
              return {
                ...parsed,
                role: ROLE_TYPES.ADMIN,
                isPlatformAdmin: true,
              };
            }
          } catch {}
        }
      }
    }

    const user = await getUserInfo();
    return user.data || null;
  } catch (error) {
    if (typeof window !== "undefined") {
      const storedAdmin = localStorage.getItem("platform_admin");
      if (storedAdmin) {
        try {
          const parsed = JSON.parse(storedAdmin);
          if (parsed && parsed.isPlatformAdmin) {
            return {
              ...parsed,
              role: ROLE_TYPES.ADMIN,
              isPlatformAdmin: true,
            };
          }
        } catch {}
      }
    }
    return null;
  } 
};

export const afterSucessfullLogin = async (token) => {
  localStorage.setItem(getTenantStorageKey("token"), token);
  const nextKey = getTenantStorageKey("next");
  const next = localStorage.getItem(nextKey);
  if (next) {
    localStorage.removeItem(nextKey);
  }

  if (next) {
    window.location.href = withTenantPath(next);
    return;
  }

  try {
    const user = await getUserInfo();
    if (user?.data?.role === ROLE_TYPES.ADMIN) {
      window.location.href = withTenantPath(DASHBOARD_URL);
      return;
    }
  } catch (error) {}

  window.location.href = withTenantPath('/');
}

export const getOfferPercent = (mrp, price) => {
  if (!mrp || mrp <= 0) return 0;
  if (price >= mrp) return 0;

  const discount = mrp - price;
  const percent = (discount / mrp) * 100;

  return Math.round(percent); // or Math.floor / Math.ceil
};

export const getMemberSince = (createdAt) => {
  const date = new Date(createdAt);

  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
};

export const logout = () => {
  localStorage.removeItem(getTenantStorageKey('token'));
  window.location.href = withTenantPath('/');
}

export const redirectToSignIn = (next=null) => {
  // Keep persisted cart/wishlist and only clear auth/session markers for this store.
  localStorage.removeItem(getTenantStorageKey('token'));
  localStorage.removeItem(getTenantStorageKey('loginToProceed'));
  const nextKey = getTenantStorageKey('next');
  if(next){
    localStorage.setItem(nextKey, withTenantPath(next));
  }else{
    localStorage.removeItem(nextKey);
  }
  localStorage.setItem(getTenantStorageKey("loginToProceed"), "true");
  window.location.href = withTenantPath('/signin');
}

export const dateFormatter = (value) => {
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export const getShippingAmount = (shipData, shippingInfo) => {
  if(!shippingInfo?.country) return "Choose Country";
  if(!shippingInfo?.state) return "Choose State";
  const countryData = shipData?.countries?.find(i => i.name === shippingInfo.country)
  const stateWiseAmount = countryData?.states?.find(j => j.name === shippingInfo.state);
  if(stateWiseAmount) return stateWiseAmount?.amount || 0; 
  if(countryData) return countryData?.amount || 0; 
  return shipData?.amount || 0; 
}

export const getShippingDisplay = (shippingAmount) => {
  if(!shippingAmount) return "Free";
  if(typeof(shippingAmount) === "number") return `${getCurrencyDetails().currencySymbol} ${shippingAmount.toFixed(2)}` 
  return shippingAmount;
}

export const getPriceWithoutTax = (priceWithTax, taxPercent) => {
  if (!priceWithTax || !taxPercent) return priceWithTax;

  const priceWithoutTax = priceWithTax / (1 + taxPercent / 100);
  return Number(priceWithoutTax.toFixed(2));
}

export const isPrintEnable = (status) => {
  return [ORDER_STATUS.PLACED, ORDER_STATUS.CONFIRMED, ORDER_STATUS.DELIVERED, ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED].includes(status);
}

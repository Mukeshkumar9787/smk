import { STATUS_TYPES } from "@/utils/constants";
import type { SeoProductData, SeoReviewData } from "./seo";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"
).replace(/\/+$/, "");

const SERVER_FETCH_TIMEOUT_MS = 5000;

async function serverApiFetch<T = any>(
  endpoint: string,
  revalidateSeconds = 120
): Promise<{ ok: boolean; status: number; payload: T | null }> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "ngrok-skip-browser-warning": "1",
      },
      next: { revalidate: revalidateSeconds },
      signal: AbortSignal.timeout(SERVER_FETCH_TIMEOUT_MS),
    });

    const payload = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, payload };
  } catch {
    return { ok: false, status: 0, payload: null };
  }
}

export interface ServerProductsResult {
  products: SeoProductData[];
  totalCount: number;
  fetched: boolean;
}

export async function fetchActiveProductsServer(
  params: {
    pageNumber?: number;
    pageSize?: number;
    category?: string;
    size?: string;
    color?: string;
    search?: string;
    pagination?: boolean;
  } = {},
  revalidateSeconds = 120
): Promise<ServerProductsResult> {
  const qs = new URLSearchParams();
  qs.set("status", STATUS_TYPES.ACTIVE);
  if (params.pageNumber) qs.set("pageNumber", String(params.pageNumber));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params.category) qs.set("category", params.category);
  if (params.size) qs.set("size", params.size);
  if (params.color) qs.set("color", params.color);
  if (params.search) qs.set("search", params.search);
  if (params.pagination === false) qs.set("pagination", "false");

  const { ok, payload } = await serverApiFetch<{
    success?: boolean;
    data?: SeoProductData[];
    totalCount?: number;
  }>(`/products/active?${qs.toString()}`, revalidateSeconds);

  if (!ok || !payload?.success || !Array.isArray(payload.data)) {
    return { products: [], totalCount: 0, fetched: false };
  }

  return {
    products: payload.data,
    totalCount: Number(payload.totalCount || payload.data.length),
    fetched: true,
  };
}

export interface SeoCategoryData {
  id: number;
  title: string;
  slug: string;
  img?: string;
  productCount?: number;
  updatedAt?: string;
}

export async function fetchActiveCategoriesServer(
  includeProductCount = false,
  revalidateSeconds = 300
): Promise<SeoCategoryData[]> {
  const qs = new URLSearchParams({ status: STATUS_TYPES.ACTIVE });
  if (includeProductCount) qs.set("includeProductCount", "true");

  const { ok, payload } = await serverApiFetch<{
    success?: boolean;
    data?: SeoCategoryData[];
  }>(`/categories/active?${qs.toString()}`, revalidateSeconds);

  if (!ok || !payload?.success || !Array.isArray(payload.data)) {
    return [];
  }
  return payload.data;
}

export interface ServerProductBySlugResult {
  product: (SeoProductData & { images: string[]; status?: string; updatedAt?: string }) | null;
  notFound: boolean;
}

export async function fetchProductBySlugServer(
  slug: string,
  revalidateSeconds = 120
): Promise<ServerProductBySlugResult> {
  if (!slug) return { product: null, notFound: true };

  const { ok, status, payload } = await serverApiFetch<{
    success?: boolean;
    data?: any;
  }>(`/products/${encodeURIComponent(slug)}`, revalidateSeconds);

  if (status === 404) {
    return { product: null, notFound: true };
  }

  if (!ok || !payload?.success || !payload?.data) {
    // Backend may be cold-starting or offline; do not treat transient failure as 404
    return { product: null, notFound: false };
  }

  const productData = payload.data;
  if (productData.status && productData.status !== STATUS_TYPES.ACTIVE) {
    return { product: null, notFound: true };
  }

  const images = Array.isArray(productData.images)
    ? productData.images
        .map((img: any) => (typeof img === "string" ? img : img?.path))
        .filter(Boolean)
    : [];

  return {
    product: {
      ...productData,
      images,
    },
    notFound: false,
  };
}

export async function fetchProductReviewsServer(
  productId: number,
  revalidateSeconds = 120
): Promise<SeoReviewData[]> {
  if (!productId) return [];

  const { ok, payload } = await serverApiFetch<{
    success?: boolean;
    data?: SeoReviewData[];
  }>(`/products/${productId}/reviews`, revalidateSeconds);

  if (!ok || !payload?.success || !Array.isArray(payload.data)) {
    return [];
  }
  return payload.data;
}

export interface CompanyInfoData {
  name?: string;
  email?: string;
  mobile?: string;
  address?: string;
  [key: string]: any;
}

export async function fetchCompanyInfoServer(
  revalidateSeconds = 600
): Promise<CompanyInfoData | null> {
  const { ok, payload } = await serverApiFetch<{
    success?: boolean;
    data?: { COMP_INFO?: CompanyInfoData };
  }>(`/config?configs[]=COMP_INFO`, revalidateSeconds);

  if (!ok || !payload?.success) return null;
  return payload?.data?.COMP_INFO || null;
}

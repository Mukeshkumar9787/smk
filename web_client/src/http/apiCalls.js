
import { API_ADDRESS, API_ADMIN_ORDERS, API_AUDIT_LOGS, API_AUDIT_LOGS_STATS, API_CART, API_CATEGORIES, API_COLOR, API_CONFIG, API_DASHBOARD, API_FILES, API_FILES_COMPLETE, API_FILES_UPLOAD_CONFIG, API_HSN, API_LOGIN, API_LOGIN_WITH_OTP, API_ORDERS, API_ORDER_DISPUTE, API_PAYMENT_VERIFY, API_PRODUCTS, API_PRODUCT_ADMIN, API_PRODUCTS_NOTIFY, API_PRODUCT_REVIEWS, API_PRODUCT_REVIEWS_ADMIN, API_PRODUCT_REVIEW_ME, API_PRODUCT_REVIEW_SELF, API_PRODUCT_REVIEW_VISIBILITY, API_REGISTER, API_RESET_PASSWORD, API_SIZE, API_TENANTS_CHECK_SLUG, API_TENANTS_CURRENT_BRANDING, API_TENANTS_CURRENT_SUBSCRIPTION, API_TENANTS_PLANS, API_TENANTS_PLATFORM_CREATE, API_TENANTS_PLATFORM_OVERVIEW, API_TENANTS_PLATFORM_PLAN, API_TENANTS_PLATFORM_STATUS, API_TENANTS_PROVISION, API_TENANTS_RESOLVE, API_USER_INFO, API_USER_UPDATE_PROFILE, API_USERS, API_USERS_ROLE, API_VERIFY_GOOGLE_TOKEN, API_VERIFY_OTP, API_WISHLIST, GET_ACTIVE_API } from './apiUrls';
import axiosInstance from './axiosInstance';

export async function getCategories(params) {
  const res = await axiosInstance.get(GET_ACTIVE_API(API_CATEGORIES, params), { params });
  return res?.data || [];
}

export async function createCategory(data) {
  const res = await axiosInstance.post(API_CATEGORIES, data );
  return res.data;
}

export async function uploadFile(file) {
  try {
    const uploadConfig = await axiosInstance.post(API_FILES_UPLOAD_CONFIG, {
      filename: file.name,
      contentType: file.type,
    });

    if (uploadConfig?.data?.data?.strategy === "direct") {
      const { uploadUrl, path } = uploadConfig.data.data;
      try {
        const directUploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (directUploadResponse.ok) {
          const completeResponse = await axiosInstance.post(API_FILES_COMPLETE, { path });
          return completeResponse.data;
        }
      } catch (directErr) {
        // Fallback to server-side R2 upload if direct browser upload hits CORS/network error
        console.warn("Direct R2 upload failed, falling back to server upload:", directErr);
      }
    }
  } catch (configErr) {
    console.warn("Upload config fetch failed, falling back to server upload:", configErr);
  }

  const formData = new FormData();
  formData.append("file", file);
  const res = await axiosInstance.post(API_FILES, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    },
  });
  return res.data;
}

export async function getCategoryBySlug(values) {
  const res = await axiosInstance.get(`${API_CATEGORIES}/${values.slug}`, {params: values});
  return res?.data || [];
}

export async function updateCategory(data) {
  const res = await axiosInstance.put(`${API_CATEGORIES}/${data.id}`, data );
  return res.data;
}

export async function deleteCategory(data) {
  const res = await axiosInstance.delete(`${API_CATEGORIES}/${data.id}`);
  return res.data;
}

export async function getProducts(params, options = {}) {
  const res = await axiosInstance.get(GET_ACTIVE_API(API_PRODUCTS, params),{
    params,
    ...options,
  });
  return res?.data || [];
}

export async function createProduct(data) {
  const res = await axiosInstance.post(API_PRODUCTS, data );
  return res.data;
}

export async function getProductBySlug(values) {
  const res = await axiosInstance.get(`${API_PRODUCTS}/${values.slug}`, {params: values});
  const payload = res?.data || {};
  return {
    ...payload,
    httpStatus: res?.status,
  };
}

export async function getProductBySlugAdmin(values) {
  const res = await axiosInstance.get(`${API_PRODUCT_ADMIN}/${values.slug}`, { params: values });
  return res?.data || [];
}

export async function updateProduct(data) {
  const res = await axiosInstance.put(`${API_PRODUCTS}/${data.id}`, data );
  return res.data;
}

export async function deleteProduct(data) {
  const res = await axiosInstance.delete(`${API_PRODUCTS}/${data.id}`);
  return res.data;
}

export async function notifyProductWhenInStock(productId) {
  const res = await axiosInstance.post(API_PRODUCTS_NOTIFY(productId));
  return res?.data || {};
}

export async function getProductReviews(productId) {
  const res = await axiosInstance.get(API_PRODUCT_REVIEWS(productId));
  return res?.data || {};
}

export async function addProductReview(productId, data) {
  const res = await axiosInstance.post(API_PRODUCT_REVIEWS(productId), data);
  return res?.data || {};
}

export async function getMyProductReview(productId) {
  const res = await axiosInstance.get(API_PRODUCT_REVIEW_ME(productId));
  return res?.data || {};
}

export async function updateMyProductReview(reviewId, data) {
  const res = await axiosInstance.patch(API_PRODUCT_REVIEW_SELF(reviewId), data);
  return res?.data || {};
}

export async function deleteMyProductReview(reviewId) {
  const res = await axiosInstance.delete(API_PRODUCT_REVIEW_SELF(reviewId));
  return res?.data || {};
}

export async function getProductReviewsForAdmin(productId) {
  const res = await axiosInstance.get(API_PRODUCT_REVIEWS_ADMIN(productId));
  return res?.data || {};
}

export async function updateProductReviewVisibility(reviewId, isHidden) {
  const res = await axiosInstance.patch(API_PRODUCT_REVIEW_VISIBILITY(reviewId), { isHidden });
  return res?.data || {};
}

export async function getHsnCodes(params) {
  const res = await axiosInstance.get(API_HSN, { params });
  return res?.data || [];
}

export async function createHsn(data) {
  const res = await axiosInstance.post(API_HSN, data );
  return res.data;
}

export async function getHsnByCode(values) {
  const res = await axiosInstance.get(`${API_HSN}/${values.code}`, values);
  return res?.data || [];
}

export async function updateHsn(data) {
  const res = await axiosInstance.put(`${API_HSN}/${data.id}`, data );
  return res.data;
}

export async function deleteHsn(data) {
  const res = await axiosInstance.delete(`${API_HSN}/${data.id}`);
  return res.data;
}

export async function getSizes(params) {
  const res = await axiosInstance.get(GET_ACTIVE_API(API_SIZE, params), { params });
  return res?.data || [];
}

export async function createSize(data) {
  const res = await axiosInstance.post(API_SIZE, data );
  return res.data;
}

export async function getSizeBySlug(values) {
  const res = await axiosInstance.get(`${API_SIZE}/${values.slug}`, values);
  return res?.data || [];
}

export async function updateSize(data) {
  const res = await axiosInstance.put(`${API_SIZE}/${data.id}`, data );
  return res.data;
}

export async function deleteSize(data) {
  const res = await axiosInstance.delete(`${API_SIZE}/${data.id}`);
  return res.data;
}

export async function getColors(params) {
  const res = await axiosInstance.get(GET_ACTIVE_API(API_COLOR, params), { params });
  return res?.data || [];
}

export async function createColor(data) {
  const res = await axiosInstance.post(API_COLOR, data );
  return res.data;
}

export async function getColorBySlug(values) {
  const res = await axiosInstance.get(`${API_COLOR}/${values.slug}`, values);
  return res?.data || [];
}

export async function updateColor(data) {
  const res = await axiosInstance.put(`${API_COLOR}/${data.id}`, data );
  return res.data;
}

export async function deleteColor(data) {
  const res = await axiosInstance.delete(`${API_COLOR}/${data.id}`);
  return res.data;
}

export async function register(data) {
  const res = await axiosInstance.post(API_REGISTER, data );
  return res.data;
}

export async function login(data) {
  const res = await axiosInstance.post(API_LOGIN, data );
  return res.data;
}

export async function verifyOTP(data) {
  const res = await axiosInstance.post(API_VERIFY_OTP, data );
  return res.data;
}

export async function loginWithOTP(data) {
  const res = await axiosInstance.post(API_LOGIN_WITH_OTP, data );
  return res.data;
}

export async function getUserInfo(data) {
  const res = await axiosInstance.get(API_USER_INFO, data );
  return res.data;
}

export async function resetPassword(data) {
  const res = await axiosInstance.post(API_RESET_PASSWORD, data );
  return res.data;
}

export async function updateProfile(data) {
  const res = await axiosInstance.patch(API_USER_UPDATE_PROFILE, data );
  return res.data;
}

export async function getAddress(data) {
  const res = await axiosInstance.get(API_ADDRESS, { params: data });
  return res.data;
}

export async function createAddress(data) {
  const res = await axiosInstance.post(API_ADDRESS, data );
  return res.data;
}

export async function deleteAddress(id) {
  const res = await axiosInstance.delete(`${API_ADDRESS}/${id}`);
  return res.data;
}

export async function updateAddress(id, data) {
  const res = await axiosInstance.patch(`${API_ADDRESS}/${id}`, data);
  return res.data;
}

export async function createOrder(data) {
  const res = await axiosInstance.post(API_ORDERS, data );
  return res.data;
}

export async function getOrdersForUser(data) {
  const res = await axiosInstance.get(API_ORDERS, {params: data} );
  return res.data;
}

export async function getOrdersForAdmin(data) {
  const res = await axiosInstance.get(API_ADMIN_ORDERS, {params: data} );
  return res.data;
}

export async function getOrderDetailsBySlug(values) {
  const res = await axiosInstance.get(`${API_ORDERS}/${values.slug}`, {params: values});
  return res?.data || [];
}

export async function getOrderDetailsBySlugAdmin(values) {
  const res = await axiosInstance.get(`${API_ORDERS}/${values.slug}/admin`, {params: values});
  return res?.data || [];
}

export async function updateOrderStatusBySlugAdmin(values) {
  const res = await axiosInstance.patch(`${API_ORDERS}/${values.slug}/status/admin`, values);
  return res?.data || [];
}

export async function updateOrderBySlugAdmin(values) {
  const res = await axiosInstance.patch(`${API_ORDERS}/${values.slug}/admin`, values);
  return res?.data || [];
}

export async function raiseOrderDispute(values) {
  const res = await axiosInstance.patch(API_ORDER_DISPUTE(values.slug), {
    message: values.message,
  });
  return res?.data || [];
}

export async function verifyPayment(data) {
  const res = await axiosInstance.post(API_PAYMENT_VERIFY, data );
  return res.data;
}

export async function getConfig(values) {
  const res = await axiosInstance.get(API_CONFIG, { params: values});
  return res?.data || [];
}

export async function updateConfig(data) {
  const res = await axiosInstance.put(API_CONFIG, data);
  return res?.data || [];
}

export async function verifyGoogleToken(data) {
  const res = await axiosInstance.post(API_VERIFY_GOOGLE_TOKEN, data);
  return res.data;
}

export async function getUsers(data) {
  const res = await axiosInstance.get(API_USERS, {params: data} );
  return res.data;
}

export async function updateRole(data) {
  const res = await axiosInstance.patch(API_USERS_ROLE, data );
  return res.data;
}

export async function getOrderStats(data) {
  const res = await axiosInstance.get(`${API_ORDERS}/stats`, {params: data} );
  return res.data; 
};

export async function getAuditLogs(data) {
  const res = await axiosInstance.get(API_AUDIT_LOGS, { params: data });
  return res.data;
}

export async function getAuditLogStats() {
  const res = await axiosInstance.get(API_AUDIT_LOGS_STATS);
  return res.data;
}

export async function getCart() {
  const res = await axiosInstance.get(API_CART);
  return res?.data || {};
}

export async function replaceCart(items) {
  const res = await axiosInstance.put(API_CART, { items });
  return res?.data || {};
}

export async function getWishlist() {
  const res = await axiosInstance.get(API_WISHLIST);
  return res?.data || {};
}

export async function replaceWishlist(items) {
  const res = await axiosInstance.put(API_WISHLIST, { items });
  return res?.data || {};
}

export async function getAdminDashboard() {
  const res = await axiosInstance.get(API_DASHBOARD);
  return res?.data || {};
}

export async function resolveCurrentTenant() {
  const res = await axiosInstance.get(API_TENANTS_RESOLVE);
  return res?.data || {};
}

export async function getTenantPlans() {
  const res = await axiosInstance.get(API_TENANTS_PLANS);
  return res?.data || {};
}

export async function checkStoreSlugAvailability(slug) {
  const res = await axiosInstance.get(API_TENANTS_CHECK_SLUG(slug), {
    skipGlobalLoader: true,
    skipErrorToast: true,
  });
  return res?.data || {};
}

export async function provisionTenantStore(data) {
  const res = await axiosInstance.post(API_TENANTS_PROVISION, data);
  return res?.data || {};
}

export async function getCurrentTenantBranding() {
  const res = await axiosInstance.get(API_TENANTS_CURRENT_BRANDING);
  return res?.data || {};
}

export async function updateCurrentTenantBranding(data) {
  const res = await axiosInstance.put(API_TENANTS_CURRENT_BRANDING, data);
  return res?.data || {};
}

export async function getCurrentTenantSubscription() {
  const res = await axiosInstance.get(API_TENANTS_CURRENT_SUBSCRIPTION);
  return res?.data || {};
}

export async function getPlatformOverview() {
  const res = await axiosInstance.get(API_TENANTS_PLATFORM_OVERVIEW);
  return res?.data || {};
}

export async function createPlatformStore(data) {
  const res = await axiosInstance.post(API_TENANTS_PLATFORM_CREATE, data);
  return res?.data || {};
}

export async function updatePlatformStoreStatus(tenantId, status) {
  const res = await axiosInstance.patch(API_TENANTS_PLATFORM_STATUS(tenantId), { status });
  return res?.data || {};
}

export async function updatePlatformStorePlan(tenantId, planCode) {
  const res = await axiosInstance.patch(API_TENANTS_PLATFORM_PLAN(tenantId), { planCode });
  return res?.data || {};
}

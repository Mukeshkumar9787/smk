import { getStoredToken, redirectToSignIn } from '@/utils/helper';
import axios from 'axios';
import { message } from 'antd';
import { decrementGetRequest, incrementGetRequest } from './apiLoader';
import { serverStatusManager } from './serverStatusManager';
import { rateLimitManager } from './rateLimitManager';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 1000 * 30,
  headers: {
    'content-type': 'application/json',
    'cache-control': 'no-cache',
    'ngrok-skip-browser-warning': 1,
  },
});

let globalRequestId = 0;

axiosInstance.interceptors.request.use((config) => {
  try {
    const token = getStoredToken();
    if (token) {
      config.headers.authorization = `Bearer ${token}`; // eslint-disable-line
    }
    const isGet = config.method?.toLowerCase() === "get";
    // Only increment global loader on the first attempt, not repeated retries
    if (isGet && !config.skipGlobalLoader && !config._isTrackedGet) {
      incrementGetRequest();
      config._isTrackedGet = true;
    }
    config._retryCount = config._retryCount || 0;
    config._reqId = ++globalRequestId;
  } catch (error) { }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app-api-request-start', {
      detail: { reqId: config._reqId, method: config.method, url: config.url }
    }));
  }
  return config;
}, (error) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app-api-request-end', {
      detail: { reqId: error?.config?._reqId }
    }));
  }
  Promise.reject(error);
});

axiosInstance.interceptors.response.use((response) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app-api-request-end', {
      detail: { reqId: response?.config?._reqId }
    }));
  }
  const trackedGet = response?.config?._isTrackedGet;
  if (trackedGet) {
    decrementGetRequest();
  }
  // Clear waking up / offline banner if it was active
  if (serverStatusManager.isWakingUp() || serverStatusManager.isOffline()) {
    serverStatusManager.markOnline();
  } else if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('server-connection-success'));
  }
  return response;
}, async (error) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app-api-request-end', {
      detail: { reqId: error?.config?._reqId }
    }));
  }
  const config = error?.config || {};
  const trackedGet = config?._isTrackedGet;
  const isGet = config?.method?.toLowerCase() === "get";

  const isNetworkError = !error.response ||
    error.code === 'ERR_NETWORK' ||
    error.code === 'ECONNABORTED' ||
    error.code === 'ERR_CONNECTION_REFUSED' ||
    error.code === 'ETIMEDOUT';
  const isColdStartStatus = error.response && [502, 503, 504].includes(error.response.status);
  const isCandidateForColdStart = isNetworkError || isColdStartStatus;

  // Render cold start handling: Automatically retry safe GET requests while waking up
  if (isCandidateForColdStart) {
    // Trigger background continuous ping loop to keep waking up Render instance
    serverStatusManager.triggerWakeUp({ reloadOnWake: true });

    const maxRetries = config.maxRetries !== undefined ? config.maxRetries : 5;
    if ((isGet || config.allowRetry) && config._retryCount < maxRetries) {
      config._retryCount += 1;
      const delay = Math.min(1500 + config._retryCount * 1000, 5000);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return axiosInstance(config);
    }
  }

  if (trackedGet) {
    decrementGetRequest();
  }

  try {
    const isServerError = error.response && error.response.status >= 500;

    if (isCandidateForColdStart || isServerError) {
      const serverMessage = "Connecting to services. Free instances may take a minute to start.";

      // Only show error notification if NOT in graceful wake-up mode and not muted
      if (!serverStatusManager.isWakingUp() && !config.skipErrorToast) {
        message.error({
          content: "Unable to connect right now. Please try again later.",
          key: 'server-connection-error',
          duration: 5,
        });
      }

      return {
        data: {
          success: false,
          isServerUnreachable: true,
          isWakingUp: serverStatusManager.isWakingUp(),
          message: serverMessage,
        }
      };
    }

    if (error.response && error.response.status === 429) {
      const headers = error.response.headers || {};
      const retryAfterHeader = headers['retry-after'] || headers['Retry-After'];
      const rateLimitResetHeader = headers['ratelimit-reset'] || headers['x-ratelimit-reset'];
      const rawSeconds = retryAfterHeader || rateLimitResetHeader || error.response?.data?.retryAfterSeconds || error.response?.data?.retryAfter;
      const retryAfter = rawSeconds ? parseInt(String(rawSeconds), 10) || 60 : 60;

      const rateLimitMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        `Please wait ${retryAfter} seconds before trying again.`;

      rateLimitManager.trigger({
        retryAfter,
        message: rateLimitMsg,
        endpoint: config?.url,
      });

      if (!config.skipErrorToast) {
        message.warning({
          content: `⏳ ${rateLimitMsg}`,
          key: 'rate-limit-warning',
          duration: 6,
        });
      }

      return {
        data: {
          success: false,
          isRateLimited: true,
          retryAfter,
          message: rateLimitMsg,
        },
      };
    }

    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined' && window.location.pathname !== '/signin') {
        redirectToSignIn();
      }
    } else {
      const errorMsg = error?.response?.data?.errors || error?.response?.data?.message || 'Something went wrong';
      if (!config.skipErrorToast) {
        message.error(errorMsg);
      }
    }
  } catch (err) { }

  return error?.response || { data: { success: false, message: "Something went wrong" } };
});

export default axiosInstance;

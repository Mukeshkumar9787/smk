/**
 * Cloudflare Turnstile CAPTCHA Verification Middleware.
 * Validates the turnstile verification token using Cloudflare's siteverify API.
 */
export const verifyTurnstileToken = async (req, res, next) => {
  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    // If not configured (e.g. initial setup or local environment without Turnstile keys),
    // log explicit warning and skip verification gracefully per agent guidelines.
    console.warn("[Turnstile] CLOUDFLARE_TURNSTILE_SECRET_KEY is not set. Skipping verification.");
    return next();
  }

  const token =
    req.body?.turnstileToken ||
    req.headers["x-turnstile-token"] ||
    req.headers["cf-turnstile-token"];

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Cloudflare Turnstile CAPTCHA token is required.",
    });
  }

  try {
    const clientIp =
      req.headers["cf-connecting-ip"] ||
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.ip;

    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (clientIp) {
      formData.append("remoteip", clientIp);
    }

    const verifyResponse = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const verifyData = await verifyResponse.json();

    if (!verifyData.success) {
      console.warn("[Turnstile] Verification failed:", verifyData["error-codes"]);
      const isDuplicate = verifyData["error-codes"]?.includes("timeout-or-duplicate");
      const message = isDuplicate
        ? "CAPTCHA verification expired or already used. Please complete verification again."
        : "Cloudflare Turnstile CAPTCHA verification failed. Please try again.";

      return res.status(400).json({
        success: false,
        message,
        errorCodes: verifyData["error-codes"],
      });
    }

    // Token verified successfully
    next();
  } catch (error) {
    console.error("[Turnstile] Verification request error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify Cloudflare Turnstile token due to an internal error.",
    });
  }
};


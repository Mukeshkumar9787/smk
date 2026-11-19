import jwt from "jsonwebtoken";
import { rawPrisma } from "../prisma/client.js";
import { hashedPassword, comparePassword } from "../utils/cryptoUtils.js";
import { CONFIG_KEYS, STATUS_TYPES, TENANT_ROLES, TENANT_STATUS } from "../utils/constants.js";
import { clearTenantCache } from "../middlewares/tenantMiddleware.js";
import { getCurrentTenant, getCurrentTenantId, runWithBypass } from "../utils/tenantContext.js";
import { emitTenantLifecycleEvent } from "./tenantEventProducer.js";

const RESERVED_SLUGS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "platform",
  "platform-admin",
  "super-admin",
  "dashboard",
  "shop",
  "shop-details",
  "cart",
  "checkout",
  "orders",
  "product",
  "products",
  "category",
  "categories",
  "config",
  "contact",
  "launch",
  "pricing",
  "signin",
  "signup",
  "signin-otp",
  "reset-password",
  "my-account",
  "wishlist",
  "users",
  "audit-logs",
  "s",
  "static",
  "assets",
  "images",
  "uploads",
  "health",
  "robots",
  "sitemap",
]);

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

export function normalizeSlug(raw = "") {
  return String(raw)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function darkenHex(hex, factor = 0.78) {
  if (!HEX_COLOR_RE.test(hex)) return "#1C3FB7";
  const r = Math.max(0, Math.round(parseInt(hex.slice(1, 3), 16) * factor));
  const g = Math.max(0, Math.round(parseInt(hex.slice(3, 5), 16) * factor));
  const b = Math.max(0, Math.round(parseInt(hex.slice(5, 7), 16) * factor));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

export function formatPublicTenant(tenant) {
  if (!tenant) return null;
  const branding = tenant.branding || {};
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    isDefault: Boolean(tenant.isDefault),
    status: tenant.status,
    customDomain: tenant.customDomain || null,
    customDomainVerified: Boolean(tenant.customDomainVerified),
    plan: tenant.plan
      ? {
          code: tenant.plan.code,
          name: tenant.plan.name,
          maxProducts: tenant.plan.maxProducts,
          maxStorageMb: tenant.plan.maxStorageMb,
          customDomainAllowed: tenant.plan.customDomainAllowed,
          aiChatbotEnabled: tenant.plan.aiChatbotEnabled,
          autoProcurementEnabled: tenant.plan.autoProcurementEnabled,
        }
      : null,
    branding: {
      storeName: branding.storeName || tenant.name,
      tagline: branding.tagline || "",
      logoUrl: branding.logoUrl || null,
      faviconUrl: branding.faviconUrl || "/favicon.ico",
      primaryColor: branding.primaryColor || "#3C50E0",
      primaryDarkColor: branding.primaryDarkColor || darkenHex(branding.primaryColor || "#3C50E0"),
      accentColor: branding.accentColor || "#0EA5E9",
      backgroundColor: branding.backgroundColor || "#F6FAFF",
      surfaceColor: branding.surfaceColor || "#FFFFFF",
      textPrimaryColor: branding.textPrimaryColor || "#1C274C",
      seoTitle: branding.seoTitle || `${branding.storeName || tenant.name} | Online Store`,
      seoDescription:
        branding.seoDescription ||
        `Shop curated products online at ${branding.storeName || tenant.name} with secure checkout.`,
      aiChatbotActive: branding.aiChatbotActive !== false,
    },
  };
}

const listPlans = async () => {
  return rawPrisma.plan.findMany({
    where: { isActive: true },
    orderBy: { priceMonthly: "asc" },
  });
};

const checkSlugAvailability = async (rawSlug) => {
  const slug = normalizeSlug(rawSlug);
  if (!slug || slug.length < 2 || slug.length > 40) {
    return {
      slug,
      available: false,
      reason: "Store slug must be 2-40 lowercase letters, numbers, or hyphens.",
    };
  }
  if (RESERVED_SLUGS.has(slug)) {
    return {
      slug,
      available: false,
      reason: "This store URL slug is reserved.",
    };
  }
  const existing = await rawPrisma.tenant.findUnique({
    where: { slug },
    select: { id: true },
  });
  return {
    slug,
    available: !existing,
    reason: existing ? "This store URL is already taken." : null,
  };
};

const provisionTenant = async ({
  storeName,
  slug: rawSlug,
  ownerName,
  ownerEmail,
  ownerPassword,
  ownerMobile = null,
  aiChatbotEnabled = true,
  planCode = null,
  primaryColor = "#3C50E0",
  accentColor = "#0EA5E9",
  tagline = "",
  logoUrl = null,
  actorUser = null,
}) => {
  const cleanStoreName = String(storeName || "").trim();
  if (!cleanStoreName || cleanStoreName.length < 2) {
    const err = new Error("Store name must be at least 2 characters.");
    err.statusCode = 400;
    throw err;
  }

  const slugCheck = await checkSlugAvailability(rawSlug || cleanStoreName);
  if (!slugCheck.available) {
    const err = new Error(slugCheck.reason || "Store slug is unavailable.");
    err.statusCode = 400;
    throw err;
  }

  const cleanEmail = String(ownerEmail || actorUser?.email || "").trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    const err = new Error("A valid owner email address is required.");
    err.statusCode = 400;
    throw err;
  }

  const validPrimary = HEX_COLOR_RE.test(primaryColor) ? primaryColor.toUpperCase() : "#3C50E0";
  const validAccent = HEX_COLOR_RE.test(accentColor) ? accentColor.toUpperCase() : "#0EA5E9";
  const validPrimaryDark = darkenHex(validPrimary);

  const plan =
    (planCode ? await rawPrisma.plan.findUnique({ where: { code: String(planCode).toUpperCase() } }) : null) ||
    (await rawPrisma.plan.findFirst({ where: { isActive: true }, orderBy: { priceMonthly: "asc" } }));

  if (!ownerPassword || String(ownerPassword).length < 8) {
    const err = new Error("Owner password must be at least 8 characters.");
    err.statusCode = 400;
    throw err;
  }

  const passwordHash = await hashedPassword(ownerPassword);
  const isChatbotAllowed = aiChatbotEnabled !== undefined ? Boolean(aiChatbotEnabled) : true;

  const result = await runWithBypass(async () =>
    rawPrisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
      data: {
        name: cleanStoreName,
        slug: slugCheck.slug,
        status: TENANT_STATUS.ACTIVE,
        planId: plan?.id || null,
      },
    });

    // Always create an isolated store-owner account scoped strictly to this new tenant
    const owner = await tx.user.create({
      data: {
        tenantId: tenant.id,
        name: String(ownerName || cleanStoreName).trim(),
        email: cleanEmail,
        password: passwordHash,
        mobile: ownerMobile || null,
        role: "ADMIN",
        tenantRole: TENANT_ROLES.STORE_OWNER,
      },
    });

    const branding = await tx.tenantBranding.create({
      data: {
        tenantId: tenant.id,
        storeName: cleanStoreName,
        tagline: tagline || `Official online store of ${cleanStoreName}`,
        logoUrl: logoUrl || null,
        faviconUrl: "/favicon.ico",
        primaryColor: validPrimary,
        primaryDarkColor: validPrimaryDark,
        accentColor: validAccent,
        backgroundColor: "#F6FAFF",
        surfaceColor: "#FFFFFF",
        textPrimaryColor: "#1C274C",
        seoTitle: `${cleanStoreName} | Online Store`,
        seoDescription: `Shop products from ${cleanStoreName} online with transparent pricing and secure checkout.`,
        aiChatbotActive: isChatbotAllowed,
      },
    });

    if (plan) {
      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: plan.id,
          provider: "RAZORPAY",
          status: "ACTIVE",
        },
      });
    }

    // Seed starter catalog attributes so merchant can create products immediately
    await tx.size.createMany({
      data: [
        { tenantId: tenant.id, title: "S", status: STATUS_TYPES.ACTIVE },
        { tenantId: tenant.id, title: "M", status: STATUS_TYPES.ACTIVE },
        { tenantId: tenant.id, title: "L", status: STATUS_TYPES.ACTIVE },
        { tenantId: tenant.id, title: "XL", status: STATUS_TYPES.ACTIVE },
        { tenantId: tenant.id, title: "Free Size", status: STATUS_TYPES.ACTIVE },
      ],
      skipDuplicates: true,
    });

    await tx.color.createMany({
      data: [
        { tenantId: tenant.id, title: "Midnight Black", code: "#18181B", status: STATUS_TYPES.ACTIVE },
        { tenantId: tenant.id, title: "Crisp White", code: "#FFFFFF", status: STATUS_TYPES.ACTIVE },
        { tenantId: tenant.id, title: "Brand Primary", code: validPrimary, status: STATUS_TYPES.ACTIVE },
      ],
      skipDuplicates: true,
    });

    await tx.category.create({
      data: {
        tenantId: tenant.id,
        title: "Featured",
        slug: "featured",
        status: STATUS_TYPES.ACTIVE,
      },
    });

    await tx.config.createMany({
      data: [
        {
          tenantId: tenant.id,
          key: CONFIG_KEYS.COMP_INFO,
          value: {
            name: cleanStoreName,
            email: cleanEmail,
            mobile: ownerMobile || "",
            address: "",
          },
        },
        {
          tenantId: tenant.id,
          key: CONFIG_KEYS.SHIPPING,
          value: {
            amount: 0,
            countries: [],
          },
        },
      ],
      skipDuplicates: true,
    });

    return { tenant: { ...tenant, branding, plan }, owner };
    })
  );

  clearTenantCache();

  // Notify Chatbot Service & Kafka of new tenant provisioning
  emitTenantLifecycleEvent({
    event: "TENANT_CREATED",
    tenantId: result.tenant.id,
    slug: result.tenant.slug,
    name: result.tenant.name,
    status: result.tenant.status,
    aiChatbotEnabled: isChatbotAllowed,
    owner: {
      email: result.owner.email,
      name: result.owner.name,
      passwordHash: result.owner.password,
    },
    branding: {
      storeName: cleanStoreName,
      primaryColor: validPrimary,
      accentColor: validAccent,
    },
  }).catch((e) => console.warn("[Tenant Sync Warning]:", e.message));

  const token = jwt.sign(
    { id: result.owner.id, tenantId: result.tenant.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

  return {
    tenant: formatPublicTenant(result.tenant),
    owner: {
      id: result.owner.id,
      name: result.owner.name,
      email: result.owner.email,
    },
    token,
  };
};

const getCurrentBranding = async () => {
  const tenant = getCurrentTenant();
  const tenantId = tenant?.id || getCurrentTenantId();
  const full = await rawPrisma.tenant.findUnique({
    where: { id: tenantId },
    include: { branding: true, plan: true },
  });
  return formatPublicTenant(full);
};

const updateCurrentBranding = async (payload = {}) => {
  const tenantId = getCurrentTenantId();
  const current = await rawPrisma.tenant.findUnique({
    where: { id: tenantId },
    include: { branding: true, plan: true },
  });

  if (!current) {
    const err = new Error("Store not found");
    err.statusCode = 404;
    throw err;
  }

  let aiChatbotActive = current.branding?.aiChatbotActive !== false;
  if (payload.aiChatbotActive !== undefined) {
    aiChatbotActive = Boolean(payload.aiChatbotActive);
  }

  const pickHex = (value, fallback) =>
    value && HEX_COLOR_RE.test(String(value).trim())
      ? String(value).trim().toUpperCase()
      : fallback;

  const storeName = String(payload.storeName || current.branding?.storeName || current.name).trim();
  const primaryColor = pickHex(payload.primaryColor, current.branding?.primaryColor || "#3C50E0");
  const primaryDarkColor = pickHex(payload.primaryDarkColor, darkenHex(primaryColor));
  const accentColor = pickHex(payload.accentColor, current.branding?.accentColor || "#0EA5E9");
  const backgroundColor = pickHex(payload.backgroundColor, current.branding?.backgroundColor || "#F6FAFF");
  const surfaceColor = pickHex(payload.surfaceColor, current.branding?.surfaceColor || "#FFFFFF");
  const textPrimaryColor = pickHex(payload.textPrimaryColor, current.branding?.textPrimaryColor || "#1C274C");

  const data = {
    storeName,
    tagline: payload.tagline !== undefined ? String(payload.tagline || "").trim() : current.branding?.tagline,
    logoUrl: payload.logoUrl !== undefined ? (payload.logoUrl || null) : current.branding?.logoUrl,
    faviconUrl: payload.faviconUrl !== undefined ? (payload.faviconUrl || "/favicon.ico") : current.branding?.faviconUrl,
    primaryColor,
    primaryDarkColor,
    accentColor,
    backgroundColor,
    surfaceColor,
    textPrimaryColor,
    seoTitle:
      payload.seoTitle !== undefined
        ? String(payload.seoTitle || "").trim() || `${storeName} | Online Store`
        : current.branding?.seoTitle,
    seoDescription:
      payload.seoDescription !== undefined
        ? String(payload.seoDescription || "").trim()
        : current.branding?.seoDescription,
    aiChatbotActive,
  };

  await rawPrisma.$transaction(async (tx) => {
    await tx.tenant.update({
      where: { id: tenantId },
      data: { name: storeName },
    });
    await tx.tenantBranding.upsert({
      where: { tenantId },
      create: { tenantId, ...data },
      update: data,
    });
  });

  clearTenantCache();

  emitTenantLifecycleEvent({
    event: payload.aiChatbotActive !== undefined ? "TENANT_CHATBOT_UPDATED" : "TENANT_BRANDING_UPDATED",
    tenantId: current.id,
    slug: current.slug,
    name: current.name,
    status: current.status,
    aiChatbotEnabled: payload.aiChatbotActive !== undefined ? Boolean(aiChatbotActive) : current.branding?.aiChatbotActive,
    branding: {
      storeName: data.storeName || current.name,
      primaryColor: data.primaryColor || current.branding?.primaryColor,
      accentColor: data.accentColor || current.branding?.accentColor,
    },
  }).catch((e) => console.warn("[Tenant Sync Warning]:", e.message));

  return getCurrentBranding();
};

const getCurrentSubscription = async () => {
  const tenantId = getCurrentTenantId();
  const [tenant, productCount, categoryCount, orderCount] = await Promise.all([
    rawPrisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        plan: true,
        branding: true,
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { plan: true },
        },
      },
    }),
    rawPrisma.product.count({ where: { tenantId } }),
    rawPrisma.category.count({ where: { tenantId } }),
    rawPrisma.order.count({ where: { tenantId } }),
  ]);

  const maxProducts = tenant?.plan?.maxProducts || 50;
  const isProductLimitReached = maxProducts > 0 && productCount >= maxProducts;

  return {
    tenantId,
    slug: tenant?.slug,
    status: tenant?.status,
    customDomain: tenant?.customDomain || null,
    customDomainVerified: Boolean(tenant?.customDomainVerified),
    plan: tenant?.plan || null,
    subscription: tenant?.subscriptions?.[0] || null,
    features: {
      aiChatbot: {
        allowed: Boolean(tenant?.isDefault || tenant?.plan?.aiChatbotEnabled),
        active: tenant?.branding?.aiChatbotActive !== false,
      },
      customDomain: {
        allowed: Boolean(tenant?.isDefault || tenant?.plan?.customDomainAllowed),
        domain: tenant?.customDomain || null,
        verified: Boolean(tenant?.customDomainVerified),
      },
      autoProcurement: {
        allowed: Boolean(tenant?.isDefault || tenant?.plan?.autoProcurementEnabled),
      },
    },
    usage: {
      products: productCount,
      maxProducts,
      isProductLimitReached,
      categories: categoryCount,
      orders: orderCount,
    },
  };
};

const getPlatformOverview = async () => {
  return runWithBypass(async () => {
    const [tenants, totalProducts, totalOrders, totalUsers, revenueAgg] = await Promise.all([
    rawPrisma.tenant.findMany({
      include: {
        branding: true,
        plan: true,
        users: {
          where: { tenantRole: TENANT_ROLES.STORE_OWNER },
          select: { id: true, name: true, email: true },
          take: 1,
        },
        _count: {
          select: {
            products: true,
            orders: true,
            categories: true,
            users: true,
          },
        },
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
    rawPrisma.product.count(),
    rawPrisma.order.count(),
    rawPrisma.user.count(),
    rawPrisma.order.aggregate({
      where: { status: { in: ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"] } },
      _sum: { totalAmount: true },
    }),
  ]);

  const activeTenants = tenants.filter((t) => t.status === TENANT_STATUS.ACTIVE || t.status === TENANT_STATUS.TRIAL).length;
  const suspendedTenants = tenants.filter((t) => t.status === TENANT_STATUS.SUSPENDED || t.status === TENANT_STATUS.CANCELLED).length;

  return {
    metrics: {
      totalTenants: tenants.length,
      activeTenants,
      suspendedTenants,
      totalProducts,
      totalOrders,
      totalUsers,
      totalPlatformGmv: Number(revenueAgg?._sum?.totalAmount || 0),
    },
    tenants: tenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      isDefault: t.isDefault,
      status: t.status,
      customDomain: t.customDomain,
      customDomainVerified: t.customDomainVerified,
      planName: t.plan?.name || "Standard",
      planCode: t.plan?.code || "STANDARD",
      aiChatbotEnabled: t.branding?.aiChatbotActive !== false,
      aiChatbotActive: t.branding?.aiChatbotActive !== false,
      chatbotUrl: `https://chatbot-service-three.vercel.app/${t.slug}/admin/login`,
      chatbotWidgetUrl: `https://chatbot-service-three.vercel.app/${t.slug}/widget`,
      primaryColor: t.branding?.primaryColor || "#3C50E0",
      logoUrl: t.branding?.logoUrl || null,
      owner: t.users?.[0] || null,
      counts: t._count,
      createdAt: t.createdAt,
    })),
    };
  });
};

const updateTenantPlan = async ({ tenantId, planCode }) => {
  return runWithBypass(async () => {
    const targetPlan = await rawPrisma.plan.findUnique({
      where: { code: String(planCode).toUpperCase() },
    });
    if (!targetPlan) {
      const err = new Error(`Plan ${planCode} not found`);
      err.statusCode = 404;
      throw err;
    }

    const updated = await rawPrisma.tenant.update({
      where: { id: tenantId },
      data: { planId: targetPlan.id },
      include: { plan: true, branding: true },
    });

    if (!targetPlan.aiChatbotEnabled && !updated.isDefault && updated.branding?.aiChatbotActive) {
      await rawPrisma.tenantBranding.update({
        where: { tenantId },
        data: { aiChatbotActive: false },
      });
    }

    clearTenantCache();

    // Notify Chatbot Service & Kafka of plan change and chatbot capability toggle
    emitTenantLifecycleEvent({
      event: "TENANT_PLAN_UPDATED",
      tenantId: updated.id,
      slug: updated.slug,
      name: updated.name,
      status: updated.status,
      aiChatbotEnabled: Boolean(targetPlan.aiChatbotEnabled || updated.isDefault),
      planCode: targetPlan.code,
      branding: {
        storeName: updated.branding?.storeName || updated.name,
      },
    }).catch((e) => console.warn("[Tenant Sync Warning]:", e.message));

    return formatPublicTenant(updated);
  });
};

const updateTenantChatbotAccess = async ({ tenantId, aiChatbotEnabled }) => {
  return runWithBypass(async () => {
    const target = await rawPrisma.tenant.findUnique({
      where: { id: tenantId },
      include: { branding: true },
    });
    if (!target) {
      const err = new Error("Store not found");
      err.statusCode = 404;
      throw err;
    }

    const isEnabled = Boolean(aiChatbotEnabled);

    const updatedBranding = await rawPrisma.tenantBranding.upsert({
      where: { tenantId },
      update: { aiChatbotActive: isEnabled },
      create: {
        tenantId,
        storeName: target.name,
        aiChatbotActive: isEnabled,
      },
    });

    clearTenantCache();

    // Notify Chatbot Service & Kafka of chatbot capability toggle
    emitTenantLifecycleEvent({
      event: "TENANT_CHATBOT_UPDATED",
      tenantId: target.id,
      slug: target.slug,
      name: target.name,
      status: target.status,
      aiChatbotEnabled: isEnabled,
      branding: {
        storeName: updatedBranding.storeName || target.name,
        primaryColor: target.branding?.primaryColor || updatedBranding.primaryColor,
        accentColor: target.branding?.accentColor || updatedBranding.accentColor,
      },
    }).catch((e) => console.warn("[Tenant Sync Warning]:", e.message));

    return {
      tenantId: target.id,
      slug: target.slug,
      aiChatbotActive: isEnabled,
      aiChatbotEnabled: isEnabled,
    };
  });
};

const updateTenantStatus = async ({ tenantId, status }) => {
  return runWithBypass(async () => {
    const allowed = new Set(Object.values(TENANT_STATUS));
    if (!allowed.has(status)) {
      const err = new Error("Invalid tenant status");
      err.statusCode = 400;
      throw err;
    }

    const target = await rawPrisma.tenant.findUnique({
      where: { id: tenantId },
      include: { branding: true },
    });
    if (!target) {
      const err = new Error("Store not found");
      err.statusCode = 404;
      throw err;
    }
    if (target.isDefault && (status === TENANT_STATUS.SUSPENDED || status === TENANT_STATUS.CANCELLED)) {
      const err = new Error("Cannot suspend the primary platform store.");
      err.statusCode = 400;
      throw err;
    }

    const updated = await rawPrisma.tenant.update({
      where: { id: tenantId },
      data: { status },
    });

    clearTenantCache();

    // Notify Chatbot Service & Kafka of tenant status change
    emitTenantLifecycleEvent({
      event: "TENANT_STATUS_UPDATED",
      tenantId: updated.id,
      slug: updated.slug,
      name: updated.name,
      status: updated.status,
      aiChatbotEnabled: Boolean(target.branding?.aiChatbotActive !== false),
    }).catch((e) => console.warn("[Tenant Sync Warning]:", e.message));

    return updated;
  });
};

export const authenticatePlatformAdmin = async ({ email, password }) => {
  if (!email || !password) {
    const error = new Error("Email and password are required");
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const admin = await rawPrisma.platformAdmin.findUnique({
    where: { email: normalizedEmail },
  });

  if (!admin) {
    const error = new Error("Invalid platform administrator credentials");
    error.statusCode = 401;
    throw error;
  }

  let isMatch = false;
  if (admin.password) {
    isMatch = await comparePassword(password, admin.password);
  }

  // Fallback: If not set in PlatformAdmin, verify against user account
  if (!isMatch) {
    const userAccount = await rawPrisma.user.findFirst({
      where: { email: normalizedEmail, password: { not: null } },
    });
    if (userAccount && userAccount.password) {
      const userMatch = await comparePassword(password, userAccount.password);
      if (userMatch) {
        isMatch = true;
        // Self-heal and sync password into PlatformAdmin table
        await rawPrisma.platformAdmin.update({
          where: { id: admin.id },
          data: { password: userAccount.password },
        });
      }
    }
  }

  if (!isMatch) {
    const error = new Error("Invalid platform administrator credentials");
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      name: admin.name || "Platform Admin",
      isPlatformAdmin: true,
      tenantRole: "PLATFORM_ADMIN",
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    token,
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name || "Platform Admin",
      isPlatformAdmin: true,
    },
  };
};

export default {
  formatPublicTenant,
  listPlans,
  checkSlugAvailability,
  provisionTenant,
  getCurrentBranding,
  updateCurrentBranding,
  getCurrentSubscription,
  getPlatformOverview,
  updateTenantStatus,
  updateTenantPlan,
  updateTenantChatbotAccess,
  authenticatePlatformAdmin,
};

import prisma, { rawPrisma } from "../prisma/client.js";
import { FEATURE_TYPES, ROLE_TYPES, TENANT_ROLES } from "../utils/constants.js";
import { convertToFullFilePath, deleteFiles } from "../utils/helpers.js";
import { DEFAULT_TENANT_ID, getCurrentTenantId } from "../utils/tenantContext.js";
import { fileService } from "./index.js";

const PLATFORM_ADMIN_EMAILS = new Set(
  (process.env.PLATFORM_ADMIN_EMAILS || "mukeshkumar87086@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

export const checkIsPlatformAdmin = async (email) => {
  if (!email) return false;
  const cleanEmail = String(email).trim().toLowerCase();
  if (PLATFORM_ADMIN_EMAILS.has(cleanEmail)) return true;
  try {
    const admin = await rawPrisma.platformAdmin.findUnique({
      where: { email: cleanEmail },
      select: { id: true },
    });
    return Boolean(admin);
  } catch {
    return false;
  }
};

const getUserInfo = async ({ id }) => {
  const tenantId = getCurrentTenantId();
  const user = await rawPrisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      tenantId: true,
      name: true,
      email: true,
      createdAt: true,
      mobile: true,
      role: true,
      tenantRole: true,
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          customDomain: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  // Enforce strict per-tenant user isolation: a user from Store A does not exist in Store B
  if (tenantId && user.tenantId && user.tenantId !== tenantId) {
    return null;
  }

  const profilePicture = await prisma.file.findFirst({
    where: {
      feature: FEATURE_TYPES.USER,
      featureId: user.id,
    },
    select: {
      id: true,
      path: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const isPlatformAdmin = await checkIsPlatformAdmin(user.email);
  const isTenantAdmin =
    isPlatformAdmin ||
    user.tenantRole === TENANT_ROLES.STORE_OWNER ||
    user.tenantRole === TENANT_ROLES.STORE_STAFF ||
    user.role === ROLE_TYPES.ADMIN;

  const { tenant, ...userFields } = user;

  return {
    ...userFields,
    isPlatformAdmin,
    tenantRole: isPlatformAdmin
      ? TENANT_ROLES.PLATFORM_ADMIN
      : user.tenantRole || TENANT_ROLES.CUSTOMER,
    role: isTenantAdmin ? ROLE_TYPES.ADMIN : ROLE_TYPES.USER,
    stores:
      isTenantAdmin && tenant
        ? [{ ...tenant, role: user.tenantRole || TENANT_ROLES.STORE_OWNER }]
        : [],
    profilePictureFileId: profilePicture ? profilePicture.id : null,
    profilePicture: profilePicture?.path
      ? convertToFullFilePath(profilePicture.path)
      : null,
  };
};

const getUsers = async ({ role }) => {
  const tenantRoles =
    role === ROLE_TYPES.ADMIN
      ? [TENANT_ROLES.STORE_OWNER, TENANT_ROLES.STORE_STAFF]
      : role === ROLE_TYPES.USER
      ? [TENANT_ROLES.CUSTOMER]
      : undefined;

  return prisma.user.findMany({
    where: {
      ...(tenantRoles ? { tenantRole: { in: tenantRoles } } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      mobile: true,
    },
  });
};

const updateProfile = async (
  id,
  { name, mobile, fileIds = [], deletedFileIds = [] }
) => {
  let deletedFiles = [];

  await prisma.$transaction(async (tx) => {
    const [, fileResult] = await Promise.all([
      tx.user.update({
        where: { id },
        data: {
          name,
          mobile,
        },
      }),
      fileService.updateFilesByIds({
        tx,
        feature: FEATURE_TYPES.USER,
        featureId: id,
        fileIds,
        deletedFileIds,
      }),
    ]);

    deletedFiles = fileResult.deletedRecords || [];
  });

  if (deletedFiles.length > 0) {
    deleteFiles(deletedFiles);
  }

  return getUserInfo({ id });
};

const getAll = async ({ skip = 0, take = 10, search, role }) => {
  const tenantRoles =
    role === ROLE_TYPES.ADMIN
      ? [TENANT_ROLES.STORE_OWNER, TENANT_ROLES.STORE_STAFF]
      : role === ROLE_TYPES.USER
      ? [TENANT_ROLES.CUSTOMER]
      : undefined;

  const where = {
    ...(tenantRoles ? { tenantRole: { in: tenantRoles } } : {}),
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { mobile: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, totalCount, platformAdmins] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        status: true,
        role: true,
        tenantRole: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.user.count({ where }),
    rawPrisma.platformAdmin.findMany({
      select: { email: true },
    }),
  ]);

  const platformAdminEmails = new Set(
    platformAdmins.map((p) => String(p.email).toLowerCase())
  );
  for (const envEmail of PLATFORM_ADMIN_EMAILS) {
    platformAdminEmails.add(envEmail);
  }

  const users = rows.map((u) => {
    const isPlatformAdmin = platformAdminEmails.has(
      String(u.email || "").toLowerCase()
    );
    const isTenantAdmin =
      isPlatformAdmin ||
      u.tenantRole === TENANT_ROLES.STORE_OWNER ||
      u.tenantRole === TENANT_ROLES.STORE_STAFF ||
      u.role === ROLE_TYPES.ADMIN;

    return {
      ...u,
      isPlatformAdmin,
      role: isTenantAdmin ? ROLE_TYPES.ADMIN : ROLE_TYPES.USER,
    };
  });

  return { users, totalCount };
};

const changeRole = async ({ id, role }) => {
  const targetTenantRole =
    role === ROLE_TYPES.ADMIN ? TENANT_ROLES.STORE_STAFF : TENANT_ROLES.CUSTOMER;
  const targetRole =
    role === ROLE_TYPES.ADMIN ? ROLE_TYPES.ADMIN : ROLE_TYPES.USER;

  await prisma.user.update({
    where: { id },
    data: {
      role: targetRole,
      tenantRole: targetTenantRole,
    },
  });

  return getUserInfo({ id });
};

export default {
  getUserInfo,
  updateProfile,
  getUsers,
  getAll,
  changeRole,
};

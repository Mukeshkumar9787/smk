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
      isPlatformAdmin: true,
    },
  });

  if (!user) {
    return null;
  }

  // Enforce strict per-tenant user isolation: a user from Store A does not exist in Store B
  if (tenantId && user.tenantId && user.tenantId !== tenantId) {
    return null;
  }

  const [profilePicture, membership, ownedStores] = await Promise.all([
    prisma.file.findFirst({
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
    }),
    tenantId
      ? rawPrisma.tenantMembership.findUnique({
          where: {
            tenantId_userId: {
              tenantId,
              userId: user.id,
            },
          },
          select: { role: true, status: true },
        })
      : null,
    rawPrisma.tenantMembership.findMany({
      where: {
        tenantId,
        userId: user.id,
        role: { in: [TENANT_ROLES.STORE_OWNER, TENANT_ROLES.STORE_STAFF] },
      },
      select: {
        role: true,
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
    }),
  ]);

  const isPlatformAdmin = Boolean(
    user.isPlatformAdmin ||
      (user.tenantId === DEFAULT_TENANT_ID &&
        user.email &&
        PLATFORM_ADMIN_EMAILS.has(String(user.email).toLowerCase()))
  );
  const isTenantAdmin =
    isPlatformAdmin ||
    membership?.role === TENANT_ROLES.STORE_OWNER ||
    membership?.role === TENANT_ROLES.STORE_STAFF;

  return {
    ...user,
    isPlatformAdmin,
    tenantRole: isPlatformAdmin
      ? TENANT_ROLES.PLATFORM_ADMIN
      : membership?.role || TENANT_ROLES.CUSTOMER,
    role: isTenantAdmin ? ROLE_TYPES.ADMIN : ROLE_TYPES.USER,
    stores: ownedStores.map((m) => ({ ...m.tenant, role: m.role })),
    profilePictureFileId: profilePicture ? profilePicture.id : null,
    profilePicture: profilePicture?.path
      ? convertToFullFilePath(profilePicture.path)
      : null,
  };
};

const getUsers = async ({ role }) => {
  const tenantId = getCurrentTenantId();
  const tenantRoles =
    role === ROLE_TYPES.ADMIN
      ? [TENANT_ROLES.STORE_OWNER, TENANT_ROLES.STORE_STAFF]
      : role === ROLE_TYPES.USER
      ? [TENANT_ROLES.CUSTOMER]
      : undefined;

  const memberships = await rawPrisma.tenantMembership.findMany({
    where: {
      tenantId,
      ...(tenantRoles ? { role: { in: tenantRoles } } : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          mobile: true,
        },
      },
    },
  });

  return memberships.map((m) => m.user);
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
  const tenantId = getCurrentTenantId();
  const tenantRoles =
    role === ROLE_TYPES.ADMIN
      ? [TENANT_ROLES.STORE_OWNER, TENANT_ROLES.STORE_STAFF]
      : role === ROLE_TYPES.USER
      ? [TENANT_ROLES.CUSTOMER]
      : undefined;

  const where = {
    tenantId,
    ...(tenantRoles ? { role: { in: tenantRoles } } : {}),
    ...(search
      ? {
          user: {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { mobile: { contains: search, mode: "insensitive" } },
              { name: { contains: search, mode: "insensitive" } },
            ],
          },
        }
      : {}),
  };

  const [memberships, totalCount] = await Promise.all([
    rawPrisma.tenantMembership.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            status: true,
            isPlatformAdmin: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    rawPrisma.tenantMembership.count({ where }),
  ]);

  const users = memberships.map((m) => ({
    ...m.user,
    role:
      m.role === TENANT_ROLES.STORE_OWNER || m.role === TENANT_ROLES.STORE_STAFF
        ? ROLE_TYPES.ADMIN
        : ROLE_TYPES.USER,
    tenantRole: m.role,
  }));

  return { users, totalCount };
};

const changeRole = async ({ id, role }) => {
  const tenantId = getCurrentTenantId();
  const targetUser = await rawPrisma.user.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!targetUser) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const targetTenantRole =
    role === ROLE_TYPES.ADMIN ? TENANT_ROLES.STORE_STAFF : TENANT_ROLES.CUSTOMER;

  await rawPrisma.tenantMembership.upsert({
    where: {
      tenantId_userId: {
        tenantId,
        userId: id,
      },
    },
    create: {
      tenantId,
      userId: id,
      role: targetTenantRole,
    },
    update: {
      role: targetTenantRole,
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

import prisma from "../prisma/client.js";
import { getCurrentTenantId } from "../utils/tenantContext.js";

const createOrUpdate = async ({ config }) => {
  const tenantId = getCurrentTenantId();
  return await prisma.$transaction(async (tx) => {
    const result = [];
    for (const [key, value] of Object.entries(config)) {
      const r = await tx.config.upsert({
        where: { tenantId_key: { tenantId, key } },
        create: { tenantId, key, value },
        update: { value },
      });
      result.push(r);
    }
    return result;
  });
};

const getAll = async ({ "configs[]": configs = null }) => {
  let where = {};
  if (configs) {
    if (typeof configs === "string") {
      where = { key: configs };
    } else {
      where = { key: { in: configs } };
    }
  }
  const config = await prisma.config.findMany({
    select: { key: true, value: true },
    where,
  });
  return config.reduce((a, c) => {
    a[c.key] = c.value;
    return a;
  }, {});
};

export default {
  createOrUpdate,
  getAll,
};

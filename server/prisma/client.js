import dotenv from "dotenv";
import { Prisma, PrismaClient } from "./generated/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { getTenantContext } from "../utils/tenantContext.js";

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const basePrisma = new PrismaClient({
  adapter,
  log: ["warn", "error"],
});

const TENANT_SCOPED_MODELS = new Set([
  "AuditLog",
  "Address",
  "Category",
  "File",
  "Hsn",
  "Product",
  "ProductReview",
  "CartItem",
  "WishlistItem",
  "ProductNotification",
  "Size",
  "Color",
  "Otp",
  "Order",
  "OrderProducts",
  "Stock",
  "OrderStatusHistory",
  "Config",
]);

function modelDelegateName(model) {
  return model.charAt(0).toLowerCase() + model.slice(1);
}

function attachTenantToCreateData(data, tenantId) {
  if (!data || typeof data !== "object") return data;
  if (Array.isArray(data)) {
    return data.map((row) => ({ ...row, tenantId: row.tenantId || tenantId }));
  }
  if (data.tenant || data.tenantId) return data;
  return { ...data, tenantId };
}

const tenantPrisma = basePrisma.$extends({
  name: "tenant-isolation",
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (!model || !TENANT_SCOPED_MODELS.has(model)) {
          return query(args);
        }

        const ctx = getTenantContext();
        if (!ctx?.tenantId) {
          return query(args);
        }
        const tenantId = ctx.tenantId;
        const nextArgs = args ? { ...args } : {};

        switch (operation) {
          case "findMany":
          case "findFirst":
          case "findFirstOrThrow":
          case "count":
          case "aggregate":
          case "groupBy":
          case "updateMany":
          case "deleteMany": {
            nextArgs.where = {
              ...(nextArgs.where || {}),
              tenantId,
            };
            return query(nextArgs);
          }

          case "findUnique":
          case "findUniqueOrThrow": {
            const result = await query(nextArgs);
            if (result && result.tenantId && result.tenantId !== tenantId) {
              if (operation === "findUniqueOrThrow") {
                const err = new Error(`${model} not found`);
                err.statusCode = 404;
                throw err;
              }
              return null;
            }
            return result;
          }

          case "create": {
            nextArgs.data = attachTenantToCreateData(nextArgs.data, tenantId);
            return query(nextArgs);
          }

          case "createMany":
          case "createManyAndReturn": {
            nextArgs.data = attachTenantToCreateData(nextArgs.data, tenantId);
            return query(nextArgs);
          }

          case "upsert": {
            nextArgs.create = attachTenantToCreateData(nextArgs.create, tenantId);
            return query(nextArgs);
          }

          case "update":
          case "delete": {
            if (nextArgs.where) {
              const delegate = basePrisma[modelDelegateName(model)];
              if (delegate?.findFirst) {
                const owned = await delegate.findFirst({
                  where: { ...nextArgs.where, tenantId },
                  select: { id: true },
                });
                if (!owned) {
                  const err = new Error(`${model} not found`);
                  err.statusCode = 404;
                  throw err;
                }
              }
            }
            return query(nextArgs);
          }

          default:
            return query(nextArgs);
        }
      },
    },
  },
});

export const rawPrisma = basePrisma;
export const PrismaConfig = Prisma;
export default tenantPrisma;

import dotenv from "dotenv";
import pg from "pg";
import { Prisma, PrismaClient } from "./generated/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { getTenantContext, DEFAULT_TENANT_ID } from "../utils/tenantContext.js";

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_URL?.includes("sslmode=require") ||
    process.env.DATABASE_URL?.includes("db.prisma.io")
      ? { rejectUnauthorized: false }
      : false,
});

// Intercept PostgreSQL pool client checkouts to enforce PostgreSQL Row-Level Security (RLS)
const origConnect = pool.connect.bind(pool);
pool.connect = function (callback) {
  if (typeof callback === "function") {
    return origConnect(async (err, client, release) => {
      if (err) return callback(err, client, release);
      try {
        const ctx = getTenantContext();
        const tid = ctx?.tenantId || DEFAULT_TENANT_ID;
        const bypass = ctx?.bypassRls ? "true" : "false";
        const userId = ctx?.userId ? String(ctx.userId) : "";
        const isStoreAdmin = ctx?.isStoreAdmin ? "true" : "false";

        if (ctx?.bypassRls) {
          try {
            await client.query("RESET ROLE;");
          } catch (e) {}
        } else {
          try {
            await client.query("SET ROLE prisma_application;");
          } catch (e) {}
        }

        await client.query(
          "SELECT set_config('app.current_tenant_id', $1, false), set_config('app.bypass_rls', $2, false), set_config('app.current_user_id', $3, false), set_config('app.is_store_admin', $4, false);",
          [tid, bypass, userId, isStoreAdmin]
        );
        return callback(null, client, release);
      } catch (setupErr) {
        release(setupErr);
        return callback(setupErr);
      }
    });
  }

  return (async () => {
    const client = await origConnect();
    const ctx = getTenantContext();
    const tid = ctx?.tenantId || DEFAULT_TENANT_ID;
    const bypass = ctx?.bypassRls ? "true" : "false";
    const userId = ctx?.userId ? String(ctx.userId) : "";
    const isStoreAdmin = ctx?.isStoreAdmin ? "true" : "false";

    if (ctx?.bypassRls) {
      try {
        await client.query("RESET ROLE;");
      } catch (e) {}
    } else {
      try {
        await client.query("SET ROLE prisma_application;");
      } catch (e) {}
    }

    await client.query(
      "SELECT set_config('app.current_tenant_id', $1, false), set_config('app.bypass_rls', $2, false), set_config('app.current_user_id', $3, false), set_config('app.is_store_admin', $4, false);",
      [tid, bypass, userId, isStoreAdmin]
    );
    return client;
  })();
};

const adapter = new PrismaPg(pool);

const basePrisma = new PrismaClient({
  adapter,
  log: ["warn", "error"],
});

const TENANT_SCOPED_MODELS = new Set([
  "User",
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

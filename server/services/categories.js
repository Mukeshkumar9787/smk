import prisma, { PrismaConfig } from "../prisma/client.js";

import { FEATURE_TYPES } from "../utils/constants.js";
import { convertToFullFilePath, deleteFiles, slugText } from "../utils/helpers.js";
import { getCurrentTenantId } from "../utils/tenantContext.js";
import { fileService } from "./index.js";

const getCategoryFileIds = async ({ tx = prisma, categoryId }) => {
  const files = await tx.file.findMany({
    where: {
      feature: FEATURE_TYPES.CATEGORY,
      featureId: categoryId,
    },
    select: {
      id: true,
    },
    orderBy: [{ createdAt: "asc" }],
  });

  return files.map((file) => file.id);
};

/**
 * Create category
 */
const createCategory = async ({ title, fileIds = [], status, deletedFileIds = [] }) => {
  let category = null;
  const normalizedFileIds = fileIds.slice(0, 1);

  await prisma.$transaction( async (tx) => {
    category = await tx.category.create({ data: { title, slug: slugText(title), status }});
    await fileService.updateFilesByIds({
      tx,
      feature: FEATURE_TYPES.CATEGORY,
      featureId: category.id,
      fileIds: normalizedFileIds,
      deletedFileIds,
    });
  })

  return {
    id: category.id,
    title: category.title,
    createdAt: category.createdAt,
  };
};

/**
 * Get all categories
 */
const getCategories = async ({ status, includeProductCount = false }) => {
  const tenantId = getCurrentTenantId();
  const conditions = [PrismaConfig.sql`c."tenantId" = ${tenantId}`];

  if (status) {
    conditions.push(PrismaConfig.sql`c.status = ${status}`);
  }

  const whereClause =
    conditions.length
      ? PrismaConfig.sql`WHERE ${PrismaConfig.join(conditions, " AND ")}`
      : PrismaConfig.empty;

  let includeProductCountClause = PrismaConfig.empty;
  if(includeProductCount){
    includeProductCountClause = PrismaConfig.sql`,(SELECT COUNT(1)::TEXT FROM "Product" p where p."categoryId" = c.id AND p."tenantId" = ${tenantId}) as "productCount"`
  };

  const categories = await prisma.$queryRaw`
    SELECT
      c.id,
      c.title,
      c.status,
      c.slug,
      (
        SELECT f.path
        FROM "File" f
        WHERE f."featureId" = c.id AND f."feature" = ${FEATURE_TYPES.CATEGORY} AND f."tenantId" = ${tenantId}
        ORDER BY f."createdAt" ASC
        LIMIT 1
      ) AS img
      ${includeProductCountClause}
    FROM "Category" c
    ${whereClause}
    ORDER BY c."createdAt" DESC;
  `;
  
  return categories.map(i => {
    if(i.img){
      i.img = convertToFullFilePath(i.img);
    }
    return i;
  });
};

/**
 * Get single category
 */
const getCategoryBySlug = async (slug) => {
  const tenantId = getCurrentTenantId();
  const categories = await prisma.$queryRaw`
    select
      c.id,
      c.title,
      c.status,
      c.slug,
      (
        select f.path
        from "File" f
        where f."featureId" = c.id and f."feature" = ${FEATURE_TYPES.CATEGORY} and f."tenantId" = ${tenantId}
        order by f."createdAt" asc
        limit 1
      ) as img,
      (
        select f.id
        from "File" f
        where f."featureId" = c.id and f."feature" = ${FEATURE_TYPES.CATEGORY} and f."tenantId" = ${tenantId}
        order by f."createdAt" asc
        limit 1
      ) as "fileId"
    from "Category" c
    where c.slug = ${slug} and c."tenantId" = ${tenantId}
    order by c."createdAt" desc;
  `;
  if (categories.length === 0) {
    const err = new Error("Category not found");
    err.statusCode = 404;
    throw err;
  }
  let category = categories[0]; 
  category.img = convertToFullFilePath(category.img);
  return category;
};

/**
 * Update category
 */
const updateCategory = async (id, { title, fileIds = [], deletedFileIds = [], status }) => {
  let updated = null;
  let deletedFiles = [];
  const normalizedFileIds = fileIds.slice(0, 1);
  const shouldDeleteOldImages = normalizedFileIds.length > 0;

  await prisma.$transaction(async (tx) => {
    let normalizedDeletedFileIds = [...deletedFileIds];
    if (shouldDeleteOldImages) {
      const existingFileIds = await getCategoryFileIds({ tx, categoryId: id });
      const keptFileId = normalizedFileIds[0];
      const deletedCategoryFileIds = existingFileIds.filter((fileId) => fileId !== keptFileId);
      normalizedDeletedFileIds = [...new Set([...normalizedDeletedFileIds, ...deletedCategoryFileIds])];
    }
    let deletedRecords;
    [updated, { deletedRecords }] = await Promise.all([
      tx.category.update({
        where: { id },
        data: {
          title,
          slug: slugText(title),
          status
        },
      }),
      fileService.updateFilesByIds({
        tx,
        feature: FEATURE_TYPES.CATEGORY,
        featureId: id,
        fileIds: normalizedFileIds,
        deletedFileIds: normalizedDeletedFileIds,
      })
    ]);
    deletedFiles = deletedRecords;
  })

  if (!updated) {
    const err = new Error("Category not found");
    err.statusCode = 404;
    throw err;
  }

  deleteFiles(deletedFiles);
  return updated;
};

/**
 * Soft delete category
 */
const deleteCategory = async (id) => {
  const deleted = await prisma.category.delete({
    where: { id },
  });

  if (!deleted) {
    const err = new Error("Category not found");
    err.statusCode = 404;
    throw err;
  }

  return {
    id: deleted.id,
  };
};

export default {
  createCategory,
  getCategories,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
};

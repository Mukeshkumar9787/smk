import prisma, { PrismaConfig } from "../prisma/client.js";
import { convertToFullFilePath } from "../utils/helpers.js";
import { getDirectUploadConfig, isR2Configured, uploadFileToR2 } from "../utils/r2.js";
import { getCurrentTenantId } from "../utils/tenantContext.js";

/**
 * Create File
 */
const createFile = async ({ file }) => {
  const uploadedFile = await uploadFileToR2(file);
  const createdFile = await prisma.file.create({
    data: {
      path: uploadedFile.path,
    }
  });

  return {
    id: createdFile.id,
    path: convertToFullFilePath(createdFile.path),
  };
};

const createFileFromPath = async ({ path }) => {
  const createdFile = await prisma.file.create({
    data: {
      path,
    },
  });

  return {
    id: createdFile.id,
    path: convertToFullFilePath(createdFile.path),
  };
};

const getUploadConfig = async ({ filename, contentType }) => {
  if (isR2Configured()) {
    return {
      strategy: "direct",
      ...(await getDirectUploadConfig({ filename, contentType }))
    };
  }

  return {
    strategy: "server",
  };
};

const updateFilesByIds = async ({ tx=prisma, feature, featureId, fileIds=[], deletedFileIds=[]}) => {

  let fileUploadPromise = [];
  if(fileIds.length > 0){
    fileUploadPromise = tx.file.updateManyAndReturn({ 
        select: {id: true, path: true},
        where: { id: { in: fileIds } },
        data: { feature, featureId }
      });
  }

  let deleteFilesPromise = [];

  if(deletedFileIds.length > 0){
      const tenantId = getCurrentTenantId();
      let condition = PrismaConfig.sql`id in (${PrismaConfig.join(deletedFileIds,`,`)}) AND "tenantId" = ${tenantId}`
      deleteFilesPromise = await prisma.$queryRaw`
      DELETE FROM "File"
      WHERE ${condition}
      RETURNING id, path;
    `;
  }
  
  const [updatedRecords, deletedRecords] = await Promise.all([
    fileUploadPromise,
    deleteFilesPromise
  ]);

  return {
    updatedRecords,
    deletedRecords
  }
}

const getFilesByFeatureIds = async ({ tx= prisma, feature, featureIds = [] }) => {
  const files = await tx.file.findMany({
    where: {
      feature,
      featureId: { in: featureIds}
    }
  })
  return files.map(i => ({id: i.id, feature:i.feature, featureId: i.featureId, path: convertToFullFilePath(i.path)}))
}

export default {
  getUploadConfig,
  createFile,
  createFileFromPath,
  updateFilesByIds,
  getFilesByFeatureIds
};

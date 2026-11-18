import prisma from "../prisma/client.js";

/**
 * Create HSN
 */
const createHsn = async ({ code, status, tax }) => {
  const hsn = await prisma.hsn.create({ data: { code, status, tax }});

  return {
    id: hsn.id,
    code: hsn.code,
    createdAt: hsn.createdAt,
  };
};

/**
 * Get all HsnCodes
 */
const getHsnCodes = async ({ status }) => {
  
  const hsnCodes = await prisma.hsn.findMany({
    select: {
      id: true,
      code: true,
      tax: true,
      status: true
    },
    where: {
      status: status ? status : undefined
    }
  })
  return hsnCodes;
};

/**
 * Get single hsn
 */
const getHsnBySlug = async (code) => {
  const hsn = await prisma.hsn.findFirst({
    select: {
      id: true,
      code: true,
      tax: true,
      status: true
    },
    where: {
      code
    }
  })
  return hsn
};

/**
 * Update hsn
 */
const updateHsn = async (id, { code , status, tax }) => {
  const hsn = await prisma.hsn.update({ 
    data: { code, status, tax },
    where: {
      id
    }
  });

  return {
    id: hsn.id,
    code: hsn.code,
    createdAt: hsn.createdAt,
  };
};

/**
 * Soft delete hsn
 */
const deleteHsn = async (id) => {
  const deleted = await prisma.hsn.delete({
    where: { id },
  });

  if (!deleted) {
    const err = new Error("hsn not found");
    err.statusCode = 404;
    throw err;
  }

  return {
    id: deleted.id,
  };
};

export default {
  createHsn,
  getHsnCodes,
  getHsnBySlug,
  updateHsn,
  deleteHsn,
};

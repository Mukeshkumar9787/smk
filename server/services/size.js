import prisma from "../prisma/client.js";

/**
 * Create Size
 */
const createSize = async ({ title, status }) => {
  const Size = await prisma.size.create({ data: { title, status }});

  return {
    id: Size.id,
    title: Size.title,
    createdAt: Size.createdAt,
  };
};

/**
 * Get all Sizetitles
 */
const getSizes = async ({ status }) => {
  
  const Sizetitles = await prisma.size.findMany({
    select: {
      id: true,
      title: true,
      status: true
    },
    where: {
      status: status ? status : undefined
    }
  })
  return Sizetitles;
};

/**
 * Get single Size
 */
const getSizeBySlug = async (title) => {
  const Size = await prisma.size.findFirst({
    select: {
      id: true,
      title: true,
      status: true
    },
    where: {
      title
    }
  })
  return Size
};

/**
 * Update Size
 */
const updateSize = async (id, { title , status }) => {
  const Size = await prisma.size.update({ 
    data: { title, status },
    where: {
      id
    }
  });

  return {
    id: Size.id,
    title: Size.title,
    createdAt: Size.createdAt,
  };
};

/**
 * Soft delete Size
 */
const deleteSize = async (id) => {
  const deleted = await prisma.size.delete({
    where: { id },
  });

  if (!deleted) {
    const err = new Error("Size not found");
    err.statustitle = 404;
    throw err;
  }

  return {
    id: deleted.id,
  };
};

export default {
  createSize,
  getSizes,
  getSizeBySlug,
  updateSize,
  deleteSize,
};

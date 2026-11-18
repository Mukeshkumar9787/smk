import prisma from "../prisma/client.js";

/**
 * Create Color
 */
const create = async ({ title, code, status }) => {
  const Color = await prisma.color.create({ data: { title, code, status }});

  return {
    id: Color.id,
    title: Color.title,
    createdAt: Color.createdAt,
  };
};

/**
 * Get all Colortitles
 */
const getAll = async ({ status }) => {
  
  const Colortitles = await prisma.color.findMany({
    select: {
      id: true,
      title: true,
      code: true,
      status: true
    },
    where: {
      status: status ? status : undefined
    }
  })
  return Colortitles;
};

/**
 * Get single Color
 */
const getBySlug = async (title) => {
  const Color = await prisma.color.findFirst({
    select: {
      id: true,
      title: true,
      code: true,
      status: true
    },
    where: {
      title
    }
  })
  return Color
};

/**
 * Update Color
 */
const update = async (id, { title , code, status }) => {
  const Color = await prisma.color.update({ 
    data: { title, code, status },
    where: {
      id
    }
  });

  return {
    id: Color.id,
    title: Color.title,
    createdAt: Color.createdAt,
  };
};

/**
 * Soft delete Color
 */
const deleteById = async (id) => {
  const deleted = await prisma.color.delete({
    where: { id },
  });

  if (!deleted) {
    const err = new Error("Color not found");
    err.statustitle = 404;
    throw err;
  }

  return {
    id: deleted.id,
  };
};

export default {
  create,
  getAll,
  getBySlug,
  update,
  deleteById,
};

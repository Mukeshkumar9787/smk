import { productService } from "../services/index.js";
import { STATUS_TYPES } from "../utils/constants.js";
import { errorHandler } from "../utils/errorHandler.js";

const createProduct = async (req, res) => {
  try {

    const result = await productService.createProduct(req.body);

    return res.status(201).json({
      success: true,
      message: "product created successfully",
      data: result,
    });
  } catch (err) {
    return errorHandler(err, res);
  }
};

const getActiveProducts = async (req, res) => {
  try {
    const { products, totalCount} = await productService.getProducts({...req.query, status: STATUS_TYPES.ACTIVE });
    return res.status(200).json({
      success: true,
      data: products,
      totalCount
    });
  } catch (err) {
    return errorHandler(err, res);
  }
};

const getProducts = async (req, res) => {
  try {
    const { products, totalCount} = await productService.getProducts(req.query);
    return res.status(200).json({
      success: true,
      data: products,
      totalCount
    });
  } catch (err) {
    return errorHandler(err, res);
  }
};

const getProductBySlug = async (req, res) => {
  try {
    const result = await productService.getProductBySlug(req.params.slug);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    return errorHandler(err, res);
  }
};

const getProductBySlugAdmin = async (req, res) => {
  try {
    const result = await productService.getProductBySlug(req.params.slug, { allowInactive: true });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    return errorHandler(err, res);
  }
};

const updateProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const result = await productService.updateProduct(id, req.body);

    return res.status(200).json({
      success: true,
      message: "product updated successfully",
      data: result,
    });
  } catch (err) {
    return errorHandler(err, res);
  }
};

const deleteProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const result = await productService.deleteProduct(id);

    return res.status(200).json({
      success: true,
      message: "product deleted successfully",
      data: result,
    });
  } catch (err) {
    return errorHandler(err, res);
  }
};

const subscribeProductRestockNotification = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    if (Number.isNaN(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }
    const result = await productService.subscribeProductRestockNotification({
      productId,
      user: req.user,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (err) {
    return errorHandler(err, res);
  }
};

const getProductReviews = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    if (Number.isNaN(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }
    const data = await productService.getProductReviews({ productId, includeHidden: false });
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return errorHandler(err, res);
  }
};

const getMyProductReview = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    if (Number.isNaN(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }
    const data = await productService.getProductReviewByUser({
      productId,
      userId: req.user.id,
    });
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return errorHandler(err, res);
  }
};

const addOrUpdateProductReview = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    if (Number.isNaN(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }
    const data = await productService.addOrUpdateProductReview({
      productId,
      userId: req.user.id,
      ...req.body,
    });
    return res.status(200).json({
      success: true,
      message: "Review saved successfully",
      data,
    });
  } catch (err) {
    return errorHandler(err, res);
  }
};

const updateMyProductReview = async (req, res) => {
  try {
    const reviewId = Number(req.params.reviewId);
    if (Number.isNaN(reviewId)) {
      return res.status(400).json({ success: false, message: "Invalid review id" });
    }
    const data = await productService.updateProductReviewByUser({
      reviewId,
      userId: req.user.id,
      ...req.body,
    });
    return res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data,
    });
  } catch (err) {
    return errorHandler(err, res);
  }
};

const deleteMyProductReview = async (req, res) => {
  try {
    const reviewId = Number(req.params.reviewId);
    if (Number.isNaN(reviewId)) {
      return res.status(400).json({ success: false, message: "Invalid review id" });
    }
    const data = await productService.deleteProductReviewByUser({
      reviewId,
      userId: req.user.id,
    });
    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
      data,
    });
  } catch (err) {
    return errorHandler(err, res);
  }
};

const getProductReviewsAdmin = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    if (Number.isNaN(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }
    const data = await productService.getProductReviews({ productId, includeHidden: true });
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return errorHandler(err, res);
  }
};

const updateProductReviewVisibility = async (req, res) => {
  try {
    const reviewId = Number(req.params.reviewId);
    if (Number.isNaN(reviewId)) {
      return res.status(400).json({ success: false, message: "Invalid review id" });
    }
    const data = await productService.updateProductReviewVisibility({
      reviewId,
      isHidden: req.body.isHidden,
    });
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return errorHandler(err, res);
  }
};

const restockProduct = async (req, res) => {
  try {
    const { slug, productId, quantity, poNumber } = req.body;
    const result = await productService.restockProduct({
      slug,
      productId,
      quantity,
      poNumber,
    });
    return res.status(200).json({
      success: true,
      message: `Product stock replenished (+${result.addedQuantity} units)`,
      data: result,
    });
  } catch (err) {
    return errorHandler(err, res);
  }
};

export default {
  createProduct,
  getProducts,
  getActiveProducts,
  getProductBySlug,
  getProductBySlugAdmin,
  updateProduct,
  deleteProduct,
  subscribeProductRestockNotification,
  getProductReviews,
  getMyProductReview,
  addOrUpdateProductReview,
  updateMyProductReview,
  deleteMyProductReview,
  getProductReviewsAdmin,
  updateProductReviewVisibility,
  restockProduct,
};

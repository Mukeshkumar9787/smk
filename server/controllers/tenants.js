import tenantService from "../services/tenants.js";
import { errorHandler } from "../utils/errorHandler.js";

const resolveCurrentTenant = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: tenantService.formatPublicTenant(req.tenant),
    });
  } catch (err) {
    return errorHandler(err, res);
  }
};

const listPlans = async (req, res) => {
  try {
    const data = await tenantService.listPlans();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return errorHandler(err, res);
  }
};

const checkSlug = async (req, res) => {
  try {
    const data = await tenantService.checkSlugAvailability(req.params.slug);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return errorHandler(err, res);
  }
};

const provision = async (req, res) => {
  try {
    const data = await tenantService.provisionTenant({
      ...req.body,
      actorUser: req.user || null,
    });
    return res.status(201).json({
      success: true,
      message: "Store created successfully",
      data,
    });
  } catch (err) {
    return errorHandler(err, res);
  }
};

const getCurrentBranding = async (req, res) => {
  try {
    const data = await tenantService.getCurrentBranding();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return errorHandler(err, res);
  }
};

const updateCurrentBranding = async (req, res) => {
  try {
    const data = await tenantService.updateCurrentBranding(req.body);
    return res.status(200).json({
      success: true,
      message: "Store branding and theme updated successfully",
      data,
    });
  } catch (err) {
    return errorHandler(err, res);
  }
};

const getCurrentSubscription = async (req, res) => {
  try {
    const data = await tenantService.getCurrentSubscription();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return errorHandler(err, res);
  }
};

const getPlatformOverview = async (req, res) => {
  try {
    const data = await tenantService.getPlatformOverview();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return errorHandler(err, res);
  }
};

const updateTenantStatus = async (req, res) => {
  try {
    const data = await tenantService.updateTenantStatus({
      tenantId: req.params.tenantId,
      status: req.body?.status,
    });
    return res.status(200).json({
      success: true,
      message: "Store status updated",
      data,
    });
  } catch (err) {
    return errorHandler(err, res);
  }
};

const createPlatformTenant = async (req, res) => {
  try {
    const data = await tenantService.provisionTenant({
      ...req.body,
      actorUser: req.user,
    });
    return res.status(201).json({
      success: true,
      message: "Tenant store created by Super Admin",
      data,
    });
  } catch (err) {
    return errorHandler(err, res);
  }
};

const updateTenantPlan = async (req, res) => {
  try {
    const data = await tenantService.updateTenantPlan({
      tenantId: req.params.tenantId,
      planCode: req.body?.planCode,
    });
    return res.status(200).json({
      success: true,
      message: "Store plan updated successfully",
      data,
    });
  } catch (err) {
    return errorHandler(err, res);
  }
};

export default {
  resolveCurrentTenant,
  listPlans,
  checkSlug,
  provision,
  getCurrentBranding,
  updateCurrentBranding,
  getCurrentSubscription,
  getPlatformOverview,
  updateTenantStatus,
  createPlatformTenant,
  updateTenantPlan,
};

import Joi from "joi";
import { CONFIG_KEYS, ORDER_STATUS, OTP_TYPES, ROLE_TYPES, STATUS_TYPES } from "./constants.js";

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  mobile: Joi.string().min(1).max(12).required(),
  fileIds: Joi.array()
    .items(Joi.number().integer().positive())
    .optional(),
  deletedFileIds: Joi.array()
    .items(Joi.number().integer().positive())
    .optional(),
});

export const categoryBodySchema = Joi.object({
  title: Joi.string().min(1).max(100).required(),
  fileIds: Joi.array()
    .items(Joi.number().integer().positive())
    .max(1)
    .optional(),
  deletedFileIds: Joi.array()
    .items(Joi.number().integer().positive())
    .optional(),
  status: Joi.string()
    .valid(...Object.values(STATUS_TYPES))
    .default(STATUS_TYPES.ACTIVE),
});

export const hsnBodySchema = Joi.object({
  code: Joi.string().min(1).max(100).required(),
  tax: Joi.number().min(1).max(100).required(),
  status: Joi.string()
    .valid(...Object.values(STATUS_TYPES))
    .default(STATUS_TYPES.ACTIVE),
});

export const productBodySchema = Joi.object({
  title: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(2000).allow("").optional(),
  variant: Joi.string().min(1).max(100).required(),
  categoryId: Joi.number().required(), 
  hsnId: Joi.number().optional(), 
  colorId: Joi.number().optional(), 
  sizeId: Joi.number().optional(), 
  mrp: Joi.number().required(), 
  price: Joi.number().required(), 
  stock: Joi.number().required(), 
  fileIds: Joi.array()
    .items(Joi.number().integer().positive())
    .optional(),
  deletedFileIds: Joi.array()
    .items(Joi.number().integer().positive())
    .optional(),
  status: Joi.string()
    .valid(...Object.values(STATUS_TYPES))
    .default(STATUS_TYPES.ACTIVE),
});

export const productUpdateSchema = productBodySchema.keys({
  oldStockQty: Joi.number().min(0).required(),
});

export const sizeBodySchema = Joi.object({
  title: Joi.string().min(1).max(100).required(),
  status: Joi.string()
    .valid(...Object.values(STATUS_TYPES))
    .default(STATUS_TYPES.ACTIVE),
});

export const colorBodySchema = Joi.object({
  title: Joi.string().min(1).max(100).required(),
  code: Joi.string().min(1).max(100).required(),
  status: Joi.string()
    .valid(...Object.values(STATUS_TYPES))
    .default(STATUS_TYPES.ACTIVE),
});

export const loginSchema = Joi.object({
  email: Joi.string().min(1).max(100).required(),
  password: Joi.string()
    .pattern(/^(?=.*[A-Z])(?=.*\d).{8,}$/)
    .required(),
  status: Joi.string()
    .valid(...Object.values(STATUS_TYPES))
    .default(STATUS_TYPES.ACTIVE),
  turnstileToken: Joi.string().allow("", null).optional(),
});

export const registerSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  email: Joi.string().min(1).max(100).required(),
  mobile: Joi.string().min(1).max(12).required(),
  password: Joi.string()
    .pattern(/^(?=.*[A-Z])(?=.*\d).{8,}$/)
    .required(),
  turnstileToken: Joi.string().allow("", null).optional(),
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().min(1).max(100).required(),
  password: Joi.string()
    .pattern(/^(?=.*[A-Z])(?=.*\d).{8,}$/)
    .required(),
  turnstileToken: Joi.string().allow("", null).optional(),
});

export const verifyOTPSchema = Joi.object({
  email: Joi.string().min(1).max(100).required(),
  type: Joi.string()
    .valid(...Object.values(OTP_TYPES)),
  otp: Joi.string().min(6).required(),
  turnstileToken: Joi.string().allow("", null).optional(),
});

export const verifyGoogleTokenSchema = Joi.object({
  token: Joi.string()
});

export const loginWithOTPSchema = Joi.object({
  email: Joi.string().min(1).max(100).required(),
  turnstileToken: Joi.string().allow("", null).optional(),
});

export const createOrderSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  mobile: Joi.string().min(1).max(12).required(),
  address: Joi.string().min(1).max(100).required(),
  city: Joi.string().min(1).max(100).required(),
  pincode: Joi.string().min(1).max(100).required(),
  country: Joi.string().min(1).max(100).required(),
  state: Joi.string().min(1).max(100).required(),

  isDiffBillAdd: Joi.boolean().default(false),

  shippingAmount: Joi.number().default(0),

  billingName: Joi.when('isDiffBillAdd', {
    is: true,
    then: Joi.string().min(1).max(100).required(),
    otherwise: Joi.string().min(1).max(100).optional().allow(null, '')
  }),

  billingMobile: Joi.when('isDiffBillAdd', {
    is: true,
    then: Joi.string().min(1).max(12).required(),
    otherwise: Joi.string().min(1).max(12).optional().allow(null, '')
  }),

  billingAddress: Joi.when('isDiffBillAdd', {
    is: true,
    then: Joi.string().min(1).max(100).required(),
    otherwise: Joi.string().min(1).max(100).optional().allow(null, '')
  }),

  billingCity: Joi.when('isDiffBillAdd', {
    is: true,
    then: Joi.string().min(1).max(100).required(),
    otherwise: Joi.string().min(1).max(100).optional().allow(null, '')
  }),

  billingPincode: Joi.when('isDiffBillAdd', {
    is: true,
    then: Joi.string().min(1).max(100).required(),
    otherwise: Joi.string().min(1).max(100).optional().allow(null, '')
  }),

  billingCountry: Joi.when('isDiffBillAdd', {
    is: true,
    then: Joi.string().min(1).max(100).required(),
    otherwise: Joi.string().min(1).max(100).optional().allow(null, '')
  }),

  billingState: Joi.when('isDiffBillAdd', {
    is: true,
    then: Joi.string().min(1).max(100).required(),
    otherwise: Joi.string().min(1).max(100).optional().allow(null, '')
  }),

  gstNo: Joi.string().min(1).max(100).optional().empty(''),

  notes: Joi.string().max(100).optional().empty(''),

  orderProducts: Joi.array()
    .items(
      Joi.object({
        productId: Joi.number().required(),
        title: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
        price: Joi.number().positive().required(),
        mrp: Joi.number().positive().required(),
      })
    )
    .min(1)
    .required(),

  turnstileToken: Joi.string().allow('', null).optional()
});

export const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(ORDER_STATUS)).required(),
  meta: Joi.optional()
});

export const updateOrderSchema = Joi.object({
  additionalInfo: Joi.object({
    courier: Joi.string().allow("").required(),
    trackingId: Joi.string().allow("").optional(),
    dispute: Joi.object({
      message: Joi.string().min(5).max(1000).required(),
      status: Joi.string().valid("OPEN").required(),
      createdAt: Joi.string().required(),
      updatedAt: Joi.string().optional(),
      raisedByUserId: Joi.number().required(),
      raisedByName: Joi.string().allow("").required(),
    }).optional(),
  }).required()
});

export const createOrderDisputeSchema = Joi.object({
  message: Joi.string().trim().min(5).max(1000).required(),
});

export const configBodySchema = Joi.object({
  config: Joi.object({
    COMP_INFO: Joi.object({
      name: Joi.string().required(),
      mobile: Joi.string().required(),
      email: Joi.string().required(),
      address: Joi.string().required(),
      facebook: Joi.string().allow("").optional(),
      instagram: Joi.string().allow("").optional(),
      twitter: Joi.string().allow("").optional(),
      privacy: Joi.string().allow("").optional(),
      refund: Joi.string().allow("").optional(),
      terms: Joi.string().allow("").optional(),
    }).optional(),

    SHIPPING: Joi.object({
      amount: Joi.number().required(),

      countries: Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          amount: Joi.number().required(),

          states: Joi.array().items(
            Joi.object({
              name: Joi.string().required(),
              amount: Joi.number().required()
            })
          ).optional()
        })
      ).optional()
    }).optional(),

    COURIER: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        link: Joi.string().allow("").optional()
      })
    ).optional(),

  }).required()
});

export const changeRoleSchema = Joi.object({
  userId: Joi.number().required(),
  role: Joi.string().valid(...Object.values(ROLE_TYPES)).required()
});

export const addressBodySchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  mobile: Joi.string().min(1).max(12).required(),
  address: Joi.string().min(1).max(100).required(),
  city: Joi.string().min(1).max(100).required(),
  pincode: Joi.string().min(1).max(100).required(),
  country: Joi.string().min(1).max(100).required(),
  state: Joi.string().min(1).max(100).required(),
});

export const replaceCartSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.number().integer().positive().required(),
        quantity: Joi.number().integer().min(0).required(),
      })
    )
    .required(),
});

export const replaceWishlistSchema = Joi.object({
  items: Joi.array()
    .items(Joi.number().integer().positive())
    .required(),
});

export const productReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(1000).allow("").optional(),
});

export const reviewVisibilitySchema = Joi.object({
  isHidden: Joi.boolean().required(),
});

export const restockProductSchema = Joi.object({
  slug: Joi.string().trim().optional(),
  sku: Joi.string().trim().optional(),
  productId: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().pattern(/^\d+$/)).optional(),
  product_id: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().pattern(/^\d+$/)).optional(),
  id: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().pattern(/^\d+$/)).optional(),
  quantity: Joi.number().integer().positive().max(19).optional(),
  qty: Joi.number().integer().positive().max(19).optional(),
  poNumber: Joi.string().allow("", null).optional(),
  po_number: Joi.string().allow("", null).optional(),
}).or("slug", "sku", "productId", "product_id", "id").or("quantity", "qty");


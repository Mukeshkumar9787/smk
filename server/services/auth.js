import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma, { rawPrisma } from "../prisma/client.js";
import { generateSecureOTP, hashedPassword, hashOTP } from "../utils/cryptoUtils.js";
import { sendMail } from "../utils/mailUtils.js";
import { FEATURE_TYPES, OTP_TYPES, TENANT_ROLES } from "../utils/constants.js";
import { getAppName, isOtpExpired } from "../utils/helpers.js";
import { getCurrentTenantId } from "../utils/tenantContext.js";
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

async function findTenantUserByEmail(email) {
  const cleanEmail = normalizeEmail(email);
  const tenantId = getCurrentTenantId();
  if (!cleanEmail) return null;

  const exact = await rawPrisma.user.findUnique({
    where: {
      tenantId_email: {
        tenantId,
        email: cleanEmail,
      },
    },
  });
  if (exact) return exact;

  // Case-insensitive fallback for legacy mixed-case emails within the same tenant
  return rawPrisma.user.findFirst({
    where: {
      tenantId,
      email: {
        equals: cleanEmail,
        mode: "insensitive",
      },
    },
  });
}

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, tenantId: user.tenantId || getCurrentTenantId() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

const register = async ({ name, email, password, mobile }) => {
  const cleanEmail = normalizeEmail(email);
  const existing = await findTenantUserByEmail(cleanEmail);

  if (existing) {
    const err = new Error("Account already exists");
    err.statusCode = 400;
    throw err;
  }
  const otp = generateSecureOTP();
  const appName = await getAppName();
  sendMail({ to: cleanEmail, 
    subject: `${appName} OTP for Registration`, 
    html: `
    <h2>OTP Verification</h2>
    <p>Your OTP is:</p>
    <h1>${otp}</h1>
    <p>Expires in 5 minutes</p>
    ` })
  const hashed = await hashedPassword(password);
  await prisma.otp.create({
    data: {
      type: OTP_TYPES.REGISTER,
      email: cleanEmail,
      otp: hashOTP(otp),
      meta: {
        name, 
        password: hashed,
        mobile
      }
    }
  });
  return {
    email: cleanEmail
  }
};

const resetPassword = async ({ email, password }) => {
  const cleanEmail = normalizeEmail(email);
  const existing = await findTenantUserByEmail(cleanEmail);

  if (!existing) {
    const err = new Error("Account doesn't exists");
    err.statusCode = 400;
    throw err;
  }
  const otp = generateSecureOTP();
  const appName = await getAppName();

  sendMail({ to: cleanEmail, 
    subject: `${appName} OTP for Reset Password`, 
    html: `
    <h2>OTP Verification</h2>
    <p>Your OTP is:</p>
    <h1>${otp}</h1>
    <p>Expires in 5 minutes</p>
    ` })
  const hashed = await hashedPassword(password);
  await prisma.otp.create({
    data: {
      type: OTP_TYPES.RESET_PASSWORD,
      email: cleanEmail,
      otp: hashOTP(otp),
      meta: {
        password: hashed,
      }
    }
  });
  return {
    email: cleanEmail
  }
};

const loginWithOTP = async ({ email }) => {
  const cleanEmail = normalizeEmail(email);
  const user = await findTenantUserByEmail(cleanEmail);

  if (!user) {
    const err = new Error("Account does not exists");
    err.statusCode = 404;
    throw err;
  }
  const appName = await getAppName();

  const otp = generateSecureOTP();
  sendMail({ to: cleanEmail, 
    subject: `${appName} OTP for Login`, 
    html: `
    <h2>OTP Verification</h2>
    <p>Your OTP is:</p>
    <h1>${otp}</h1>
    <p>Expires in 5 minutes</p>
    ` })
  await prisma.otp.create({
    data: {
      type: OTP_TYPES.LOGIN,
      email: cleanEmail,
      otp: hashOTP(otp),
      meta: null
    }
  });
  return {
    email: cleanEmail
  }
};

const login = async ({ email, password }) => {
  const cleanEmail = normalizeEmail(email);
  const user = await findTenantUserByEmail(cleanEmail);

  if (!user) {
    const err = new Error("Invalid credentials");
    err.statusCode = 404;
    throw err;
  }

  if (!user.password) {
    const err = new Error("You have registered with Google account. 1. Please login with Google. 2. Reset password and Login. 3. Login with OTP");
    err.statusCode = 400;
    throw err;
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    const err = new Error("Invalid credentials");
    err.statusCode = 400;
    throw err;
  }

  const token = generateToken(user);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    token,
  };
};


const verifyOTP = async ({ email, otp, type }) => {
  const cleanEmail = normalizeEmail(email);
  const tenantId = getCurrentTenantId();
  const existing = await findTenantUserByEmail(cleanEmail);

  if ((type === OTP_TYPES.REGISTER) && existing) {
    const err = new Error("Account already exists");
    err.statusCode = 400;
    throw err;
  }

  if ((type !== OTP_TYPES.REGISTER) && !existing) {
    const err = new Error("Account not exists");
    err.statusCode = 400;
    throw err;
  }

  const otpRecord = await prisma.otp.findFirst({
    where:{
      type,
      email: {
        equals: cleanEmail,
        mode: "insensitive",
      },
      otp: hashOTP(otp),
      verifiedAt: null,
    },
    orderBy: {
      id: 'desc',
    },
  })

  if(!otpRecord){
    const err = new Error("Invalid OTP");
    err.statusCode = 400;
    throw err;
  }

  if(isOtpExpired(otpRecord.createdAt)){
    const err = new Error("OTP expired ...! Resend and Try");
    err.statusCode = 400;
    throw err;
  }
  await prisma.otp.update({
    where: { id: otpRecord.id },
    data: { verifiedAt: new Date() },
  });

  if(type === OTP_TYPES.REGISTER){
    const user = await prisma.user.create({
      data: {
        ...otpRecord.meta,
        email: cleanEmail,
        tenantId,
        tenantRole: TENANT_ROLES.CUSTOMER,
      },
    });
    const token = generateToken(user);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      token,
    };
  }
  if(type === OTP_TYPES.LOGIN){
    const user = existing;
    const token = generateToken(user);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      token,
    };
  }
  if(type === OTP_TYPES.RESET_PASSWORD){
    const user = existing;
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: otpRecord.meta.password
      }
    })
    return {
      id: user.id
    };
  }
};



async function verifyGoogleToken(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const cleanEmail = normalizeEmail(payload.email);
  const tenantId = getCurrentTenantId();
  
  let user = await findTenantUserByEmail(cleanEmail);

  if (!user) {
    user = await prisma.user.create({
      data: {
        tenantId,
        tenantRole: TENANT_ROLES.CUSTOMER,
        name: payload.name,
        email: cleanEmail,
        password: null, // No password for Google accounts
      },
    });
  }

  if (payload.picture) {
    const existingProfileFile = await prisma.file.findFirst({
      where: {
        feature: FEATURE_TYPES.USER,
        featureId: user.id,
      },
      select: { id: true },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!existingProfileFile) {
      await prisma.file.create({
        data: {
          feature: FEATURE_TYPES.USER,
          featureId: user.id,
          path: payload.picture,
        },
      });
    }
  }

  const jwtToken = generateToken(user);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    token: jwtToken,
  };
}

export default {
  register,
  login,
  verifyOTP,
  loginWithOTP,
  resetPassword,
  verifyGoogleToken
};

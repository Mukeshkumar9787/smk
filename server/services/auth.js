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

async function ensureTenantMembership(userId, role = TENANT_ROLES.CUSTOMER) {
  const tenantId = getCurrentTenantId();
  if (!tenantId || !userId) return;
  await rawPrisma.tenantMembership.upsert({
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
    },
    create: {
      tenantId,
      userId,
      role,
    },
    update: {},
  });
}

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id }, 
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

const register = async ({ name, email, password, mobile }) => {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    const err = new Error("Account already exists");
    err.statusCode = 400;
    throw err;
  }
  const otp = generateSecureOTP();
  const appName = await getAppName();
  sendMail({ to: email, 
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
      email,
      otp: hashOTP(otp),
      meta: {
        name, 
        password: hashed,
        mobile
      }
    }
  });
  return {
    email
  }
};

const resetPassword = async ({ email, password }) => {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    const err = new Error("Account doesn't exists");
    err.statusCode = 400;
    throw err;
  }
  const otp = generateSecureOTP();
  const appName = await getAppName();

  sendMail({ to: email, 
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
      email,
      otp: hashOTP(otp),
      meta: {
        password: hashed,
      }
    }
  });
  return {
    email
  }
};

const loginWithOTP = async ({ email }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const err = new Error("Account does not exists");
    err.statusCode = 404;
    throw err;
  }
  const appName = await getAppName();

  const otp = generateSecureOTP();
  sendMail({ to: email, 
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
      email,
      otp: hashOTP(otp),
      meta: null
    }
  });
  return {
    email
  }
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });

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

  await ensureTenantMembership(user.id, TENANT_ROLES.CUSTOMER);
  const token = generateToken(user);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    token,
  };
};


const verifyOTP = async ({ email, otp, type }) => {
  const existing = await prisma.user.findUnique({ where: { email } });

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
      email,
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
    const user = await prisma.user.create({ data: {...otpRecord.meta, email} });
    await ensureTenantMembership(user.id, TENANT_ROLES.CUSTOMER);
    const token = generateToken(user);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      token,
    };
  }
  if(type === OTP_TYPES.LOGIN){
    const user = await prisma.user.findUnique({ where: { email } });
    await ensureTenantMembership(user.id, TENANT_ROLES.CUSTOMER);
    const token = generateToken(user);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      token,
    };
  }
  if(type === OTP_TYPES.RESET_PASSWORD){
    const user = await prisma.user.findUnique({ where: { email } });
    await prisma.user.update({
      where: {
        email
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
  
  let user = await prisma.user.findUnique({ where: { email: payload.email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
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

  await ensureTenantMembership(user.id, TENANT_ROLES.CUSTOMER);
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

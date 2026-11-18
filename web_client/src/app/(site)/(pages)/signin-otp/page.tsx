import React from "react";
import type { Metadata } from "next";
import SigninOtp from "@/components/Auth/SignInOtp";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata(
  "Sign In with OTP",
  "Verify your one-time passcode to access your account."
);

const SigninOtpPage = () => {
  return <SigninOtp />;
};

export default SigninOtpPage;

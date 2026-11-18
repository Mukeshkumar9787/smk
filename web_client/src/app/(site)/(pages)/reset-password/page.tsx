import React from "react";
import type { Metadata } from "next";
import ResetPassword from "@/components/Auth/ResetPassword";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata(
  "Reset Password",
  "Reset your account password securely."
);

const ResetPasswordPage = () => {
  return <ResetPassword />;
};

export default ResetPasswordPage;

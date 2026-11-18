import React from "react";
import type { Metadata } from "next";
import Signin from "@/components/Auth/Signin";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata(
  "Sign In",
  "Sign in to your account to track orders and manage your wishlist."
);

const SigninPage = () => {
  return <Signin />;
};

export default SigninPage;

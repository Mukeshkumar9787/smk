import React from "react";
import type { Metadata } from "next";
import Signup from "@/components/Auth/Signup";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata(
  "Create Account",
  "Register a new SMK account for faster checkout and order tracking."
);

const SignupPage = () => {
  return <Signup />;
};

export default SignupPage;

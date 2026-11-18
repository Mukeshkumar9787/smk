import React from "react";
import type { Metadata } from "next";
import Users from "@/components/Users";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata("Users Management");

const UsersList = () => {
  return <Users />;
};

export default UsersList;

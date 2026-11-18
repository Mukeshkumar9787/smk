import React from "react";
import Link from "next/link";
import { useWishlistModalContext } from "@/app/context/WishlistSidebarModalContext";
import { useTenant } from "@/app/context/TenantContext";

const EmptyWishlist = () => {
  const { closeWishlistModal } = useWishlistModalContext();
  const { storeHref } = useTenant();

  return (
    <div className="rounded-[26px] border border-dashed border-slate-200 bg-white px-5 py-8 text-center">
      <h3 className="text-xl font-semibold text-dark">Your wishlist is empty</h3>
      <p className="pb-6 pt-2 text-dark-4">
        Save products you want to revisit later and they will appear here.
      </p>
      <Link
        onClick={() => closeWishlistModal()}
        href={storeHref("/shop")}
        className="btn-primary mx-auto inline-flex w-full justify-center lg:w-10/12"
      >
        Continue Shopping
      </Link>
    </div>
  );
};

export default EmptyWishlist;

"use client";
import React, { useCallback, useEffect, useState } from "react";

import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import {
  removeItemFromCart,
} from "@/redux/features/cart-slice";
import { AppDispatch, useAppSelector } from "@/redux/store";
import SingleItem from "./SingleItem";
import { withTenantPath } from "@/lib/tenantUrl";
import Link from "next/link";
import EmptyCart from "./EmptyCart";
import { STATUS_TYPES } from "@/utils/constants";
import { getProducts } from "@/http/apiCalls";
import { getCurrencyDetails, getProductCountFromCart } from "@/utils/helper";
import { Button } from "antd";
import { useDispatch } from "react-redux";

const CartSidebarModal = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isCartModalOpen, closeCartModal } = useCartModalContext();
  const cartItems = useAppSelector((state) => state.cartReducer.items);
  const [productItems, setProductItems] = useState([]);
  const handleRemoveFromCart = (id) => {
    dispatch(removeItemFromCart(id));
  };

  const fetchProducts = useCallback(async () => {
    try {
      if(cartItems.length === 0){
        setProductItems([]);
        return;
      }
      const data = await getProducts({
        productIds: cartItems.map(i => i.id),
        pagination: false,
        status: STATUS_TYPES.ACTIVE
      });
      const products = data?.data || [];
      const currentRemovedItems = cartItems.filter(i => products.findIndex(p => p.id === i.id) === -1);
      currentRemovedItems.forEach(p => {
        handleRemoveFromCart(p.id);
      });
      setProductItems(products);
    } catch (err) {
      console.error(err);
    }
  }, [cartItems]);

  useEffect(() => {
    fetchProducts();
  },[fetchProducts])

  useEffect(() => {
    // closing modal while clicking outside
    function handleClickOutside(event) {
      if (!event.target.closest(".modal-content")) {
        closeCartModal();
      }
    }

    if (isCartModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCartModalOpen, closeCartModal]);

  const totalPrice = parseFloat(productItems.reduce((acc, c) => acc + (c.price * getProductCountFromCart(c.id, cartItems)), 0));

  return (
    <div
      className={`fixed top-0 left-0 z-99999 overflow-y-auto no-scrollbar w-full h-screen bg-dark/70 ease-linear duration-300 ${
        isCartModalOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex items-center justify-end">
        <div className="modal-content relative flex h-screen w-full max-w-[540px] flex-col overflow-hidden border-l border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
          <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-5 pb-6 pt-5 backdrop-blur sm:px-7 lg:px-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
                  Quick Cart
                </p>
                <h2 className="mt-2 text-xl font-semibold text-dark sm:text-2xl">
                  Cart View
                </h2>
                <p className="mt-2 text-sm text-dark-4">
                  {cartItems.length} items selected for checkout.
                </p>
              </div>
            <button
              onClick={() => closeCartModal()}
              aria-label="button for close modal"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-dark-5 transition hover:bg-slate-200 hover:text-dark"
            >
              <svg
                className="fill-current"
                width="30"
                height="30"
                viewBox="0 0 30 30"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12.5379 11.2121C12.1718 10.846 11.5782 10.846 11.212 11.2121C10.8459 11.5782 10.8459 12.1718 11.212 12.5379L13.6741 15L11.2121 17.4621C10.846 17.8282 10.846 18.4218 11.2121 18.7879C11.5782 19.154 12.1718 19.154 12.5379 18.7879L15 16.3258L17.462 18.7879C17.8281 19.154 18.4217 19.154 18.7878 18.7879C19.154 18.4218 19.154 17.8282 18.7878 17.462L16.3258 15L18.7879 12.5379C19.154 12.1718 19.154 11.5782 18.7879 11.2121C18.4218 10.846 17.8282 10.846 17.462 11.2121L15 13.6742L12.5379 11.2121Z"
                  fill=""
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M15 1.5625C7.57867 1.5625 1.5625 7.57867 1.5625 15C1.5625 22.4213 7.57867 28.4375 15 28.4375C22.4213 28.4375 28.4375 22.4213 28.4375 15C28.4375 7.57867 22.4213 1.5625 15 1.5625ZM3.4375 15C3.4375 8.61421 8.61421 3.4375 15 3.4375C21.3858 3.4375 26.5625 8.61421 26.5625 15C26.5625 21.3858 21.3858 26.5625 15 26.5625C8.61421 26.5625 3.4375 21.3858 3.4375 15Z"
                  fill=""
                />
              </svg>
            </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7 lg:px-8">
            <div className="flex flex-col gap-6">
              {/* <!-- cart item --> */}
              {cartItems.length > 0 ? (
                productItems.map((item) => (
                  <SingleItem
                    key={item.id}
                    item={item}
                    removeItemFromCart={removeItemFromCart}
                  />
                ))
              ) : (
                <EmptyCart />
              )}
            </div>
          </div>

          <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 px-5 pb-5 pt-5 backdrop-blur sm:px-7 lg:px-8">
            <div className="mb-6 flex items-center justify-between gap-5 rounded-[22px] bg-slate-50 px-4 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-dark-4">Subtotal</p>
                <p className="mt-1 text-sm text-dark-4">Taxes and shipping calculated at checkout</p>
              </div>

              <p className="font-semibold text-xl text-dark">{getCurrencyDetails().currencySymbol}{totalPrice}</p>
            </div>

            <div className="flex flex-col gap-3">
              {(productItems.length > 0)
                ?
                <Link
                  href={withTenantPath("/checkout")}
                  onClick={() => closeCartModal()}
                  className="btn-primary w-full justify-center"
                >
                  Checkout
                </Link>
                :
                <Button
                  disabled
                  className="h-12 w-full justify-center rounded-2xl border border-slate-200 bg-slate-100 font-medium text-slate-400"
                >
                  Checkout
                </Button>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartSidebarModal;

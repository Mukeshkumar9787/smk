"use client";

import React from "react";
import { useDispatch } from "react-redux";
import { getCart, replaceCart } from "@/http/apiCalls";
import { setCartItems } from "@/redux/features/cart-slice";
import { AppDispatch, useAppSelector } from "@/redux/store";
import { getStoredToken } from "@/utils/helper";

type CartEntry = { id: number; quantity: number };

const normalize = (items: CartEntry[] = []) => {
  const map = new Map<number, number>();
  items.forEach((item) => {
    const id = Number(item.id);
    const quantity = Number(item.quantity);
    if (!Number.isInteger(id) || id <= 0) return;
    if (!Number.isInteger(quantity) || quantity <= 0) return;
    map.set(id, quantity);
  });
  return Array.from(map.entries()).map(([id, quantity]) => ({ id, quantity }));
};

const mergeByMaxQuantity = (localItems: CartEntry[], serverItems: CartEntry[]) => {
  const map = new Map<number, number>();
  [...serverItems, ...localItems].forEach((item) => {
    const existing = map.get(item.id) || 0;
    map.set(item.id, Math.max(existing, item.quantity));
  });
  return Array.from(map.entries()).map(([id, quantity]) => ({ id, quantity }));
};

const CartSync = () => {
  const dispatch = useDispatch<AppDispatch>();
  const cartItems = useAppSelector((state) => state.cartReducer.items);
  const isInitializedRef = React.useRef(false);
  const skipNextSyncRef = React.useRef(false);

  React.useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      isInitializedRef.current = true;
      return;
    }

    const initCart = async () => {
      try {
        const response = await getCart();
        const serverItems = normalize(response?.data || []);
        const localItems = normalize(cartItems || []);
        const merged = mergeByMaxQuantity(localItems, serverItems);

        skipNextSyncRef.current = true;
        dispatch(setCartItems(merged));
      } finally {
        isInitializedRef.current = true;
      }
    };

    initCart();
    // Intentionally initialize once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  React.useEffect(() => {
    if (!isInitializedRef.current) return;

    const token = getStoredToken();
    if (!token) return;

    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }

    const timeout = setTimeout(async () => {
      const items = normalize(cartItems || []).map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      }));
      await replaceCart(items);
    }, 60);

    return () => clearTimeout(timeout);
  }, [cartItems]);

  return null;
};

export default CartSync;

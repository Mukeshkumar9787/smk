import React, { useMemo, useState } from "react";
import { addItemToCart, removeItemFromCart } from "@/redux/features/cart-slice";
import { AppDispatch, useAppSelector } from "@/redux/store";
import { getProductCountFromCart, getStoredToken, redirectToSignIn } from "@/utils/helper";
import { useDispatch } from "react-redux";
import { DeleteFilled, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { useRouter } from "next/navigation";
import { Button } from "antd";
import { notifyError, notifySuccess } from "@/utils/notify";
import { notifyProductWhenInStock } from "@/http/apiCalls";

const AddToCart = ({ id, align='center', stack = true, purchase = true, stock=0, isDelete=false }) => {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const cartItems = useAppSelector((state) => state.cartReducer.items);
    const baseWrapClass = `flex ${stack ? "flex-col" : ""} gap-2 items-center justify-${align} w-full min-h-[96px]`;
    const actionBtnClass = "inline-flex h-10 w-full max-w-[220px] items-center justify-center rounded-lg font-medium text-custom-sm";
    const stockLevel = Number(stock);
    const isOutOfStock = !Number.isFinite(stockLevel) || stockLevel <= 0;
    const [isNotifyLoading, setIsNotifyLoading] = useState(false);
    const [isNotifyDone, setIsNotifyDone] = useState(false);

    const quantity = useMemo(()=>getProductCountFromCart(id, cartItems),[cartItems]);

    const setQuantity = (quantity) => {
        dispatch(addItemToCart({id,quantity}));
    }
    // add to cart
    const handleAddToCart = (redirect = false) => {
        dispatch(addItemToCart({id,quantity: quantity || 1}));
        if(redirect){
            router.push('/checkout');
        }
    };
    const handleRemoveFromCart = () => {
        dispatch(removeItemFromCart(id));
    };

    const handleNotifyMe = async () => {
        if (!getStoredToken()) {
            redirectToSignIn();
            return;
        }

        try {
            setIsNotifyLoading(true);
            const response = await notifyProductWhenInStock(id);
            if (!response?.success) {
                notifyError(response?.message || "Unable to subscribe for notification.");
                return;
            }
            setIsNotifyDone(true);
            notifySuccess(response?.message || "Notification request saved.");
        } finally {
            setIsNotifyLoading(false);
        }
    };

    const PurchaseNow = () => (
        <button
            type="button"
            onClick={() => handleAddToCart(true)}
            className={`${actionBtnClass} bg-dark text-white hover:bg-[#121826] text-xs md:text-sm`}
        >
            Purchase&nbsp;Now
        </button>
    )

    if(isOutOfStock) {
        return (
            <div className={baseWrapClass}>
                <button
                    type="button"
                    onClick={handleNotifyMe}
                    disabled={isNotifyLoading || isNotifyDone}
                    className={`${actionBtnClass} ${isNotifyLoading ? "opacity-70" : ""}`}
                    style={{
                        backgroundColor: isNotifyDone ? "#22c55e" : "#000",
                        color: "#fff",
                    }}
                >
                    {isNotifyDone ? "Notification Set" : isNotifyLoading ? "Saving..." : "Notify Me"}
                </button>
                {isDelete && 
                <Button onClick={handleRemoveFromCart}>
                    <DeleteFilled size={10} />
                </Button>
                }
            </div>
        )
    }
 
    if(quantity === 0) {
        return (
            <div className={baseWrapClass}>
                <button
                    type="button"
                    data-add-to-cart-section="true"
                    onClick={() => handleAddToCart()}
                    className={`${actionBtnClass} add-to-cart-section bg-blue text-white hover:bg-blue-dark text-xs md:text-sm`}
                >
                    Add&nbsp;to&nbsp;cart
                </button>
                {purchase && 
                    <PurchaseNow/>
                }
            </div>
        )
    }
  return (
    <div className={baseWrapClass}>
        <div 
            data-add-to-cart-section="true"
            className="add-to-cart-section relative flex h-10 w-1/2 max-w-[220px] items-center rounded-lg border border-gray-3 bg-white text-custom-sm"
        >
            <button
                type="button"
                aria-label="button for remove product"
                className="flex items-center justify-center w-1/3 hover:text-blue"
                onClick={() =>setQuantity(quantity - 1)}
            >
                <MinusOutlined/>
            </button>

            <span className="flex items-center justify-center w-1/3 border-x border-gray-4">
                {quantity}
            </span>

            <button
                disabled={quantity >= stock}
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                aria-label="button for add product"
                className="flex items-center justify-center w-1/3 hover:text-blue"
            >
                <PlusOutlined/>
            </button>
        </div>
        {purchase && 
            <PurchaseNow/>
        }
    </div>
  );
};

export default AddToCart;

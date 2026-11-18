import { getCurrencyDetails, getProductCountFromCart } from "@/utils/helper";
import EmptyCart from "../Common/CartSidebarModal/EmptyCart"
import AddToCart from "../Common/AddToCart";
import { SHOP_DETAILS } from "@/utils/appUrls";
import Link from "next/link";
import { useTenant } from "@/app/context/TenantContext";

const OrderList = ({ productItems, totalPrice }) => {
    const { storeHref } = useTenant();
    if(productItems.length === 0) {
      return <EmptyCart />
    }
    const currency = getCurrencyDetails().currencySymbol;
    return (
      <div className="bg-white shadow-1 rounded-[10px]">
        <div className="border-b border-gray-3 py-5 px-4 sm:px-8.5">
        <h3 className="font-medium text-xl text-dark">
            Your Order
        </h3>
        </div>

        <div className="pt-2.5 pb-8.5 px-4 sm:px-8.5">
        {/* <!-- title --> */}
        <div className="flex items-center justify-between py-5 border-b border-gray-3">
            <div>
            <h4 className="font-medium text-dark">Product</h4>
            </div>
            <div>
            <h4 className="font-medium text-dark text-right">
                Subtotal
            </h4>
            </div>
        </div>



        {/* <!-- product item --> */}
        {productItems.map( product => 
          <div key={product.id} className="flex items-center justify-between py-5 border-b border-gray-3">
              <div className="flex w-full">
                <div>
                <Link href={storeHref(`${SHOP_DETAILS}/${product.slug}`)} > <img src={product.img} className="w-20" alt={product.title} /> </Link> 
                <div className="text-dark">{product.title}({currency}{product.price})</div>
                </div>
              <AddToCart id={product.id} purchase={false} stack={false} isDelete stock={product.stock} />
              </div>
              <div>
              <p className="text-dark text-right">{currency}&nbsp;{parseFloat(product.price * product.quantity).toFixed(2)}</p>
              </div>
          </div>
        )}

        {/* <!-- total --> */}
        <div className="flex items-center justify-between pt-5">
            <div>
            <p className="font-medium text-lg text-dark">Total</p>
            </div>
            <div>
            <p className="font-medium text-lg text-dark text-right">
                {getCurrencyDetails().currencySymbol} {totalPrice.toFixed(2)}
            </p>
            </div>
        </div>
        </div>
    </div>
    )
}

export default OrderList;
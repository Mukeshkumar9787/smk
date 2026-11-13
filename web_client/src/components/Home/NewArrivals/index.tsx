import Link from "next/link";
import ProductItem from "@/components/Common/ProductItem";
import { getProducts } from "@/http/apiCalls";
import { STATUS_TYPES } from "@/utils/constants";

const NewArrival = async () => {
  const data = await getProducts({pageSize: 8, status: STATUS_TYPES.ACTIVE});
  const shopData = data.data || [];
  return (
    <section className="overflow-hidden bg-transparent pb-18 pt-10 sm:pt-12">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="px-1 py-2 sm:px-0">
          {/* <!-- section title --> */}
          <div className="mb-8 flex flex-col gap-5 lg:mb-9 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[620px]">
              <span className="mb-2 inline-flex items-center gap-2.5 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.11826 15.4622C4.11794 16.6668 5.97853 16.6668 9.69971 16.6668H10.3007C14.0219 16.6668 15.8825 16.6668 16.8821 15.4622M3.11826 15.4622C2.11857 14.2577 2.46146 12.429 3.14723 8.77153C3.63491 6.17055 3.87875 4.87006 4.8045 4.10175M3.11826 15.4622C3.11826 15.4622 3.11826 15.4622 3.11826 15.4622ZM16.8821 15.4622C17.8818 14.2577 17.5389 12.429 16.8532 8.77153C16.3655 6.17055 16.1216 4.87006 15.1959 4.10175M16.8821 15.4622C16.8821 15.4622 16.8821 15.4622 16.8821 15.4622ZM15.1959 4.10175C14.2701 3.33345 12.947 3.33345 10.3007 3.33345H9.69971C7.0534 3.33345 5.73025 3.33345 4.8045 4.10175M15.1959 4.10175C15.1959 4.10175 15.1959 4.10175 15.1959 4.10175ZM4.8045 4.10175C4.8045 4.10175 4.8045 4.10175 4.8045 4.10175Z"
                  stroke="#3C50E0"
                  strokeWidth="1.5"
                />
                <path
                  d="M7.64258 6.66678C7.98578 7.63778 8.91181 8.33345 10.0003 8.33345C11.0888 8.33345 12.0149 7.63778 12.3581 6.66678"
                  stroke="#3C50E0"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              This Week’s
              </span>
              <h2 className="font-semibold text-2xl tracking-tight text-dark sm:text-3xl xl:text-heading-4">
                New Arrivals
              </h2>
              <p className="mt-3 max-w-[540px] text-sm leading-6 text-dark-4 sm:text-base">
                Fresh products selected for the front page, with updated pricing, availability, and quick access to the full catalog.
              </p>
            </div>

            <Link
              href="/shop"
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-semibold text-dark shadow-sm transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
            >
              View All Products
            </Link>
          </div>

          {shopData.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4 items-stretch">
              {/* <!-- New Arrivals item --> */}
              {shopData.map((item) => (
                <ProductItem item={item} key={item.id} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-8 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="font-semibold text-base text-slate-800">Unable to Load Products</h3>
              <p className="mt-1 text-xs text-slate-500">
                We're having trouble connecting right now. Please try again later.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default NewArrival;

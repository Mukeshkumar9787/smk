"use client";
import React, { useState, useEffect, useCallback } from "react";
import CategoryDropdown from "./CategoryDropdown";
import SizeDropdown from "./SizeDropdown";
import ColorsDropdwon from "./ColorsDropdown";
import { Button, Pagination } from "antd";
import { getProducts } from "@/http/apiCalls";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import Filter from "./Filter";
import { STATUS_TYPES } from "@/utils/constants";
import { Empty } from 'antd';
import { FilterOutlined } from "@ant-design/icons";
import ProductItem from "../Common/ProductItem";


const ShopWithSidebar = () => {
  const [productSidebar, setProductSidebar] = useState(false);
  const [productItems, setProductItems] = React.useState([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pagination, setPagination] = React.useState({ pageNumber: 1, pageSize: 6});
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = new URLSearchParams(searchParams.toString());
  const activeFilterCount = ["category", "size", "color"].filter((key) => params.get(key)).length;
  
  const fetchProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams(searchParams.toString());
      const category = params.get('category');
      const size = params.get('size');
      const color = params.get('color');

      const data = await getProducts({
        ...pagination,
        category,
        size,
        color,
        status: STATUS_TYPES.ACTIVE
      });

      setProductItems(data?.data || []);
      setTotalCount(data?.totalCount || 0);
    } catch (err) {
      console.error(err);
    }
  }, [pagination, searchParams]);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (productSidebar) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [productSidebar]);

  const clearFilter = () => {
    router.push(pathname);
    setProductSidebar(false);
  };

  const setCategoryFilter = (category: string) => {
    params.set('category', category.toString());
    router.push(`${pathname}?${params.toString()}`);
    setProductSidebar(false);
  };

  const setSizeFilter = (size: string) => {
    params.set('size', size.toString());
    router.push(`${pathname}?${params.toString()}`);
    setProductSidebar(false);
  };

  const setColorFilter = (color: string) => {
    params.set('color', color.toString());
    router.push(`${pathname}?${params.toString()}`);
    setProductSidebar(false);
  };

  return (
    <>
      <section className="overflow-hidden relative bg-transparent pb-20 pt-5">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="relative mb-5 xl:hidden">
            <div className="rounded-[24px] border border-slate-200/80 bg-white/95 p-3 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setProductSidebar(true)}
                  className="flex min-h-[52px] flex-1 items-center justify-between rounded-[18px] bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_100%)] px-4 py-3 text-left text-white shadow-[0_14px_34px_rgba(15,23,42,0.22)]"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/12">
                      <FilterOutlined className="text-lg" />
                    </span>
                    <span>
                      <span className="block text-xs uppercase tracking-[0.22em] text-slate-300">
                        Shop Filters
                      </span>
                      <span className="block text-sm font-semibold">
                        {activeFilterCount ? `${activeFilterCount} filters active` : "Category, size, color"}
                      </span>
                    </span>
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/12 text-slate-100">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="fill-current"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M6.21967 3.96967C6.51256 3.67678 6.98744 3.67678 7.28033 3.96967L11.7803 8.46967C12.0732 8.76256 12.0732 9.23744 11.7803 9.53033L7.28033 14.0303C6.98744 14.3232 6.51256 14.3232 6.21967 14.0303C5.92678 13.7374 5.92678 13.2626 6.21967 12.9697L10.1893 9L6.21967 5.03033C5.92678 4.73744 5.92678 4.26256 6.21967 3.96967Z"
                        fill=""
                      />
                    </svg>
                  </span>
                </button>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilter}
                    className="min-h-[52px] rounded-[18px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          <Filter clearFilter={clearFilter} />

          <div className="flex gap-7.5 mt-5">
            {productSidebar && (
              <button
                type="button"
                aria-label="Close filter sidebar overlay"
                className="fixed inset-0 z-[9997] bg-slate-950/40 backdrop-blur-[2px] xl:hidden"
                onClick={() => setProductSidebar(false)}
              />
            )}

            {/* <!-- Sidebar Start --> */}
            <div
              className={`sidebar-content fixed bottom-3 left-3 right-3 top-32 z-[9998] w-auto max-w-none overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_-24px_60px_rgba(15,23,42,0.2)] ease-out duration-300 xl:static xl:top-0 xl:left-auto xl:right-auto xl:bottom-auto xl:z-1 xl:w-full xl:max-w-[270px] xl:translate-x-0 xl:rounded-[28px] xl:border-0 xl:bg-transparent xl:shadow-none ${
                productSidebar
                  ? "translate-y-0"
                  : "translate-y-full xl:translate-y-0"
              }`}
            >
              <div className="h-full max-h-full overflow-y-auto px-5 pb-6 pt-5 sm:px-6 xl:max-h-none xl:overflow-visible xl:px-0 xl:pb-0 xl:pt-0">
                <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-slate-200 xl:hidden" />
                <div className="mb-4 flex items-center justify-between xl:hidden">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                      Refine Results
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-950">
                      Filters
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProductSidebar(false)}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700"
                  >
                    Close
                  </button>
                </div>

                <div className="mb-4 rounded-[22px] bg-slate-50 px-4 py-3 xl:hidden">
                  <p className="text-sm text-slate-600">
                    {activeFilterCount ? `${activeFilterCount} filters active right now.` : "Choose a category, size, or color to narrow the catalog."}
                  </p>
                </div>

                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="flex flex-col gap-4 xl:gap-6">
                  {/* <!-- filter box --> */}
                  

                  {/* <!-- category box --> */}
                  <CategoryDropdown setCategoryFilter={setCategoryFilter} />

                  {/* // <!-- size box --> */}
                  <SizeDropdown setSizeFilter={setSizeFilter} />

                  {/* // <!-- color box --> */}
                  <ColorsDropdwon setColorFilter={setColorFilter} />

                  <div className="grid grid-cols-2 gap-3 pt-1 xl:hidden">
                    <button
                      type="button"
                      onClick={clearFilter}
                      className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"
                    >
                      Clear All
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductSidebar(false)}
                      className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white"
                    >
                      View Products
                    </button>
                  </div>
                </div>
                </form>
              </div>
            </div>
            {/* // <!-- Sidebar End --> */}

            {/* // <!-- Content Start --> */}
            <div className="xl:max-w-[870px] w-full">
            {(productItems.length > 0) ?
              <>
              {/* <!-- Products Grid Tab Content Start --> */}
              <div
                className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 items-stretch"
              >
                {productItems.map((item, key) => <ProductItem item={item} key={key} />)}
              </div>
              {/* <!-- Products Grid Tab Content End --> */}

              {/* <!-- Products Pagination Start --> */}
              <div className="flex justify-center mt-15">
                <div className="bg-white shadow-1 rounded-md p-2">
                  <Pagination onChange={(page, pageSize) => {setPagination({pageNumber: page, pageSize})}} total={totalCount} pageSize={pagination.pageSize} current={pagination.pageNumber} />
                </div>
              </div>
              {/* <!-- Products Pagination End --> */}
              </>
              :
              <Empty description={
                <div> 
                  <div>No products found</div>
                  <Button onClick={clearFilter} type="dashed"> Clear Filters</Button>
                </div>
              }/>
              }
            </div>
            {/* // <!-- Content End --> */}
          </div>
        </div>
      </section>
    </>
  );
};

export default ShopWithSidebar;

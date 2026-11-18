"use client";
import React from "react";
import AdminOverview from "../Common/AdminOverview";
import AdminMobileList from "../Common/AdminMobileList";
import Link from "next/link";
import { getProducts } from "../../http/apiCalls.js";
import { Input, Table } from "antd"
import { STATUS_TYPES } from "../../utils/constants.js"
import { PRODUCT_NEW_URL, PRODUCT_URL } from "@/utils/appUrls";
import { useTenant } from "@/app/context/TenantContext";

const Product = () => {
  const { storeHref } = useTenant();
  const [productItems, setProductItems] = React.useState([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pagination, setPagination] = React.useState({ pageNumber: 1, pageSize: 10});
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts({...pagination, search});
        setProductItems(data?.data || []);
        setTotalCount(data?.totalCount || 0);
      } catch (err) {
        console.error(err);
      }
    };

    fetchProducts();
  }, [pagination, search]);

  const columns = [
    {
      title: 'S.No',
      key: 'serialNo',
      width: 80,
      render: (_, __, index) => (
        <span className="font-medium text-dark">
          {(pagination.pageNumber - 1) * pagination.pageSize + index + 1}
        </span>
      ),
    },
    {
      title: 'Image',
      dataIndex: 'img',
      key: 'img',
      align: 'center',
      render: (text) => {
        return <img alt="" className="mx-auto h-14 w-14 rounded-xl border border-gray-3 object-cover" src={text}/>
      },
    },
    {
      title: 'Name',
      dataIndex: 'title',
      key: 'title',
      render: (title) => <span className="font-medium text-dark">{title}</span>,
    },
    {
      title: 'Category',
      dataIndex: 'categoryName',
      key: 'categoryName',
      render: (categoryName) => <span className="text-dark-4">{categoryName || "Uncategorized"}</span>,
    },
    {
      title: 'Color',  
      dataIndex: 'colorCode',
      key: 'color',
      align: 'center',
      render: (code) => {
        return (
          <div className="flex items-center justify-center gap-2">
            <div style={{backgroundColor: code}} className="h-5 w-10 rounded border border-gray-3"></div>
            <span className="text-sm text-dark-4">{code}</span>
          </div> )
      },
    },
    {
      title: 'Size',  
      dataIndex: 'sizeName',
      key: 'size',
      align: 'center',
      render: (sizeName) => <span className="text-dark-4">{sizeName || "-"}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (text) => {
        const isActive = text === STATUS_TYPES.ACTIVE;
        return (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
              isActive ? "bg-green text-white" : "bg-red text-white"
            }`}
          >
            {text}
          </span>
        )
      },
    },
    {
      title: 'Action',
      dataIndex: 'slug',
      key: 'action',
      align: 'center',
      render: (slug) => {
        return(
          <Link
            href={storeHref(PRODUCT_URL + `/${slug}`)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-3 text-dark hover:border-blue hover:text-blue transition"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="fill-current"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M14.2218 2.71967C14.7931 2.14837 15.7202 2.14837 16.2915 2.71967L19.2803 5.70845C19.8516 6.27975 19.8516 7.20688 19.2803 7.77818L8.56302 18.4954C8.3418 18.7166 8.06445 18.8734 7.76089 18.9498L3.62422 20.0002C3.36527 20.066 3.09126 19.9902 2.90192 19.8008C2.71258 19.6115 2.63679 19.3375 2.70255 19.0786L3.75296 14.9419C3.82933 14.6383 3.98615 14.361 4.20737 14.1397L14.2218 2.71967ZM15.2567 3.75457L4.99993 14.0113L4.24693 17.002L7.23763 16.249L17.4944 5.99227L15.2567 3.75457Z"
                fill=""
              />
            </svg>
          </Link>
        )
      },
    }
  ]

  
  return (
    <>
        <section className="page-section">
          <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
            <AdminOverview
              eyebrow="Catalog Admin"
              title="Manage product inventory and listing quality."
              description="Track catalog coverage, update details, and keep inventory-ready products visible to customers."
              stats={[{ label: "Products", value: totalCount }]}
            />
            <div className="admin-page-card">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-dark">Product List</h2>
                  <p className="text-sm text-dark-4">Manage products, availability, and details.</p>
                </div>
                <Link
                  href={storeHref(PRODUCT_NEW_URL)}
                  className="inline-flex items-center gap-2 rounded-md bg-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-dark transition"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 22 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="fill-current"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M11 3.4375C11.3797 3.4375 11.6875 3.7453 11.6875 4.125V10.3125H17.875C18.2547 10.3125 18.5625 10.6203 18.5625 11C18.5625 11.3797 18.2547 11.6875 17.875 11.6875H11.6875V17.875C11.6875 18.2547 11.3797 18.5625 11 18.5625C10.6203 18.5625 10.3125 18.2547 10.3125 17.875V11.6875H4.125C3.7453 11.6875 3.4375 11.3797 3.4375 11C3.4375 10.6203 3.7453 10.3125 4.125 10.3125H10.3125V4.125C10.3125 3.7453 10.6203 3.4375 11 3.4375Z"
                      fill=""
                    />
                  </svg>
                  <span>Add&nbsp;Product</span>
                </Link>
              </div>
              <div className="mb-5 w-full max-w-[320px]">
                <Input placeholder="Search products" type="text" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <AdminMobileList
                items={productItems}
                emptyText="No products found."
                pagination={{
                  current: pagination.pageNumber,
                  pageSize: pagination.pageSize,
                  total: totalCount,
                  pageSizeOptions: ["10", "20"],
                  onChange(page, pageSize) {
                    setPagination({ pageNumber: page, pageSize });
                  },
                }}
                renderCard={(item, index) => (
                  <div className="admin-mobile-card">
                    <div className="mb-4 flex items-center gap-3">
                      <img alt="" className="h-14 w-14 rounded-xl border border-gray-3 object-cover" src={item.img} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-dark-5">Product #{(pagination.pageNumber - 1) * pagination.pageSize + index + 1}</p>
                        <h3 className="truncate text-base font-semibold text-dark">{item.title}</h3>
                      </div>
                      <Link href={storeHref(PRODUCT_URL + `/${item.slug}`)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-3 text-dark transition hover:border-blue hover:text-blue">
                        <svg width="18" height="18" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className="fill-current"><path fillRule="evenodd" clipRule="evenodd" d="M14.2218 2.71967C14.7931 2.14837 15.7202 2.14837 16.2915 2.71967L19.2803 5.70845C19.8516 6.27975 19.8516 7.20688 19.2803 7.77818L8.56302 18.4954C8.3418 18.7166 8.06445 18.8734 7.76089 18.9498L3.62422 20.0002C3.36527 20.066 3.09126 19.9902 2.90192 19.8008C2.71258 19.6115 2.63679 19.3375 2.70255 19.0786L3.75296 14.9419C3.82933 14.6383 3.98615 14.361 4.20737 14.1397L14.2218 2.71967ZM15.2567 3.75457L4.99993 14.0113L4.24693 17.002L7.23763 16.249L17.4944 5.99227L15.2567 3.75457Z" fill="" /></svg>
                      </Link>
                    </div>
                    <div className="admin-mobile-meta">
                      <span className="admin-mobile-label">Category</span>
                      <span className="admin-mobile-value">{item.categoryName || "Uncategorized"}</span>
                    </div>
                    <div className="admin-mobile-meta">
                      <span className="admin-mobile-label">Color</span>
                      <span className="admin-mobile-value inline-flex items-center gap-2">
                        <span style={{ backgroundColor: item.colorCode }} className="h-5 w-10 rounded border border-gray-3"></span>
                        <span>{item.colorCode || "-"}</span>
                      </span>
                    </div>
                    <div className="admin-mobile-meta">
                      <span className="admin-mobile-label">Size</span>
                      <span className="admin-mobile-value">{item.sizeName || "-"}</span>
                    </div>
                    <div className="admin-mobile-meta">
                      <span className="admin-mobile-label">Status</span>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.status === STATUS_TYPES.ACTIVE ? "bg-green text-white" : "bg-red text-white"}`}>{item.status}</span>
                    </div>
                  </div>
                )}
              />
              <div className="hidden md:block">
                <Table className="admin-data-table" dataSource={productItems} columns={columns} rowKey="id"
                  size="middle"
                  scroll={{ x: 900 }}
                  pagination={{
                    current: pagination.pageNumber,
                    pageSize: pagination.pageSize,
                    total: totalCount,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20'],
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
                    onChange(page, pageSize) {
                      setPagination({pageNumber: page, pageSize});
                    },
                  }}
                  locale={{ emptyText: "No products found." }}
                />
              </div>
            </div>
          </div>
        </section>
      
    </>
  );
};

export default Product;

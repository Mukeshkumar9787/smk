"use client";
import React from "react";
import AdminOverview from "../Common/AdminOverview";
import AdminMobileList from "../Common/AdminMobileList";
import Link from "next/link";
import { getOrdersForAdmin } from "../../http/apiCalls.js";
import { Input, Table } from "antd"
import { ORDER_STATUS_COLOR } from "../../utils/constants.js"
import { ORDER_URL } from "@/utils/appUrls";
import { ExportOutlined } from "@ant-design/icons";
import StatusTags from "./StatusTags";
import { getCurrencyDetails, getShippingDisplay } from "@/utils/helper";

const AdminOrders = () => {
  const [orderItems, setOrderItems] = React.useState([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pagination, setPagination] = React.useState({ pageNumber: 1, pageSize: 10});
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('');

  React.useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getOrdersForAdmin({...pagination, search, status});
        setOrderItems(data?.data || []);
        setTotalCount(data?.totalCount || 0);
      } catch (err) {
        console.error(err);
      }
    };

    fetchOrders();
  }, [pagination, search, status]);
  const currency = getCurrencyDetails().currencySymbol;

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
      dataIndex: 'filePath',
      key: 'filePath',
      align: 'center',
      render: (text) => {
        return <img alt="" className="mx-auto h-14 w-14 rounded-xl border border-gray-3 object-cover" src={text}/>
      },
    },
    {
      title: 'Order No',
      dataIndex: 'orderNo',
      key: 'orderNo',
      align: 'center',
      render: (orderNo) => <span className="font-medium text-dark">#{orderNo}</span>,
    },
    {
      title: 'Placed by',
      dataIndex: 'user',
      key: 'user',
      render: (user) => {
        return <div className="font-medium text-dark">{user?.name}</div>
      },
    },
    {
      title: 'Products',
      dataIndex: 'title',
      key: 'title',
      render: (user) => {
        return <div className="max-w-[280px] truncate text-dark-4">{user}</div>
      },
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'center',
      render: (text) => {
        return (
          <div className="text-center font-medium text-dark">
            {currency}{text}
          </div> )
      },
    },
    {
      title: 'Shipping Amount',
      dataIndex: 'shippingAmount',
      key: 'shippingAmount',
      align: 'center',
      render: (text) => {
        return (
          <div className="text-center text-dark-4">
            {getShippingDisplay(text)}
          </div> )
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (text) => {
        return (
          <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold" style={ORDER_STATUS_COLOR[text]}>
            {text}
          </span>
        )
      },
    },
    {
      title: 'Dispute',
      dataIndex: 'dispute',
      key: 'dispute',
      align: 'center',
      render: (dispute) => {
        if (!dispute) {
          return <span className="text-sm text-dark-4">-</span>;
        }
        return (
          <span className="inline-flex rounded-full bg-red-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white">
            {dispute.status}
          </span>
        );
      },
    },
    {
      title: 'View',
      dataIndex: 'orderNo',
      key: 'action',
      align: 'center',
      render: (orderNo) => {
        return(
          <Link
            href={ORDER_URL + `/${orderNo}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-3 text-dark hover:border-blue hover:text-blue transition"
          >
            <ExportOutlined size={20}/>
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
              eyebrow="Order Admin"
              title="Track and manage all customer orders."
              description="Review pipeline activity, search active orders, and move fulfillment forward from one operational screen."
              stats={[{ label: "Orders", value: totalCount }]}
            />
            <div className="admin-page-card">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-dark">Order List</h2>
                  <p className="text-sm text-dark-4">Track and manage all customer orders.</p>
                </div>
              </div>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="w-full max-w-[320px]">
                  <Input placeholder="Search orders" type="text" value={search} onChange={(e) => {setSearch(e.target.value);setPagination((prev) => ({...prev, pageNumber: 1}))}} />
                </div>
                <StatusTags status={status} setStatus={(value)=> {setStatus(value); setPagination((prev) => ({...prev, pageNumber: 1}))}} />
              </div>
              <AdminMobileList
                items={orderItems}
                emptyText="No orders found."
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
                      <img alt="" className="h-14 w-14 rounded-xl border border-gray-3 object-cover" src={item.filePath} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-dark-5">Order #{(pagination.pageNumber - 1) * pagination.pageSize + index + 1}</p>
                        <h3 className="text-base font-semibold text-dark">#{item.orderNo}</h3>
                        <p className="truncate text-sm text-dark-4">{item.user?.name || "-"}</p>
                      </div>
                      <Link href={ORDER_URL + `/${item.orderNo}`} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-3 text-dark transition hover:border-blue hover:text-blue">
                        <ExportOutlined />
                      </Link>
                    </div>
                    <div className="admin-mobile-meta">
                      <span className="admin-mobile-label">Products</span>
                      <span className="admin-mobile-value max-w-[60%] truncate" title={item.title}>{item.title}</span>
                    </div>
                    <div className="admin-mobile-meta">
                      <span className="admin-mobile-label">Total</span>
                      <span className="admin-mobile-value font-medium">{currency}{item.totalAmount}</span>
                    </div>
                    <div className="admin-mobile-meta">
                      <span className="admin-mobile-label">Shipping</span>
                      <span className="admin-mobile-value">{getShippingDisplay(item.shippingAmount)}</span>
                    </div>
                    <div className="admin-mobile-meta">
                      <span className="admin-mobile-label">Status</span>
                      <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold" style={ORDER_STATUS_COLOR[item.status]}>{item.status}</span>
                    </div>
                    <div className="admin-mobile-meta">
                      <span className="admin-mobile-label">Dispute</span>
                      {item.dispute ? (
                        <span className="inline-flex rounded-full bg-red-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white">{item.dispute.status}</span>
                      ) : (
                        <span className="admin-mobile-value">-</span>
                      )}
                    </div>
                  </div>
                )}
              />
              <div className="hidden md:block">
                <Table className="admin-data-table" dataSource={orderItems} columns={columns as any} rowKey="id"
                  size="middle"
                  scroll={{ x: 980 }}
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
                  locale={{ emptyText: "No orders found." }}
                />
              </div>
            </div>
          </div>
        </section>
      
    </>
  );
};

export default AdminOrders;

import { Menu } from "@/types/Menu";
import { AUDIT_LOG_URL, CATEGORY_URL, COLOR_URL, CONFIG_COMPANY_URL, CONFIG_COURIER_URL, CONFIG_SHIPPING_URL, DASHBOARD_URL, HSN_URL, ORDER_URL, PRODUCT_URL, SIZE_URL, USER_URL } from "@/utils/appUrls";

export const menuData: Menu[] = [
  {
    title: "Home",
    newTab: false,
    path: "/",
  },
  {
    title: "Shop",
    newTab: false,
    path: "/shop",
  },
  {
    title: "Contact",
    newTab: false,
    path: "/contact",
  },
];

export const userMenuData: Menu[] = [
  {
    title: "Orders",
    newTab: false,
    path: "/orders",
  },
];

export const adminMenuData: Menu[] = [
    {
    title: "Manage",
    newTab: false,
    path: DASHBOARD_URL,
    submenu: [
      {
        title: "Dashboard",
        newTab: false,
        path: DASHBOARD_URL,
      },
      {
        title: "Orders",
        newTab: false,
        path: ORDER_URL,
      },
      {
        title: "Category",
        newTab: false,
        path: CATEGORY_URL,
      },
      {
        title: "HSN",
        newTab: false,
        path: HSN_URL,
      },
      {
        title: "Product",
        newTab: false,
        path: PRODUCT_URL,
      },
      {
        title: "Size",
        newTab: false,
        path: SIZE_URL,
      },
      {
        title: "Color",
        newTab: false,
        path: COLOR_URL,
      },
      {
        title: "Company Info",
        newTab: false,
        path: CONFIG_COMPANY_URL,
      },
      {
        title: "Shipping Info",
        newTab: false,
        path: CONFIG_SHIPPING_URL,
      },
      {
        title: "Courier",
        newTab: false,
        path: CONFIG_COURIER_URL,
      },
      {
        title: "Users",
        newTab: false,
        path: USER_URL,
      },
      {
        title: "Audit Logs",
        newTab: false,
        path: AUDIT_LOG_URL,
      },
    ],
  }
]

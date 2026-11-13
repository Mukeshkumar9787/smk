"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { adminMenuData, menuData, userMenuData } from "./menuData";
import Dropdown from "./Dropdown";
import { useAppSelector } from "@/redux/store";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import { useWishlistModalContext } from "@/app/context/WishlistSidebarModalContext";
import Image from "next/image";
import { getLoggedInUserData, getStoredToken } from "@/utils/helper";
import { CONFIG_KEYS, ROLE_TYPES, STATUS_TYPES } from "@/utils/constants";
import { getConfig, getProducts } from "@/http/apiCalls";
import { SHOP_DETAILS } from "@/utils/appUrls";
import type { Product } from "@/types/product";

const Header = () => {
  const router = useRouter();
  const [menuItems, setMenuItems] = useState(menuData);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const navRef = React.useRef<HTMLDivElement | null>(null);
  const navToggleRef = React.useRef<HTMLButtonElement | null>(null);
  const desktopSearchRef = React.useRef<HTMLDivElement | null>(null);
  const mobileSearchRef = React.useRef<HTMLDivElement | null>(null);
  const { openCartModal } = useCartModalContext();
  const { openWishlistModal } = useWishlistModalContext();
  const [user, setUser] = useState(null);
  const [compInfo, setCompInfo] = React.useState<any>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const product = useAppSelector((state) => state.cartReducer.items);
  const wishlist = useAppSelector((state) => state.wishlistReducer.items);

  const handleOpenCartModal = () => {
    openCartModal();
  };
  const handleOpenWishlistModal = () => {
    openWishlistModal();
  };

  
  const fetchConfig = React.useCallback(async () => {
    try {
      const { success, data } = await getConfig({ configs: [CONFIG_KEYS.COMP_INFO]});

      if (!success) return;

      setCompInfo(data?.[CONFIG_KEYS.COMP_INFO] ?? {});
    } catch (error) {
      console.error(error);
    }
  }, []);
  
  React.useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // User & dynamic navigation menu
  useEffect(() => {
    if (!getStoredToken()) {
      setUser(null);
      setMenuItems(menuData);
      return;
    }
    const fetchUser = async () => {
      const userData = await getLoggedInUserData();
      if (userData) {
        setUser(userData);
        const authedMenu = [
          ...menuData.filter((item) => item.path !== "/contact"),
          ...userMenuData,
          ...(userData.role === ROLE_TYPES.ADMIN ? adminMenuData : []),
          ...menuData.filter((item) => item.path === "/contact"),
        ];
        setMenuItems(authedMenu);
      } else {
        setUser(null);
        setMenuItems(menuData);
      }
    };
    fetchUser();
  }, [pathname]);

  useEffect(() => {
    if (!navigationOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (navRef.current?.contains(target) || navToggleRef.current?.contains(target)) {
        return;
      }
      setNavigationOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [navigationOpen]);

  useEffect(() => {
    setNavigationOpen(false);
    setSearchResults([]);
    setShowSearchSuggestions(false);
  }, [pathname]);

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      setSearchResults([]);
      setSearchingProducts(false);
      setShowSearchSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingProducts(true);
      setShowSearchSuggestions(true);
      try {
        const response = await getProducts({
          status: STATUS_TYPES.ACTIVE,
          search: trimmedQuery,
          pageSize: 6,
        }, { skipGlobalLoader: true });
        setSearchResults(response?.data || []);
      } catch (error) {
        console.error(error);
        setSearchResults([]);
      } finally {
        setSearchingProducts(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (desktopSearchRef.current?.contains(target) || mobileSearchRef.current?.contains(target)) {
        return;
      }
      setSearchQuery("");
      setSearchResults([]);
      setShowSearchSuggestions(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearchNavigate = (slug: string) => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchSuggestions(false);
    router.push(`${SHOP_DETAILS}/${slug}`);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (searchResults[0]?.slug) {
      handleSearchNavigate(searchResults[0].slug);
    }
  };

  const handleNavigationToggle = () => {
    setNavigationOpen((prev) => {
      const next = !prev;
      if (next) {
        setShowSearchSuggestions(false);
      }
      return next;
    });
  };

  const renderSearchBox = (className = "", ref?: React.RefObject<HTMLDivElement | null>) => (
    <div ref={ref} className={`relative ${className}`}>
      <form onSubmit={handleSearchSubmit}>
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => {
            const value = event.target.value;
            setSearchQuery(value);
            setShowSearchSuggestions(Boolean(value.trim()));
          }}
          onFocus={() => {
            setNavigationOpen(false);
            if (searchQuery.trim()) {
              setShowSearchSuggestions(true);
            }
          }}
          placeholder="Search products"
          className="w-full rounded-2xl border border-gray-3 bg-white px-4 py-3 text-sm text-dark shadow-sm outline-none transition focus:border-blue"
        />
      </form>
      {showSearchSuggestions && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[80] overflow-hidden rounded-2xl border border-gray-3 bg-white shadow-[0_20px_45px_rgba(15,23,42,0.12)]">
          <div className="max-h-[320px] overflow-y-auto">
            {searchingProducts ? (
              <div className="px-4 py-3 text-sm text-dark-4">Searching...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSearchNavigate(item.slug)}
                  className="flex w-full items-start gap-3 border-b border-gray-3 px-4 py-3 text-left transition hover:bg-gray-1 last:border-b-0"
                >
                  {item.img ? (
                    <img src={item.img} alt={item.title} className="h-12 w-12 rounded-xl border border-gray-3 object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-xl border border-gray-3 bg-gray-1" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-dark">{item.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-dark-5">{item.categoryName || "Uncategorized"}</p>
                    {item.description ? (
                      <p
                        className="mt-1 text-sm text-dark-4"
                        style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                      >
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-dark-4">No matching products found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <header className="relative w-full z-50 bg-transparent backdrop-blur transition-all ease-in-out duration-300">
      <div className="max-w-[1170px] mx-auto px-4 sm:px-7.5 xl:px-0">
        {/* <!-- header top start --> */}
        <div
          className="relative flex items-center justify-between gap-3 ease-out duration-200 py-4 sm:py-6"
        >
          {/* <!-- header top left --> */}
          <div className="flex min-w-0 items-center gap-3">
            <Link className="flex-shrink-0" href="/">
              <Image
                src="/images/logo/smk.jpg"
                alt="SMK Logo"
                width={50}
                height={50}
                className="h-9 w-auto rounded-md object-contain"
              />
            </Link>
            <span className="hidden truncate font-semibold tracking-tight text-dark sm:block">{compInfo?.name || "SMK"}</span>
          </div>

          <div className="hidden min-w-0 flex-1 px-4 lg:block">
            {renderSearchBox("mx-auto w-full max-w-[420px]", desktopSearchRef)}
          </div>

          {/* <!-- header top right --> */}
          <div className="flex w-auto items-center gap-3 sm:gap-5">
            {/* <!--=== Main Nav Start ===--> */}
            <div
              ref={navRef}
              className={`z-[70] w-[288px] absolute right-0 top-full xl:static xl:z-auto xl:w-auto h-0 xl:h-auto invisible xl:visible xl:flex xl:items-center xl:justify-between ${
                navigationOpen &&
                `!visible bg-white shadow-xl border border-gray-3 !h-auto max-h-[400px] overflow-y-scroll rounded-xl p-5`
              }`}
            >
              {/* <!-- Main Nav Start --> */}
              <nav>
                <ul className="flex flex-col items-start gap-5 xl:flex-row xl:items-center xl:gap-6">
                  {menuItems.map((menuItem, i) =>
                    menuItem.submenu ? (
                      <Dropdown key={i} menuItem={menuItem} />
                    ) : (
                      <li
                        key={i}
                        className="group relative"
                      >
                        <Link
                          href={menuItem.path}
                          onClick={() => setNavigationOpen(false)}
                          className="flex w-full items-center rounded-md text-left text-custom-sm font-medium text-dark hover:text-blue xl:min-h-[44px] xl:w-auto"
                        >
                          {menuItem.title}
                        </Link>
                      </li>
                    )
                  )}
                </ul>
              </nav>
              {/* //   <!-- Main Nav End --> */}
            </div>
            {/* // <!--=== Main Nav End ===--> */}

            {/* <!-- divider --> */}
            <span className="hidden xl:block w-px h-7.5 bg-gray-3"></span>

            <div className="flex w-auto items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1 sm:gap-3">
                <button onClick={handleOpenCartModal} className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-1 sm:px-2.5">
                  <span className="inline-block relative">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M15.5433 9.5172C15.829 9.21725 15.8174 8.74252 15.5174 8.45686C15.2175 8.17119 14.7428 8.18277 14.4571 8.48272L12.1431 10.9125L11.5433 10.2827C11.2576 9.98277 10.7829 9.97119 10.483 10.2569C10.183 10.5425 10.1714 11.0173 10.4571 11.3172L11.6 12.5172C11.7415 12.6658 11.9378 12.75 12.1431 12.75C12.3483 12.75 12.5446 12.6658 12.6862 12.5172L15.5433 9.5172Z"
                        fill="#3C50E0"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M1.29266 2.7512C1.43005 2.36044 1.8582 2.15503 2.24896 2.29242L2.55036 2.39838C3.16689 2.61511 3.69052 2.79919 4.10261 3.00139C4.54324 3.21759 4.92109 3.48393 5.20527 3.89979C5.48725 4.31243 5.60367 4.76515 5.6574 5.26153C5.66124 5.29706 5.6648 5.33321 5.66809 5.36996L17.1203 5.36996C17.9389 5.36995 18.7735 5.36993 19.4606 5.44674C19.8103 5.48584 20.1569 5.54814 20.4634 5.65583C20.7639 5.76141 21.0942 5.93432 21.3292 6.23974C21.711 6.73613 21.7777 7.31414 21.7416 7.90034C21.7071 8.45845 21.5686 9.15234 21.4039 9.97723L21.3935 10.0295L21.3925 10.0341L20.8836 12.5033C20.7339 13.2298 20.6079 13.841 20.4455 14.3231C20.2731 14.8346 20.0341 15.2842 19.6076 15.6318C19.1811 15.9793 18.6925 16.1226 18.1568 16.1882C17.6518 16.25 17.0278 16.25 16.2862 16.25L10.8804 16.25C9.53464 16.25 8.44479 16.25 7.58656 16.1283C6.69032 16.0012 5.93752 15.7285 5.34366 15.1022C4.79742 14.526 4.50529 13.9144 4.35897 13.0601C4.22191 12.2598 4.20828 11.2125 4.20828 9.75996V7.03832C4.20828 6.29837 4.20726 5.80316 4.16611 5.42295C4.12678 5.0596 4.05708 4.87818 3.96682 4.74609C3.87876 4.61723 3.74509 4.4968 3.44186 4.34802C3.11902 4.18961 2.68026 4.03406 2.01266 3.79934L1.75145 3.7075C1.36068 3.57012 1.15527 3.14197 1.29266 2.7512ZM5.70828 6.86996L5.70828 9.75996C5.70828 11.249 5.72628 12.1578 5.83744 12.8068C5.93933 13.4018 6.11202 13.7324 6.43219 14.0701C6.70473 14.3576 7.08235 14.5418 7.79716 14.6432C8.53783 14.7482 9.5209 14.75 10.9377 14.75H16.2406C17.0399 14.75 17.5714 14.7487 17.9746 14.6993C18.3573 14.6525 18.5348 14.571 18.66 14.469C18.7853 14.3669 18.9009 14.2095 19.024 13.8441C19.1537 13.4592 19.2623 12.9389 19.4237 12.156L19.9225 9.73591L19.9229 9.73369C20.1005 8.84376 20.217 8.2515 20.2444 7.80793C20.2704 7.38648 20.2043 7.23927 20.1429 7.15786C20.1367 7.15259 20.0931 7.11565 19.9661 7.07101C19.8107 7.01639 19.5895 6.97049 19.2939 6.93745C18.6991 6.87096 17.9454 6.86996 17.089 6.86996H5.70828Z"
                        fill="#3C50E0"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M5.2502 19.5C5.2502 20.7426 6.25756 21.75 7.5002 21.75C8.74285 21.75 9.7502 20.7426 9.7502 19.5C9.7502 18.2573 8.74285 17.25 7.5002 17.25C6.25756 17.25 5.2502 18.2573 5.2502 19.5ZM7.5002 20.25C7.08599 20.25 6.7502 19.9142 6.7502 19.5C6.7502 19.0857 7.08599 18.75 7.5002 18.75C7.91442 18.75 8.2502 19.0857 8.2502 19.5C8.2502 19.9142 7.91442 20.25 7.5002 20.25Z"
                        fill="#3C50E0"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M14.25 19.5001C14.25 20.7427 15.2574 21.7501 16.5 21.7501C17.7426 21.7501 18.75 20.7427 18.75 19.5001C18.75 18.2574 17.7426 17.2501 16.5 17.2501C15.2574 17.2501 14.25 18.2574 14.25 19.5001ZM16.5 20.2501C16.0858 20.2501 15.75 19.9143 15.75 19.5001C15.75 19.0859 16.0858 18.7501 16.5 18.7501C16.9142 18.7501 17.25 19.0859 17.25 19.5001C17.25 19.9143 16.9142 20.2501 16.5 20.2501Z"
                        fill="#3C50E0"
                      />
                    </svg>

                    {mounted && product.length > 0 && (
                      <span className="flex items-center justify-center font-medium text-2xs absolute -right-2 -top-2.5 bg-blue w-4.5 h-4.5 rounded-full text-white">
                        {product.length}
                      </span>
                    )}
                  </span>
                </button>
                <button onClick={handleOpenWishlistModal} className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-1 sm:px-2.5">
                  <span className="inline-block relative">
                    <svg width="24" height="24" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M3.74949 2.94946C2.6435 3.45502 1.83325 4.65749 1.83325 6.0914C1.83325 7.55633 2.43273 8.68549 3.29211 9.65318C4.0004 10.4507 4.85781 11.1118 5.694 11.7564C5.89261 11.9095 6.09002 12.0617 6.28395 12.2146C6.63464 12.491 6.94747 12.7337 7.24899 12.9099C7.55068 13.0862 7.79352 13.1667 7.99992 13.1667C8.20632 13.1667 8.44916 13.0862 8.75085 12.9099C9.05237 12.7337 9.3652 12.491 9.71589 12.2146C9.90982 12.0617 10.1072 11.9095 10.3058 11.7564C11.142 11.1118 11.9994 10.4507 12.7077 9.65318C13.5671 8.68549 14.1666 7.55633 14.1666 6.0914C14.1666 4.65749 13.3563 3.45502 12.2503 2.94946C11.1759 2.45832 9.73214 2.58839 8.36016 4.01382C8.2659 4.11175 8.13584 4.16709 7.99992 4.16709C7.864 4.16709 7.73393 4.11175 7.63967 4.01382C6.26769 2.58839 4.82396 2.45832 3.74949 2.94946ZM7.99992 2.97255C6.45855 1.5935 4.73256 1.40058 3.33376 2.03998C1.85639 2.71528 0.833252 4.28336 0.833252 6.0914C0.833252 7.86842 1.57358 9.22404 2.5444 10.3172C3.32183 11.1926 4.2734 11.9253 5.1138 12.5724C5.30431 12.7191 5.48911 12.8614 5.66486 12.9999C6.00636 13.2691 6.37295 13.5562 6.74447 13.7733C7.11582 13.9903 7.53965 14.1667 7.99992 14.1667C8.46018 14.1667 8.88401 13.9903 9.25537 13.7733C9.62689 13.5562 9.99348 13.2691 10.335 12.9999C10.5107 12.8614 10.6955 12.7191 10.886 12.5724C11.7264 11.9253 12.678 11.1926 13.4554 10.3172C14.4263 9.22404 15.1666 7.86842 15.1666 6.0914C15.1666 4.28336 14.1434 2.71528 12.6661 2.03998C11.2673 1.40058 9.54129 1.5935 7.99992 2.97255Z"
                        fill="#3C50E0"
                      />
                    </svg>
                    {mounted && wishlist.length > 0 && (
                      <span className="flex items-center justify-center font-medium text-2xs absolute -right-2 -top-2.5 bg-blue w-4.5 h-4.5 rounded-full text-white">
                        {wishlist.length}
                      </span>
                    )}
                  </span>
                </button>
                {user ? (
                  <Link
                    href="/my-account"
                    title="Go to My Account"
                    className="group flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/95 p-1 sm:pr-3 shadow-2xs hover:border-sky-400 hover:bg-slate-50 hover:shadow-sm transition-all duration-200 cursor-pointer"
                  >
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.name || "user"}
                        width={34}
                        height={34}
                        className="h-8 w-8 rounded-full object-cover ring-2 ring-sky-500/25 group-hover:ring-sky-500 transition-all shrink-0"
                      />
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold text-xs shadow-2xs ring-2 ring-sky-500/25 group-hover:ring-sky-500 transition-all">
                        {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                      </div>
                    )}

                    <span className="hidden sm:block font-semibold text-xs text-slate-800 group-hover:text-sky-600 transition truncate max-w-[130px]">
                      {user.name}
                    </span>

                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition hidden sm:block shrink-0"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </Link>
                ) : (
                  <Link
                    href="/signin"
                    title="Sign In to your account"
                    className="group flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/95 px-3 py-1.5 shadow-2xs hover:border-sky-400 hover:bg-slate-50 hover:shadow-sm transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 group-hover:bg-sky-50 group-hover:text-sky-600 transition">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>

                    <div className="text-left leading-tight">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Account
                      </span>
                      <p className="font-semibold text-xs text-slate-800 group-hover:text-sky-600 transition">
                        Sign In
                      </p>
                    </div>
                  </Link>
                )}
              </div>

              {/* <!-- Hamburger Toggle BTN --> */}
              <button
                id="Toggle"
                aria-label="Toggler"
                className="block xl:hidden"
                ref={navToggleRef}
                onClick={handleNavigationToggle}
              >
                <span className="block relative cursor-pointer w-5.5 h-5.5">
                  <span className="du-block absolute right-0 w-full h-full">
                    <span
                      className={`block relative top-0 left-0 bg-dark rounded-sm w-0 h-0.5 my-1 ease-in-out duration-200 delay-[0] ${
                        !navigationOpen && "!w-full delay-300"
                      }`}
                    ></span>
                    <span
                      className={`block relative top-0 left-0 bg-dark rounded-sm w-0 h-0.5 my-1 ease-in-out duration-200 delay-150 ${
                        !navigationOpen && "!w-full delay-400"
                      }`}
                    ></span>
                    <span
                      className={`block relative top-0 left-0 bg-dark rounded-sm w-0 h-0.5 my-1 ease-in-out duration-200 delay-200 ${
                        !navigationOpen && "!w-full delay-500"
                      }`}
                    ></span>
                  </span>

                  <span className="block absolute right-0 w-full h-full rotate-45">
                    <span
                      className={`block bg-dark rounded-sm ease-in-out duration-200 delay-300 absolute left-2.5 top-0 w-0.5 h-full ${
                        !navigationOpen && "!h-0 delay-[0] "
                      }`}
                    ></span>
                    <span
                      className={`block bg-dark rounded-sm ease-in-out duration-200 delay-400 absolute left-0 top-2.5 w-full h-0.5 ${
                        !navigationOpen && "!h-0 dealy-200"
                      }`}
                    ></span>
                  </span>
                </span>
              </button>
              {/* //   <!-- Hamburger Toggle BTN --> */}
            </div>
          </div>
        </div>
        <div className="relative z-10 pb-4 lg:hidden">
          {renderSearchBox("w-full", mobileSearchRef)}
        </div>
        {/* <!-- header top end --> */}
      </div>
    </header>
  );
};

export default Header;

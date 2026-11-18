"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import RecentlyViewdItems from "./RecentlyViewd";
import { addProductReview, deleteMyProductReview, getMyProductReview, getProductBySlug, getProductReviews, updateMyProductReview } from "@/http/apiCalls";
import { getCurrencyDetails, getOfferPercent, getStoredToken, redirectToSignIn } from "@/utils/helper";
import AddToCart from "../Common/AddToCart";
import AvailableStock from "../Common/AvailableStock";
import WishlistButton from "../Common/WishlistButton";
import { confirmAction, notifyError, notifySuccess } from "@/utils/notify";
import { useRouter } from "next/navigation";
import { STATUS_TYPES } from "@/utils/constants";
import { useTenant } from "@/app/context/TenantContext";

const renderStars = (rating = 0, size = 18) => {
  const rounded = Math.round(rating);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={i <= rounded ? "fill-[#FFA645]" : "fill-gray-3"}
          width={size}
          height={size}
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M16.7906 6.72187L11.7 5.93438L9.39377 1.09688C9.22502 0.759375 8.77502 0.759375 8.60627 1.09688L6.30002 5.9625L1.23752 6.72187C0.871891 6.77812 0.731266 7.25625 1.01252 7.50938L4.69689 11.3063L3.82502 16.6219C3.76877 16.9875 4.13439 17.2969 4.47189 17.0719L9.05627 14.5687L13.6125 17.0719C13.9219 17.2406 14.3156 16.9594 14.2313 16.6219L13.3594 11.3063L17.0438 7.50938C17.2688 7.25625 17.1563 6.77812 16.7906 6.72187Z" />
        </svg>
      ))}
    </div>
  );
};

const ShopDetails = ({ params, initialProduct = null, initialReviews = [] }) => {
  const router = useRouter();
  const { storeHref } = useTenant();
  const [product, setProduct] = useState(initialProduct);
  const [previewImg, setPreviewImg] = useState(0);
  const [reviews, setReviews] = useState(initialReviews);
  const [myReviews, setMyReviews] = useState([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [activeReview, setActiveReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const hasHydratedInitialReviews = useRef(Boolean(initialProduct));

  const handleNotFound = () => {
    router.replace(storeHref("/404"));
  };

  const fetchProduct = async () => {
    try {
      const response = await getProductBySlug(params);

      if (response?.httpStatus === 404) {
        handleNotFound();
        return;
      }

      if (!response?.success) {
        notifyError(response?.message || "Unable to load product.");
        return;
      }

      const productData = response?.data;
      if (!productData || productData.status !== STATUS_TYPES.ACTIVE) {
        handleNotFound();
        return;
      }

      const images = Array.isArray(productData.images) ? productData.images.map((i) => i.path) : [];
      setProduct({ ...productData, images });
    } catch (error) {
      if (error?.response?.status === 404) {
        handleNotFound();
        return;
      }
      console.log(error);
      notifyError("Unable to load product.");
    }
  };

  const fetchReviews = async (productId) => {
    try {
      const response = await getProductReviews(productId);
      setReviews(response?.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchMyReview = async (productId) => {
    try {
      if (!getStoredToken()) {
        setMyReviews([]);
        return;
      }
      const response = await getMyProductReview(productId);
      setMyReviews(response?.data || []);
    } catch (error) {
      console.log(error);
      setMyReviews([]);
    }
  };

  useEffect(() => {
    if (initialProduct && initialProduct.slug === params?.slug) {
      return;
    }
    fetchProduct();
  }, [params?.slug]);

  useEffect(() => {
    if (!product?.id) return;
    if (hasHydratedInitialReviews.current) {
      hasHydratedInitialReviews.current = false;
    } else {
      fetchReviews(product.id);
    }
    fetchMyReview(product.id);
  }, [product?.id]);

  const visibleAvg = useMemo(() => {
    if (typeof product?.avgRating === "number") return product.avgRating;
    if (reviews.length === 0) return 0;
    return reviews.reduce((a, c) => a + c.rating, 0) / reviews.length;
  }, [product?.avgRating, reviews]);

  const reviewCount = product?.reviewCount ?? reviews.length;
  const myReviewIds = useMemo(() => new Set((myReviews || []).map((review) => review.id)), [myReviews]);
  const displayedReviews = useMemo(() => {
    const ownReviews = reviews.filter((review) => myReviewIds.has(review.id)).map((review) => ({ ...review, isMine: true }));
    const otherReviews = reviews.filter((review) => !myReviewIds.has(review.id)).map((review) => ({ ...review, isMine: false }));
    return [...ownReviews, ...otherReviews];
  }, [myReviewIds, reviews]);

  const handleOpenCreateReview = () => {
    if (!getStoredToken()) {
      redirectToSignIn(`/shop-details/${params.slug}`);
      return;
    }
    setActiveReview(null);
    setRating(5);
    setComment("");
    setIsReviewModalOpen(true);
  };

  const handleOpenEditReview = (review) => {
    if (!getStoredToken()) {
      redirectToSignIn(`/shop-details/${params.slug}`);
      return;
    }
    setActiveReview(review);
    setRating(review.rating || 5);
    setComment(review.comment || "");
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!product?.id) return;
    if (!getStoredToken()) {
      redirectToSignIn(`/shop-details/${params.slug}`);
      return;
    }

    try {
      setSubmitting(true);
      const response = activeReview
        ? await updateMyProductReview(activeReview.id, { rating, comment })
        : await addProductReview(product.id, { rating, comment });
      if (!response?.success) {
        notifyError(response?.message || "Unable to save review.");
        return;
      }

      notifySuccess("Review saved successfully.");
      setProduct((prev) => ({
        ...prev,
        avgRating: response?.data?.avgRating ?? prev?.avgRating ?? 0,
        reviewCount: response?.data?.reviewCount ?? prev?.reviewCount ?? 0,
      }));
      setActiveReview(null);
      setRating(5);
      setComment("");
      await fetchReviews(product.id);
      await fetchMyReview(product.id);
      setIsReviewModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (review) => {
    if (!product?.id || !review?.id) return;
    if (!getStoredToken()) {
      redirectToSignIn(`/shop-details/${params.slug}`);
      return;
    }

    const isConfirmed = await confirmAction({
      title: "Delete review?",
      content: "This will remove your review from this product.",
      okText: "Delete",
    });
    if (!isConfirmed) return;

    try {
      setDeleting(true);
      const response = await deleteMyProductReview(review.id);
      if (!response?.success) {
        notifyError(response?.message || "Unable to delete review.");
        return;
      }

      notifySuccess("Review deleted successfully.");
      setMyReviews((prev) => prev.filter((item) => item.id !== review.id));
      setActiveReview(null);
      setRating(5);
      setComment("");
      setProduct((prev) => ({
        ...prev,
        avgRating: response?.data?.avgRating ?? prev?.avgRating ?? 0,
        reviewCount: response?.data?.reviewCount ?? prev?.reviewCount ?? 0,
      }));
      await fetchReviews(product.id);
      await fetchMyReview(product.id);
      setIsReviewModalOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteMyReview = async () => {
    await handleDeleteReview(activeReview);
  };

  return (
    <>
      {!product ? null : (
        <>
          <section className="overflow-hidden relative pb-20 pt-5 lg:pt-20 xl:pt-28">
            <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
              <nav aria-label="Breadcrumb" className="mb-6 text-sm text-dark-4">
                <ol className="flex flex-wrap items-center gap-2">
                  <li>
                    <Link href={storeHref("/")} className="hover:text-blue transition">
                      Home
                    </Link>
                  </li>
                  <li aria-hidden="true">/</li>
                  <li>
                    <Link href={storeHref("/shop")} className="hover:text-blue transition">
                      Shop
                    </Link>
                  </li>
                  <li aria-hidden="true">/</li>
                  <li aria-current="page" className="font-medium text-dark line-clamp-1">
                    {product.title}
                  </li>
                </ol>
              </nav>

              <div className="flex flex-col lg:flex-row gap-7.5 xl:gap-17.5">
                <div className="lg:max-w-[570px] w-full">
                  <div className="lg:min-h-[512px] rounded-lg shadow-1 bg-gray-2 p-4 sm:p-7.5 relative flex items-center justify-center">
                    <div>
                      {product.images[previewImg] && (
                        <img
                          src={product.images[previewImg]}
                          alt={product.title}
                          width={400}
                          height={400}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap gap-4.5 mt-6">
                    {product.images.map((item, key) => (
                      <button
                        type="button"
                        onClick={() => setPreviewImg(key)}
                        key={key}
                        aria-label={`View ${product.title} image ${key + 1}`}
                        className={`flex items-center justify-center w-15 sm:w-25 h-15 sm:h-25 overflow-hidden rounded-lg bg-gray-2 shadow-1 ease-out duration-200 border-2 hover:border-blue ${key === previewImg ? "border-blue" : "border-transparent"}`}
                      >
                        <img
                          width={50}
                          height={50}
                          src={item}
                          alt={`${product.title} thumbnail ${key + 1}`}
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="max-w-[539px] w-full">
                  <div className="flex items-center justify-between mb-3">
                    <h1 className="font-semibold text-xl sm:text-2xl xl:text-custom-3 text-dark">{product.title}</h1>
                    <div className="flex items-center gap-2">
                      <div className="inline-flex font-medium text-custom-sm text-white bg-blue rounded py-0.5 px-2.5">
                        {getOfferPercent(product.mrp, product.price)}% OFF
                      </div>
                      <WishlistButton productId={product.id} compact />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-5.5 mb-4.5">
                    {reviewCount > 0 && (
                      <div className="flex items-center gap-2.5">
                        {renderStars(visibleAvg, 18)}
                        <span className="text-dark-2">({reviewCount} reviews)</span>
                      </div>
                    )}
                    <AvailableStock stock={product.stock} />
                  </div>

                  <h3 className="font-medium text-custom-1 mb-4.5">
                    <span className="text-xl text-dark">Price: {getCurrencyDetails().currencySymbol}{product.price}</span>
                    <span className="line-through text-lg ml-2">{getCurrencyDetails().currencySymbol} {product.mrp}</span>
                  </h3>

                  {product.description && (
                    <div className="rounded-2xl border border-gray-3 bg-white/80 px-4 py-4 text-sm leading-7 text-dark-4">
                      {product.description}
                    </div>
                  )}

                  <div className="flex flex-col gap-4.5 border-y border-gray-3 mt-7.5 mb-6 py-9">
                    <div className="flex items-center gap-4">
                      <div className="min-w-[65px]">
                        <h4 className="font-medium text-dark">Color:</h4>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className={`flex items-center justify-center w-5.5 h-5.5 rounded-full border`} style={{ borderColor: `${product.colorCode}` }}>
                          <span className="block w-3 h-3 rounded-full" style={{ backgroundColor: `${product.colorCode}` }}></span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="min-w-[65px]">
                        <h4 className="font-medium text-dark">Size:</h4>
                      </div>
                      <input type="text" value={product.sizeTitle} readOnly className="focus:outline-none" />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center w-full gap-3">
                    <AddToCart align="right" id={product.id} stack={false} stock={product.stock} />
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-lg text-dark">Customer Reviews</h3>
                  <button
                    type="button"
                    onClick={handleOpenCreateReview}
                    className="inline-flex rounded-md bg-blue px-4 py-2 text-white hover:bg-blue-dark"
                  >
                    Write a Review
                  </button>
                </div>
                {displayedReviews.length > 0 ? (
                  <div className="space-y-4">
                    {displayedReviews.map((review) => (
                      <div key={review.id} className="rounded-lg border border-gray-3 p-4 bg-white">
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <p className="font-medium text-dark">{review?.user?.name || "Customer"}</p>
                          <div className="flex items-center gap-2">
                            {review?.isMine && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditReview(review)}
                                  aria-label="Edit review"
                                  title="Edit review"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-blue text-blue hover:bg-blue hover:text-white"
                                >
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M4 20H8L18.5 9.5C19.3 8.7 19.3 7.4 18.5 6.6L17.4 5.5C16.6 4.7 15.3 4.7 14.5 5.5L4 16V20Z"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReview(review)}
                                  disabled={deleting}
                                  aria-label="Delete review"
                                  title="Delete review"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red text-red hover:bg-red hover:text-white"
                                >
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M3 6H21"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                    <path
                                      d="M8 6V4C8 3.4 8.4 3 9 3H15C15.6 3 16 3.4 16 4V6"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                    <path
                                      d="M19 6V20C19 20.6 18.6 21 18 21H6C5.4 21 5 20.6 5 20V6"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                    <path
                                      d="M10 11V17"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                    <path
                                      d="M14 11V17"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </button>
                              </>
                            )}
                            {renderStars(review.rating, 14)}
                          </div>
                        </div>
                        {review.comment && <p className="text-dark-4 text-sm">{review.comment}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-dark-4">No reviews yet.</p>
                )}
              </div>
            </div>
          </section>

          {isReviewModalOpen && (
            <div
              className="fixed inset-0 z-99999 bg-dark/70 flex items-center justify-center px-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsReviewModalOpen(false);
              }}
            >
              <div className="w-full max-w-xl rounded-lg bg-white shadow-1 p-5 sm:p-7 relative">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  aria-label="close review modal"
                  className="absolute right-3 top-3 text-dark-5 hover:text-dark text-2xl leading-none"
                >
                  ×
                </button>
                <h4 className="font-medium text-dark mb-4">
                  {activeReview ? "Edit Your Review" : "Write a Review"}
                </h4>
                <form onSubmit={handleReviewSubmit}>
                  <div className="flex items-center gap-2 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="text-2xl leading-none"
                      >
                        <span className={star <= rating ? "text-[#FFA645]" : "text-gray-3"}>★</span>
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={5}
                    placeholder="Share your experience..."
                    className="w-full rounded-md border border-gray-3 px-3 py-2 mb-4"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex rounded-md bg-blue px-4 py-2 text-white hover:bg-blue-dark"
                  >
                    {submitting ? "Saving..." : activeReview ? "Update Review" : "Submit Review"}
                  </button>
                  {activeReview && (
                    <button
                      type="button"
                      onClick={handleDeleteMyReview}
                      disabled={deleting}
                      className="inline-flex rounded-md bg-red px-4 py-2 text-white hover:opacity-90 ml-3"
                    >
                      {deleting ? "Deleting..." : "Delete Review"}
                    </button>
                  )}
                </form>
              </div>
            </div>
          )}

          {product.variant && <RecentlyViewdItems product={product} />}
        </>
      )}
    </>
  );
};

export default ShopDetails;

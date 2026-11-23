"use client";

import AdminOverview from "@/components/Common/AdminOverview";
import FileUploader from "@/components/Common/FileUploader";
import LoaderOverlay from "@/components/Common/LoaderOverlay";
import { createProduct, deleteProduct, getCategories, getColors, getHsnCodes, getProductBySlugAdmin, getProductReviewsForAdmin, getSizes, updateProduct, updateProductReviewVisibility } from "@/http/apiCalls";
import { STATUS_TYPES } from "@/utils/constants";
import { PRODUCT_URL } from "@/utils/appUrls";
import React from "react";
import { useRouter } from "next/navigation";
import { Select } from "antd";
import { confirmAction, notifyError, notifySuccess } from "@/utils/notify";
import { withTenantPath } from "@/lib/tenantUrl";

const ProductForm = ({ params }) => {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [variant, setVariant] = React.useState("");
  const [status, setStatus] = React.useState(STATUS_TYPES.ACTIVE);
  const [images, setImages] = React.useState([]);
  const [apiState, setApiState] = React.useState<"loading" | "creating" | "updating" | null>(null);
  const editDataRef = React.useRef({});
  const [categoryItems, setCategoryItems] = React.useState([]);
  const [categoryId, setCategoryId] = React.useState(null);
  const [hsnItems, setHsnItems] = React.useState([]);
  const [hsnId, setHsnId] = React.useState(null);
  const [colorId, setColorId] = React.useState(null);
  const [colorItems, setColorItems] = React.useState([]);
  const [sizeId, setSizeId] = React.useState(null);
  const [sizeItems, setSizeItems] = React.useState([]);
  const [mrp, setMrp] = React.useState(1);
  const [price, setPrice] = React.useState(1);
  const [stock, setStock] = React.useState(1);
  const [reviews, setReviews] = React.useState([]);
  const tax = hsnItems.find(i => i.id == hsnId)?.tax || 0;
  const fileIdsRef = React.useRef(new Set());
  const deletedFileIdsRef = React.useRef(new Set());
  
  const loaderTextMap = {
    loading: "Loading product details...",
    creating: "Creating product...",
    updating: "Updating product...",
  } as const;
  const loaderMessage = apiState ? loaderTextMap[apiState] : "";
  
  
  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories({status: STATUS_TYPES.ACTIVE});
        setCategoryItems(data?.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchCategories();
  }, []);

  React.useEffect(() => {
    const fetchColors = async () => {
      try {
        const data = await getColors({status: STATUS_TYPES.ACTIVE});
        setColorItems(data?.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchColors();
  }, []);

  React.useEffect(() => {
    const fetchSizes = async () => {
      try {
        const data = await getSizes({status: STATUS_TYPES.ACTIVE});
        setSizeItems(data?.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchSizes();
  }, []);

  React.useEffect(() => {
    const fetchHsn = async () => {
      try {
        const data = await getHsnCodes({status: STATUS_TYPES.ACTIVE});
        setHsnItems(data?.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchHsn();
  }, []);

  let isNew = params.slug === 'new';

  const fetchReviews = async (productId) => {
    try {
      const data = await getProductReviewsForAdmin(productId);
      setReviews(data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if(images.length === 0){
      notifyError("Select at least one file.");
      return;
    }
    let data = { title, description, status, categoryId, hsnId, sizeId, colorId, mrp, price, stock,variant, fileIds: [...fileIdsRef.current], deletedFileIds: [...deletedFileIdsRef.current] }
    setApiState(isNew ? "creating" : "updating");
    try {
      const response:any = isNew
        ? await createProduct(data)
        : await updateProduct({...data, id: editDataRef.current.id, oldStockQty: editDataRef.current.stock });

      if(response.success){
        router.replace(withTenantPath(PRODUCT_URL));
      }else{
        let currentStock = response.data.currentStockQty;
        setStock(currentStock);
        editDataRef.current.stock = currentStock;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApiState(null);
    }
  };
  
  const handleDelete = async (e) => {
    e.preventDefault();
    const isConfirmed = await confirmAction({
      title: "Delete product?",
      content: `This will delete "${title}" product.`,
      okText: "Delete",
    });
    if(!isConfirmed) return;
    if(!isNew){
      let response = await deleteProduct({id: editDataRef.current.id})
      if(response.success){
         router.replace(withTenantPath(PRODUCT_URL));
      }
    }
  };



  React.useEffect(() => {
    if(isNew) return;
    const fetchProduct = async () => {
      try {
        setApiState("loading");
        const data = await getProductBySlugAdmin(params);
        if (!data?.success) {
          // If unauthorized or not found in admin scope, gracefully route to the public shop-details page
          if (data?.httpStatus === 401 || data?.httpStatus === 404 || !data?.data) {
            router.replace(withTenantPath(`/shop-details/${params.slug}`));
            return;
          }
        }
        editDataRef.current = data?.data || {};
        setVariant(editDataRef.current.variant || "");
        setTitle(editDataRef.current.title || "");
        setDescription(editDataRef.current.description || "");
        setStatus(editDataRef.current.status || STATUS_TYPES.ACTIVE);
        setImages(Array.isArray(editDataRef.current.images) ? editDataRef.current.images : []);
        setCategoryId(editDataRef.current.categoryId || null);
        setHsnId(editDataRef.current.hsnId || null);
        setColorId(editDataRef.current.colorId || null);
        setSizeId(editDataRef.current.sizeId || null);
        setMrp(editDataRef.current.mrp ?? 1);
        setPrice(editDataRef.current.price ?? 1);
        setStock(editDataRef.current.stock ?? 1);
        if (editDataRef.current.id) {
          fetchReviews(editDataRef.current.id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setApiState(null);
      }
    };

    fetchProduct();
    }, []);

  const handleToggleReviewVisibility = async (review) => {
    const response = await updateProductReviewVisibility(review.id, !review.isHidden);
    if (response?.success) {
      notifySuccess(`Review ${review.isHidden ? "unhidden" : "hidden"} successfully.`);
      fetchReviews(editDataRef.current.id);
    }
  };
  

  return (
    <>
      {apiState && <LoaderOverlay message={loaderMessage} />}
      <section className="page-section">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <AdminOverview
            eyebrow="Catalog Admin"
            title={isNew ? "Create a new product." : "Edit product details."}
            description="Manage pricing, stock, media, attributes, and review moderation from a single product workspace."
          />
          <div className="form-card max-w-[760px] w-full mx-auto">

            <div className="text-center mb-8">
              <h2 className="font-semibold text-xl sm:text-2xl text-dark">
                {isNew ? "Create Product" : "Product Details"} 
              </h2>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Product Variant */}
              <div className="mb-5">
                <label className="form-label">Product Variant</label>
                <input
                  type="text"
                  placeholder="Enter Variant"
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                  required
                  className="form-input"
                />
              </div>

              {/* Product Name */}
              <div className="mb-5">
                <label className="form-label">Product Name</label>
                <input
                  type="text"
                  placeholder="Enter Product name"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="form-input"
                />
              </div>

              <div className="mb-5">
                <label className="form-label">Product Description</label>
                <textarea
                  placeholder="Enter product description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="form-input min-h-[140px] resize-y py-4"
                />
              </div>

              {/* Category */}
              <div className="mb-7">
                <label className="form-label">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="form-input"
                >
                  <option value={null}>Select</option>
                  {categoryItems.map(value => 
                    <option key={value.id} value={value.id}>{value.title}</option>
                  )}
                </select>
              </div>

              {/* Color / Size */}
              <div className="admin-form-grid mb-7">
                <div>
                  <label className="form-label">Color</label>
                  <Select value={colorId} onChange={(value) => setColorId(value)} style={{ width: "100%" }} className="h-13 bg-gray w-full">
                    {colorItems.map(item => (
                      <Select.Option key={item.id} value={item.id}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              width: 16,
                              height: 16,
                              backgroundColor: item.code,
                              display: 'inline-block',
                              borderRadius: 4,
                              border: '1px solid #ccc'
                            }}
                          />
                          {item.title}
                        </div>
                      </Select.Option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="form-label">Size</label>
                  <select
                    itemType="number"
                    value={sizeId}
                    onChange={(e) => {
                      setSizeId(e.target.value); 
                    }}
                    className="form-input"
                    >
                    <option value={null}>Select</option>
                    {sizeItems.map(value => 
                      <option key={value.id} value={value.id}>{value.title}</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Hsn */}
              <div className="admin-form-grid mb-7">
                <div>
                  <label className="form-label">Hsn</label>
                  <select
                    itemType="number"
                    value={hsnId}
                    onChange={(e) => {
                      setHsnId(e.target.value); 
                    }}
                    className="form-input"
                    >
                    <option value={null}>Select</option>
                    {hsnItems.map(value => 
                      <option key={value.id} value={value.id}>{value.code}</option>
                    )}
                  </select>
                </div>
                <div>
                <label className="form-label">Tax</label>
                <input
                  type="text"
                  placeholder="Enter Tax"
                  value={tax}
                  disabled
                  className="form-input"
                />
              </div>
              </div>

              <div className="admin-form-grid mb-7">
                <div>
                  <label className="form-label">Mrp</label>
                  <input
                  type="number"
                  placeholder="Enter MRP"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  required
                  min={1}
                  className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Price</label>
                  <input
                  type="number"
                  placeholder="Enter Price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  min={1}
                  className="form-input"
                  />
                </div>
              </div>

              <div className="mb-7">
                  <label className="form-label">Stock</label>
                  <input
                  type="number"
                  placeholder="Enter stock"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                  min={1}
                  className="form-input"
                  />
              </div>



              {/* Product Image */}
              <div className="mb-5">
                <label className="form-label">Product Image</label>
                <FileUploader files={images} setFiles={setImages} multiSelect fileIdsRef={fileIdsRef} deletedFileIdsRef={deletedFileIdsRef} />
              </div>

              {/* Status */}
              <div className="mb-7">
                <label className="form-label">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="form-input"
                >
                  {Object.values(STATUS_TYPES).map(value => 
                    <option key={value} value={value}>{value}</option>
                  )}
                </select>
              </div>

              {/* Submit */}
              <div className="flex w-full flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className="btn-primary w-full sm:flex-1"
              >
                Save Product
              </button>
              {!isNew &&
                  <button
                  type="button"
                  onClick={handleDelete}
                  className="btn-danger w-full sm:w-auto sm:min-w-[160px]"
                  >
                  Delete
                  </button>
              }
              </div>
            </form>

            {!isNew && (
              <div className="mt-10 border-t border-gray-3 pt-6">
                <h3 className="text-lg font-semibold text-dark mb-4">Reviews</h3>
                {reviews.length === 0 ? (
                  <p className="text-sm text-dark-4">No reviews yet.</p>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((review) => (
                      <div key={review.id} className="rounded-lg border border-gray-3 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-dark">{review?.user?.name || "User"}</p>
                            <p className="text-sm text-dark-4">Rating: {review.rating}/5</p>
                            {review.comment && <p className="text-sm text-dark mt-1">{review.comment}</p>}
                            <p className={`text-xs mt-1 ${review.isHidden ? "text-red" : "text-green"}`}>
                              {review.isHidden ? "Hidden" : "Visible"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleReviewVisibility(review)}
                            className={`rounded-md px-3 py-1.5 text-white ${review.isHidden ? "bg-blue hover:bg-blue-dark" : "bg-red hover:opacity-90"}`}
                          >
                            {review.isHidden ? "Unhide" : "Hide"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </section>
    </>
  );
};

export default ProductForm;

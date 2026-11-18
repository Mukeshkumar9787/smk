"use client";

import AdminOverview from "@/components/Common/AdminOverview";
import FileUploader from "@/components/Common/FileUploader";
import LoaderOverlay from "@/components/Common/LoaderOverlay";
import { createCategory, deleteCategory, getCategoryBySlug, updateCategory } from "@/http/apiCalls";
import { STATUS_TYPES } from "@/utils/constants";
import { CATEGORY_URL } from "@/utils/appUrls";
import React from "react";
import { useRouter } from "next/navigation";
import { confirmAction, notifyError } from "@/utils/notify";
import { withTenantPath } from "@/lib/tenantUrl";

const CategoryForm = ({ params }) => {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [status, setStatus] = React.useState(STATUS_TYPES.ACTIVE);
  const [image, setImage] = React.useState(null);
  const [apiState, setApiState] = React.useState<"loading" | "creating" | "updating" | null>(null);
  const editDataRef = React.useRef({ title: '', status: STATUS_TYPES.ACTIVE, id: '', img: null, fileId: '' });
  const fileIdsRef = React.useRef(new Set());
  const deletedFileIdsRef = React.useRef(new Set());

  let isNew = params.slug === 'new';

  const buildCategoryFilePayload = React.useCallback(() => {
    const nextFileIds = [...fileIdsRef.current].slice(0, 1);
    const nextDeletedFileIds = new Set(deletedFileIdsRef.current);
    const originalFileId = editDataRef.current.fileId;

    if (!isNew && originalFileId && image?.id !== originalFileId) {
      nextDeletedFileIds.add(originalFileId);
    }

    return {
      fileIds: nextFileIds,
      deletedFileIds: [...nextDeletedFileIds],
    };
  }, [image, isNew]);

  const loaderTextMap = {
    loading: "Loading category details...",
    creating: "Creating category...",
    updating: "Updating category...",
  } as const;

  const loaderMessage = apiState ? loaderTextMap[apiState] : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!image){
      notifyError("Select a file.");
      return;
    }

    const filePayload = buildCategoryFilePayload();
    setApiState(isNew ? "creating" : "updating");
    try {
      const response:any = isNew
        ? await createCategory({ title, status, ...filePayload })
        : await updateCategory({ title, status, ...filePayload, id: editDataRef.current.id });

      if(response.success){
        router.replace(withTenantPath(CATEGORY_URL));
      }
    } catch (err) {
      console.error(err);
      notifyError("Unable to save category. Please try again.");
    } finally {
      setApiState(null);
    }
  };
  
  const handleDelete = async (e) => {
    e.preventDefault();
    const isConfirmed = await confirmAction({
      title: "Delete category?",
      content: `This will delete "${title}" category.`,
      okText: "Delete",
    });
    if(!isConfirmed) return;
    if(!isNew){
      let response = await deleteCategory({id: editDataRef.current.id})
      if(response.success){
         router.replace(withTenantPath(CATEGORY_URL));
      }
    }
  };



  React.useEffect(() => {
    if(isNew) return;
    const fetchCategory = async () => {
      try {
        setApiState("loading");
        const data = await getCategoryBySlug(params);
        editDataRef.current = data?.data || {};
        setTitle(editDataRef.current.title);
        setStatus(editDataRef.current.status);
        setImage({id: editDataRef.current.fileId, path: editDataRef.current.img});
      } catch (err) {
        console.error(err);
      } finally {
        setApiState(null);
      }
    };

    fetchCategory();
    }, []);
  

  return (
    <>
      {apiState && <LoaderOverlay message={loaderMessage} />}
      <section className="page-section">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <AdminOverview
            eyebrow="Catalog Admin"
            title={isNew ? "Create a new category." : "Edit category details."}
            description="Define category names, artwork, and status so catalog organization stays clean and storefront-ready."
          />
          <div className="form-card max-w-[620px] w-full mx-auto">

            <div className="text-center mb-8">
              <h2 className="font-semibold text-xl sm:text-2xl text-dark">
                {isNew ? "Create Category" : "Category Details"} 
              </h2>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Category Name */}
              <div className="mb-5">
                <label className="form-label">Category Name</label>
                <input
                  type="text"
                  placeholder="Enter category name"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="form-input"
                />
              </div>

              {/* Category Image */}
              <div className="mb-5">
                <label className="form-label">Category Image</label>
                <FileUploader files={image} setFiles={setImage} fileIdsRef={fileIdsRef} deletedFileIdsRef={deletedFileIdsRef} />
                <p className="mt-2 text-xs text-slate-500">Only one image is allowed for a category.</p>
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
                Save Category
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

          </div>
        </div>
      </section>
    </>
  );
};

export default CategoryForm;

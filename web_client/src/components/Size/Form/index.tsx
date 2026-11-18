"use client";

import AdminOverview from "@/components/Common/AdminOverview";
import LoaderOverlay from "@/components/Common/LoaderOverlay";
import { createSize, deleteSize, getSizeBySlug, updateSize } from "@/http/apiCalls";
import { STATUS_TYPES } from "@/utils/constants";
import { SIZE_URL } from "@/utils/appUrls";
import React from "react";
import { useRouter } from "next/navigation";
import { confirmAction } from "@/utils/notify";
import { withTenantPath } from "@/lib/tenantUrl";

const SizeForm = ({ params }) => {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [status, setStatus] = React.useState(STATUS_TYPES.ACTIVE);
  const [apiState, setApiState] = React.useState<"loading" | "creating" | "updating" | null>(null);
  const editDataRef = React.useRef({ title: '', status: STATUS_TYPES.ACTIVE, id: ''});

  const loaderTextMap = {
    loading: "Loading size details...",
    creating: "Creating size...",
    updating: "Updating size...",
  } as const;
  const loaderMessage = apiState ? loaderTextMap[apiState] : "";

  let isNew = params.slug === 'new';


  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiState(isNew ? "creating" : "updating");
    try {
      const response:any = isNew
        ? await createSize({ title, status })
        : await updateSize({ title, status, id: editDataRef.current.id });

      if(response.success){
         router.replace(withTenantPath(SIZE_URL));
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
      title: "Delete size?",
      content: `This will delete "${title}" size.`,
      okText: "Delete",
    });
    if(!isConfirmed) return;
    if(!isNew){
      let response = await deleteSize({id: editDataRef.current.id})
      if(response.success){
         router.replace(withTenantPath(SIZE_URL));
      }
    }
  };



  React.useEffect(() => {
    if(isNew) return;
    const fetchSize = async () => {
      try {
        setApiState("loading");
        const data = await getSizeBySlug({slug: params.slug});
        editDataRef.current = data?.data || {};
        setTitle(editDataRef.current.title);
        setStatus(editDataRef.current.status);
      } catch (err) {
        console.error(err);
      } finally {
        setApiState(null);
      }
    };

    fetchSize();
    }, []);
  

  return (
    <>
      {apiState && <LoaderOverlay message={loaderMessage} />}
      <section className="page-section">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <AdminOverview
            eyebrow="Catalog Admin"
            title={isNew ? "Create a new size." : "Edit size details."}
            description="Maintain consistent size options and control whether they remain available across the catalog."
          />
          <div className="form-card max-w-[620px] w-full mx-auto">

            <div className="text-center mb-8">
              <h2 className="font-semibold text-xl sm:text-2xl text-dark">
                {isNew ? "Create Size" : "Size Details"} 
              </h2>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Size Name */}
              <div className="admin-form-section mb-6">
                <label className="form-label">Size</label>
                <input
                  type="text"
                  placeholder="Enter Size"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="form-input"
                />
              </div>

              {/* Status */}
              <div className="admin-form-section mb-7">
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
                Save Size
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

export default SizeForm;

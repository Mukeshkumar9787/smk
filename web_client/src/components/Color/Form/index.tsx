"use client";

import AdminOverview from "@/components/Common/AdminOverview";
import LoaderOverlay from "@/components/Common/LoaderOverlay";
import { createColor, deleteColor, getColorBySlug, updateColor } from "@/http/apiCalls";
import { STATUS_TYPES } from "@/utils/constants";
import { COLOR_URL } from "@/utils/appUrls";
import React from "react";
import { useRouter } from "next/navigation";
import { confirmAction } from "@/utils/notify";
import { withTenantPath } from "@/lib/tenantUrl";

const ColorForm = ({ params }) => {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [code, setCode] = React.useState("");
  const [status, setStatus] = React.useState(STATUS_TYPES.ACTIVE);
  const [apiState, setApiState] = React.useState<"loading" | "creating" | "updating" | null>(null);
  const editDataRef = React.useRef({ title: '', status: STATUS_TYPES.ACTIVE, id: '', code: ''});

  const loaderTextMap = {
    loading: "Loading color details...",
    creating: "Creating color...",
    updating: "Updating color...",
  } as const;
  const loaderMessage = apiState ? loaderTextMap[apiState] : "";

  let isNew = params.slug === 'new';


  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiState(isNew ? "creating" : "updating");
    try {
      const response:any = isNew
        ? await createColor({ title, code, status })
        : await updateColor({ title, code, status, id: editDataRef.current.id });

      if(response.success){
         router.replace(withTenantPath(COLOR_URL));
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
      title: "Delete color?",
      content: `This will delete "${title}" color.`,
      okText: "Delete",
    });
    if(!isConfirmed) return
    if(!isNew){
      let response = await deleteColor({id: editDataRef.current.id})
      if(response.success){
         router.replace(withTenantPath(COLOR_URL));
      }
    }
  };



  React.useEffect(() => {
    if(isNew) return;
    const fetchColor = async () => {
      try {
        setApiState("loading");
        const data = await getColorBySlug({slug: params.slug});
        editDataRef.current = data?.data || {};
        setTitle(editDataRef.current.title);
        setCode(editDataRef.current.code);
        setStatus(editDataRef.current.status);
      } catch (err) {
        console.error(err);
      } finally {
        setApiState(null);
      }
    };

    fetchColor();
    }, []);
  

  return (
    <>
      {apiState && <LoaderOverlay message={loaderMessage} />}
      <section className="page-section">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <AdminOverview
            eyebrow="Catalog Admin"
            title={isNew ? "Create a new color." : "Edit color details."}
            description="Define display names, swatches, and active status for color options used across the product catalog."
          />
          <div className="form-card max-w-[620px] w-full mx-auto">

            <div className="text-center mb-8">
              <h2 className="font-semibold text-xl sm:text-2xl text-dark">
                {isNew ? "Create Color" : "Color Details"} 
              </h2>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Color Name */}
              <div className="admin-form-section mb-6">
                <label className="form-label">Color</label>
                <input
                  type="text"
                  placeholder="Enter Color"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="form-input"
                />
              </div>

              <div className="admin-form-section mb-6">
                <label className="form-label">Code</label>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <input
                    type="color"
                    placeholder="Enter Code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-white p-2 sm:w-24"
                  />
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <div key={code} className="h-8 w-8 rounded-xl border border-slate-200" style={{backgroundColor: code}} />
                    <span className="text-sm font-medium text-slate-600">{code}</span>
                  </div>
                </div>
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
                Save Color
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

export default ColorForm;

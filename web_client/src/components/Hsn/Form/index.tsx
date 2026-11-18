"use client";

import AdminOverview from "@/components/Common/AdminOverview";
import LoaderOverlay from "@/components/Common/LoaderOverlay";
import { createHsn, deleteHsn, getHsnByCode, updateHsn } from "@/http/apiCalls";
import { STATUS_TYPES } from "@/utils/constants";
import { HSN_URL } from "@/utils/appUrls";
import React from "react";
import { useRouter } from "next/navigation";
import { confirmAction } from "@/utils/notify";
import { withTenantPath } from "@/lib/tenantUrl";

const HsnForm = ({ params }) => {
  const router = useRouter();
  const [code, setCode] = React.useState("");
  const [tax, setTax] = React.useState("");
  const [status, setStatus] = React.useState(STATUS_TYPES.ACTIVE);
  const [apiState, setApiState] = React.useState<"loading" | "creating" | "updating" | null>(null);
  const editDataRef = React.useRef({ code: '', status: STATUS_TYPES.ACTIVE, id: '', tax: ''});

  const loaderTextMap = {
    loading: "Loading HSN details...",
    creating: "Creating HSN...",
    updating: "Updating HSN...",
  } as const;
  const loaderMessage = apiState ? loaderTextMap[apiState] : "";

  let isNew = params.slug === 'new';


  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiState(isNew ? "creating" : "updating");
    try {
      const response:any = isNew
        ? await createHsn({ code, status, tax })
        : await updateHsn({ code, status, id: editDataRef.current.id, tax });

      if(response.success){
         router.replace(withTenantPath(HSN_URL));
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
      title: "Delete HSN?",
      content: `This will delete HSN "${code}".`,
      okText: "Delete",
    });
    if(!isConfirmed) return;
    if(!isNew){
      let response = await deleteHsn({id: editDataRef.current.id})
      if(response.success){
         router.replace(withTenantPath(HSN_URL));
      }
    }
  };



  React.useEffect(() => {
    if(isNew) return;
    const fetchHsn = async () => {
      try {
        setApiState("loading");
        const data = await getHsnByCode({code: params.slug});
        editDataRef.current = data?.data || {};
        setCode(editDataRef.current.code);
        setTax(editDataRef.current.tax);
        setStatus(editDataRef.current.status);
      } catch (err) {
        console.error(err);
      } finally {
        setApiState(null);
      }
    };

    fetchHsn();
    }, []);
  

  return (
    <>
      {apiState && <LoaderOverlay message={loaderMessage} />}
      <section className="page-section">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <AdminOverview
            eyebrow="Tax Admin"
            title={isNew ? "Create a new HSN record." : "Edit HSN details."}
            description="Manage HSN code metadata and tax rates used during catalog setup and order calculation."
          />
          <div className="form-card max-w-[620px] w-full mx-auto">

            <div className="text-center mb-8">
              <h2 className="font-semibold text-xl sm:text-2xl text-dark">
                {isNew ? "Create Hsn" : "Hsn Details"} 
              </h2>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Hsn Name */}
              <div className="admin-form-section mb-6">
                <label className="form-label">Hsn Code</label>
                <input
                  type="text"
                  placeholder="Enter Hsn"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="form-input"
                />
              </div>

              <div className="admin-form-section mb-6">
                <label className="form-label">Tax</label>
                <input
                  type="number"
                  placeholder="Enter Tax"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
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
                Save Hsn
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

export default HsnForm;

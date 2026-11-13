import React from "react";
import { ORDER_STATUS_COLOR } from "@/utils/constants";
import { dateFormatter } from "@/utils/helper";

const OrderStatusTimeline = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-slate-400">
        No timeline events recorded yet.
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-bold text-slate-900 mb-5">
        Activity Timeline ({history.length})
      </h3>

      <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
        {history.map((item, idx) => {
          return (
            <div key={item.id || idx} className="relative pl-6">
              {/* Timeline Indicator Dot */}
              <div
                className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-white shadow-xs"
                style={ORDER_STATUS_COLOR[item.status] || { backgroundColor: "#0284c7" }}
              />

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className="inline-flex rounded-md px-2 py-0.5 text-xs font-bold capitalize"
                    style={ORDER_STATUS_COLOR[item.status]}
                  >
                    {item.status?.replaceAll("_", " ")}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {dateFormatter(item.createdAt)}
                  </span>
                </div>

                {item?.meta?.comments && (
                  <p className="mt-1.5 text-xs text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-100">
                    <strong className="text-slate-800 font-semibold">Note:</strong> {item.meta.comments}
                  </p>
                )}

                {item?.user?.name && (
                  <p className="mt-1 text-[11px] text-slate-400">
                    Updated by {item.user.name}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderStatusTimeline;

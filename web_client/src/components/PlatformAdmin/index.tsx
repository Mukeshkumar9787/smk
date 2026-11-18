"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  createPlatformStore,
  getPlatformOverview,
  updatePlatformStoreStatus,
} from "@/http/apiCalls";
import { notifyError, notifySuccess } from "@/utils/notify";
import { getCurrencyDetails } from "@/utils/helper";

export default function PlatformAdmin() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newStore, setNewStore] = useState({
    storeName: "",
    slug: "",
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
    planCode: "STARTER",
    primaryColor: "#3C50E0",
  });

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getPlatformOverview();
      if (!res?.success) {
        setError(res?.message || "Super Admin access required.");
        return;
      }
      setData(res.data);
    } catch (err) {
      setError("Super Admin access required.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const handleToggleStatus = async (tenant: any) => {
    const nextStatus = tenant.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await updatePlatformStoreStatus(tenant.id, nextStatus);
      if (!res?.success) {
        notifyError(res?.message || "Failed to update store status");
        return;
      }
      notifySuccess(`Store "${tenant.name}" is now ${nextStatus}.`);
      await loadOverview();
    } catch {
      notifyError("Failed to update store status");
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const res = await createPlatformStore(newStore);
      if (!res?.success) {
        notifyError(res?.message || "Failed to create store");
        return;
      }
      notifySuccess(`Created store "${res.data.tenant.name}" (/s/${res.data.tenant.slug})`);
      setShowCreate(false);
      setNewStore({
        storeName: "",
        slug: "",
        ownerName: "",
        ownerEmail: "",
        ownerPassword: "",
        planCode: "STARTER",
        primaryColor: "#3C50E0",
      });
      await loadOverview();
    } catch {
      notifyError("Failed to create store");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <section className="page-section">
        <div className="mx-auto max-w-[1170px] px-4 py-12 text-center text-sm text-dark-4">
          Loading Platform Super Admin console...
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="page-section">
        <div className="mx-auto max-w-[700px] rounded-3xl border border-red-light-4 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-dark">Super Admin Access Required</h1>
          <p className="mt-2 text-sm text-dark-4">
            {error || "This console is restricted to platform Super Admin accounts."}
          </p>
        </div>
      </section>
    );
  }

  const { metrics, tenants } = data;
  const currency = getCurrencyDetails().currencySymbol;

  return (
    <section className="page-section">
      <div className="mx-auto max-w-[1170px] space-y-6 px-4 sm:px-8 xl:px-0">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue">
              Platform Super Admin
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-dark sm:text-3xl">
              Multi-Tenant Store Governance
            </h1>
            <p className="mt-1 text-sm text-dark-4">
              Manage every tenant store, plan allocation, status, and platform-wide metrics.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate((prev) => !prev)}
            className="inline-flex min-h-[44px] items-center rounded-2xl bg-blue px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-dark"
          >
            {showCreate ? "Close Form" : "+ Provision New Store"}
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {[
            { label: "Total Stores", value: metrics.totalTenants },
            { label: "Active Stores", value: metrics.activeTenants },
            { label: "Total Products", value: metrics.totalProducts },
            { label: "Total Orders", value: metrics.totalOrders },
            {
              label: "Platform GMV",
              value: `${currency}${Number(metrics.totalPlatformGmv || 0).toLocaleString("en-IN")}`,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-medium text-slate-500">{stat.label}</p>
              <p className="mt-1.5 text-2xl font-bold text-dark">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Create Store Drawer */}
        {showCreate && (
          <form
            onSubmit={handleCreateTenant}
            className="rounded-[28px] border border-blue/20 bg-white p-6 shadow-md space-y-4"
          >
            <h2 className="text-lg font-semibold text-dark">Provision New Tenant Store</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <input
                type="text"
                required
                placeholder="Store Name"
                value={newStore.storeName}
                onChange={(e) => setNewStore((s) => ({ ...s, storeName: e.target.value }))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
              />
              <input
                type="text"
                placeholder="Slug (auto if blank)"
                value={newStore.slug}
                onChange={(e) => setNewStore((s) => ({ ...s, slug: e.target.value }))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
              />
              <select
                value={newStore.planCode}
                onChange={(e) => setNewStore((s) => ({ ...s, planCode: e.target.value }))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
              >
                <option value="STARTER">Starter</option>
                <option value="GROWTH">Growth</option>
                <option value="PRO">Pro AI</option>
              </select>
              <input
                type="text"
                required
                placeholder="Owner Name"
                value={newStore.ownerName}
                onChange={(e) => setNewStore((s) => ({ ...s, ownerName: e.target.value }))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
              />
              <input
                type="email"
                required
                placeholder="Owner Email"
                value={newStore.ownerEmail}
                onChange={(e) => setNewStore((s) => ({ ...s, ownerEmail: e.target.value }))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
              />
              <input
                type="password"
                placeholder="Password (min 8 chars if new user)"
                value={newStore.ownerPassword}
                onChange={(e) => setNewStore((s) => ({ ...s, ownerPassword: e.target.value }))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={creating}
                className="rounded-xl bg-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-dark disabled:opacity-60"
              >
                {creating ? "Creating..." : "Create Tenant Store"}
              </button>
            </div>
          </form>
        )}

        {/* Tenants Table */}
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Store</th>
                  <th className="px-5 py-3.5">Owner</th>
                  <th className="px-5 py-3.5">Plan</th>
                  <th className="px-5 py-3.5">Catalog / Orders</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-8 w-8 flex-shrink-0 rounded-lg border border-black/10"
                          style={{ backgroundColor: t.primaryColor }}
                        />
                        <div>
                          <p className="font-semibold text-dark">
                            {t.name}{" "}
                            {t.isDefault && (
                              <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                                PRIMARY
                              </span>
                            )}
                          </p>
                          <p className="font-mono text-xs text-slate-500">/s/{t.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">
                      <p className="font-medium text-dark">{t.owner?.name || "—"}</p>
                      <p>{t.owner?.email || "—"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {t.planName}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">
                      {t.counts?.products ?? 0} products · {t.counts?.orders ?? 0} orders
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          t.status === "ACTIVE"
                            ? "bg-green-light-6 text-green-dark"
                            : "bg-red-light-6 text-red-dark"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <a
                          href={t.isDefault ? "/?tenant=smk" : `/s/${t.slug}`}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-dark hover:border-blue hover:text-blue"
                        >
                          Open Store
                        </a>
                        {!t.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(t)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            {t.status === "ACTIVE" ? "Suspend" : "Activate"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

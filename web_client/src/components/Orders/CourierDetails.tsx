import { Input } from 'antd'
import React from 'react'

const CourierDetails = ({ couriers, handleChange, additionalInfo, isAdmin, onSubmit }) => {
    const safeCouriers = Array.isArray(couriers) ? couriers : [];
    const link = safeCouriers.find(courier => courier?.name === additionalInfo?.courier)?.link || '#';
    return (
        <div className="font-medium text-dark">
            {isAdmin ?
                <>
                    <h3 className="mb-3 text-base font-semibold text-dark">Courier Details</h3>
                    <select
                        name="courier"
                        value={additionalInfo?.courier || ''}
                        onChange={handleChange}
                        className="form-input w-full bg-white text-dark"
                    >
                        <option value="">Select Courier</option>
                        {safeCouriers.map(courier => (
                            <option key={courier.name} value={courier.name}>{courier.name}</option>
                        ))}
                    </select>
                    <Input className="mt-3" type="text" placeholder="Enter tracking ID" name="trackingId"
                        onChange={handleChange}
                        value={additionalInfo?.trackingId || ''}
                    />
                    <div className='flex items-center justify-end'>
                        <button type='button' onClick={onSubmit} className="btn-primary mt-3 px-5">Save Courier</button>
                    </div>
                </>
                :
                <>
                    {additionalInfo?.courier
                        &&
                        <div className="rounded-[24px] border border-sky-100 bg-[linear-gradient(180deg,#f8fbff_0%,#eef6ff_100%)] p-5 shadow-[0_14px_35px_rgba(59,130,246,0.08)]">
                            <div className="space-y-3">
                                {additionalInfo?.trackingId && (
                                    <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm shadow-sm">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                    Tracking ID
                                                </p>
                                                <p className="mt-1 break-all font-semibold text-slate-900">
                                                    {additionalInfo?.trackingId}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => window.open(link, "_blank", "noopener,noreferrer")}
                                                className="inline-flex items-center justify-center rounded-full border border-slate-900 bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                                            >
                                                Track Courier
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm shadow-sm">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Courier
                                    </p>
                                    <p className="mt-1 font-semibold text-slate-900">
                                        {additionalInfo?.courier}
                                    </p>
                                </div>
                            </div>
                        </div>
                        }
                </>
            }
        </div>
    )
}

export default CourierDetails

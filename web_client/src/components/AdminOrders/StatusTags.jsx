import React from 'react'
import { getOrderStats } from '@/http/apiCalls';
import { ORDER_STATUS, ORDER_STATUS_COLOR } from "../../utils/constants.js"

const StatusTags = ({ status, setStatus }) => {
    const [statusStats, setStatusStats] = React.useState({});

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await getOrderStats();
                if (response?.success) {
                    setStatusStats(response?.data?.orderStatus || {});
                }
            } catch (error) {}
        };

        fetchStats();
    }, []);

    return (
        <div className="flex gap-2 text-xs flex-wrap items-center">
            <div key="all">
                <button
                    type="button"
                    className="px-4 py-2 rounded-full bg-white transition hover:shadow-xs cursor-pointer"
                    onClick={() => setStatus('')}
                    style={{ border: status === '' ? '1px solid black' : '1px solid #e2e8f0' }}
                >
                    <div className="text-center font-medium">All ({Number(statusStats.ALL || 0)})</div>
                </button>
            </div>
            {Object.values(ORDER_STATUS).map((orderStatus) => (
                <div key={orderStatus}>
                    <button
                        type="button"
                        className="px-4 py-2 rounded-full transition hover:opacity-90 cursor-pointer"
                        style={{
                            ...ORDER_STATUS_COLOR[orderStatus],
                            border: (orderStatus === status) ? '1px solid black' : '1px solid transparent'
                        }}
                        onClick={() => setStatus(orderStatus)}
                    >
                        <div className="font-medium capitalize">{orderStatus.replaceAll('_', ' ')} ({Number(statusStats[orderStatus] || 0)})</div>
                    </button>
                </div>
            ))}
        </div>
    )
}

export default StatusTags

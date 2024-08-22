import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { TradeActivity } from '@memeclashtv/types/activity';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export const Chart = ({ tradeActivities }: { tradeActivities: TradeActivity[] }) => {
    // Process data to extract timestamps and prices
    const chartData = useMemo(() => {
        const labels = tradeActivities.map(activity =>
            new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );

        const prices = tradeActivities.map(activity => activity.newPrice);

        return {
            labels,
            datasets: [
                {
                    label: 'Price',
                    data: prices,
                    borderColor: 'rgba(0, 123, 255, 1)',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    fill: true,
                    tension: 0.3,
                },
            ],
        };
    }, [tradeActivities]);

    const options = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                grid: {
                    display: false,
                },
            },
            y: {
                ticks: {
                    callback: function (value) {
                        return `$${value.toFixed(2)}`;
                    },
                },
            },
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: (context) => `$${context.parsed.y.toFixed(2)}`,
                },
            },
        },
    }), []);

    return (
        <div style={{ height: '300px' }} aria-label="Price chart over time">
            <Line data={chartData} options={options} />
        </div>
    );
};
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
    TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';  // Ensure this is imported

import { TradeActivity, MatchEndActivity } from '@memeclashtv/types/activity';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    TimeScale
);

interface ChartProps {
    activities: (TradeActivity | MatchEndActivity)[];
    characterId: number;
}

export const Chart: React.FC<ChartProps> = ({ activities, characterId }) => {
    const chartData = useMemo(() => {
        const labels = activities.map(activity =>
            new Date(activity.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );

        const prices = activities.map(activity => {
            if ('newPrice' in activity) { 
               return activity.newPrice; // For TradeActivity
            } else {
                // Determine if characterId is p1 or p2
                const isPlayer1 = activity.p1 === characterId;
                const playerIndex = isPlayer1 ? '1' : '2';
                return activity.tokenState[`newPrice${playerIndex}`]; // For MatchEndActivity
            }
            return 0; // Fallback in case of unexpected activity type
        });

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
    }, [activities, characterId]);

    const options = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        options: {
            //spanGaps: 10,
        },
        scales: {
            x: {
                //type:'time',
                time: {
                    unit: 'minute', // Adjust the unit as needed
                    tooltipFormat: 'll HH:mm', // Format for tooltips
                },
                ticks: {
                    autoSkip: true, // Prevent Chart.js from skipping ticks
                    maxTicksLimit: 1000, // Limit to a reasonable number of ticks
                },
                grid: {
                    display: false,
                },
            },
            y: {
                ticks: {
                    callback: function (value) {
                        return `$${value.toFixed(10)}`;
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
                    label: (context) => `$${context.parsed.y.toFixed(10)}`,
                },
            },
        },
    }), [])

    return (
        <div style={{ height: '300px' }} aria-label="Price chart over time">
            <Line data={chartData} options={options} />
        </div>
    );
};
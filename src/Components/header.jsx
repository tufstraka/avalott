import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';
import './css/Purchase.css'; // Assuming you have relevant styles in Purchase.css

// Register required Chart.js components
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const Graph = ({ data }) => {
  if (!data || !data.labels || !data.values) {
    return <p>Graph data unavailable</p>;
  }

  const chartData = {
    labels: data.labels, // Token names
    datasets: [
      {
        label: 'Tickets Purchased',
        data: data.values, // Number of tickets
        borderColor: '#00bfff', // Line color
        backgroundColor: '#00bfff', // Point color
        pointBorderColor: '#ffffff', // Point border
        pointBackgroundColor: '#00bfff', // Point fill
        fill: false, // No fill below the line
        tension: 0.4, // Smooth curve
        pointRadius: 5, // Point size
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#f5f5f5', // Matches dark theme
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: '#1e1e1e', // Dark theme for tooltip
        titleColor: '#f5f5f5',
        bodyColor: '#f5f5f5',
        borderColor: '#00bfff',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Tokens',
          color: '#f5f5f5',
        },
        ticks: {
          color: '#f5f5f5',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Tickets Purchased',
          color: '#f5f5f5',
        },
        ticks: {
          color: '#f5f5f5',
          stepSize: 1, // Ensure consistent steps even for small data
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        beginAtZero: true,
        suggestedMax: Math.max(...data.values, 5), // Dynamically adjust max
      },
    },
  };

  return (
    <div className="graph-wrapper">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default Graph;

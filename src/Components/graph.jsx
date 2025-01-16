import React, { useEffect, useState } from 'react';
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
import './css/graph.css';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const Graph = ({ data }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Handle resize events
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!data || !data.labels || !data.values) {
    return (
      <div className="graph-wrapper">
        <p className="no-data">Graph data unavailable</p>
      </div>
    );
  }

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Tickets Purchased',
        data: data.values,
        borderColor: '#FFD700',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        pointBorderColor: '#FFA500',
        pointBackgroundColor: '#FFD700',
        fill: true,
        tension: 0.4,
        pointRadius: isMobile ? 3 : 5,
        borderWidth: isMobile ? 2 : 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: !isMobile,
        position: 'top',
        labels: {
          color: '#B8B8B8',
          font: {
            size: isMobile ? 10 : 12,
          },
          padding: isMobile ? 10 : 20,
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(26, 26, 46, 0.95)',
        titleColor: '#FFD700',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 215, 0, 0.3)',
        borderWidth: 1,
        padding: isMobile ? 8 : 12,
        titleFont: {
          size: isMobile ? 12 : 14,
        },
        bodyFont: {
          size: isMobile ? 11 : 13,
        },
        displayColors: false,
        callbacks: {
          label: (context) => `Tickets: ${context.parsed.y}`,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: !isMobile,
          text: 'Tokens',
          color: '#B8B8B8',
          font: {
            size: isMobile ? 10 : 12,
          },
        },
        ticks: {
          color: '#B8B8B8',
          font: {
            size: isMobile ? 10 : 12,
          },
          maxRotation: isMobile ? 45 : 0,
          minRotation: isMobile ? 45 : 0,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          display: !isMobile,
        },
      },
      y: {
        title: {
          display: !isMobile,
          text: 'Tickets Purchased',
          color: '#B8B8B8',
          font: {
            size: isMobile ? 10 : 12,
          },
        },
        ticks: {
          color: '#B8B8B8',
          font: {
            size: isMobile ? 10 : 12,
          },
          stepSize: 1,
          callback: (value) => (isMobile ? value.toString() : `${value} tickets`),
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          display: !isMobile,
        },
        beginAtZero: true,
        suggestedMax: Math.max(...data.values, 5),
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  return (
    <div className="graph-wrapper">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default Graph;
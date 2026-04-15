import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip, Legend, PointElement, LineElement
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { useTheme } from '../../context/ThemeContext'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, PointElement, LineElement)

const CAT_COLORS = {
  food: '#f59e0b', transport: '#3b82f6', accommodation: '#8b5cf6',
  entertainment: '#ec4899', shopping: '#f97316', utilities: '#06b6d4',
  health: '#10b981', other: '#6b7280',
}

export function MonthlyBarChart({ data }) {
  const { dark } = useTheme()
  const textColor = dark ? '#8ab89d' : '#4a6358'
  const gridColor = dark ? '#1f3328' : '#d9e8e0'

  const chartData = {
    labels: data.map(d => d.month),
    datasets: [{
      label: 'Total Expenses',
      data: data.map(d => d.amount),
      backgroundColor: '#34986a',
      borderRadius: 8,
      borderSkipped: false,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `₹${ctx.raw.toLocaleString('en-IN')}`,
        },
        backgroundColor: dark ? '#132010' : '#fff',
        titleColor: dark ? '#e8f5ee' : '#0f1f17',
        bodyColor: dark ? '#8ab89d' : '#4a6358',
        borderColor: dark ? '#1f3328' : '#d9e8e0',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: textColor, font: { family: 'Outfit' } },
        grid: { display: false },
        border: { color: gridColor },
      },
      y: {
        ticks: {
          color: textColor,
          font: { family: 'Outfit' },
          callback: (v) => `₹${v.toLocaleString('en-IN')}`,
        },
        grid: { color: gridColor },
        border: { dash: [4, 4], color: 'transparent' },
      },
    },
  }

  return (
    <div className="h-48">
      <Bar data={chartData} options={options} />
    </div>
  )
}

export function CategoryDoughnut({ data }) {
  const { dark } = useTheme()

  const filtered = data.filter(d => d.amount > 0)
  if (filtered.length === 0) return (
    <div className="h-48 flex items-center justify-center text-[var(--text-secondary)] text-sm">No data yet</div>
  )

  const chartData = {
    labels: filtered.map(d => d.category.charAt(0).toUpperCase() + d.category.slice(1)),
    datasets: [{
      data: filtered.map(d => d.amount),
      backgroundColor: filtered.map(d => CAT_COLORS[d.category] || '#6b7280'),
      borderWidth: 0,
      hoverOffset: 6,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: dark ? '#8ab89d' : '#4a6358',
          font: { family: 'Outfit', size: 12 },
          boxWidth: 12,
          boxHeight: 12,
          borderRadius: 4,
          padding: 10,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ₹${ctx.raw.toLocaleString('en-IN')}`,
        },
        backgroundColor: dark ? '#132010' : '#fff',
        titleColor: dark ? '#e8f5ee' : '#0f1f17',
        bodyColor: dark ? '#8ab89d' : '#4a6358',
        borderColor: dark ? '#1f3328' : '#d9e8e0',
        borderWidth: 1,
      },
    },
  }

  return (
    <div className="h-48">
      <Doughnut data={chartData} options={options} />
    </div>
  )
}

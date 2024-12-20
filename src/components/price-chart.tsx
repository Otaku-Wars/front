import { useEffect, useRef } from 'react'
import { createChart } from 'lightweight-charts'

export function PriceChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#999',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.1)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.1)' },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
      },
      crosshair: {
        horzLine: {
          visible: false,
          labelVisible: false
        },
        vertLine: {
          visible: false,
          labelVisible: false,
        }
      },
    })

    const areaSeries = chart.addAreaSeries({
      lineColor: '#22c55e',
      topColor: 'rgba(34, 197, 94, 0.4)',
      bottomColor: 'rgba(34, 197, 94, 0.0)',
      lineWidth: 2,
    })

    // Sample data
    const data = Array.from({ length: 100 }, (_, i) => ({
      time: new Date(Date.now() - (100 - i) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      value: Math.random() * 3 + 1
    }))

    areaSeries.setData(data)
    chart.timeScale().fitContent()

    const handleResize = () => {
      chart.applyOptions({
        width: chartContainerRef.current?.clientWidth ?? 400,
      })
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [])

  return <div ref={chartContainerRef} className="w-full h-full" />
}


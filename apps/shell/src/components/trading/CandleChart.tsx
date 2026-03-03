'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useCandles, useRealtimeTick } from '@/lib/hooks';

interface Props {
  symbol: string;
  timeframe?: string;
  className?: string;
}

export function CandleChart({ symbol, timeframe = '1H', className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);

  const { data: candles = [] } = useCandles(symbol, timeframe, 200);
  const tick = useRealtimeTick(symbol);

  // Sorted candle data for lightweight-charts
  const chartData = useMemo(
    () =>
      candles
        .map((c) => ({
          time: (typeof c.time === 'number' ? c.time : Math.floor(new Date(c.time).getTime() / 1000)) as import('lightweight-charts').UTCTimestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))
        .sort((a, b) => (a.time as number) - (b.time as number)),
    [candles],
  );

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return;

    let mounted = true;

    import('lightweight-charts').then(({ createChart, ColorType, CandlestickSeries }) => {
      if (!mounted || !containerRef.current) return;

      // Clean up previous chart
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }

      const chart = createChart(containerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#9ca3af',
          fontSize: 11,
        },
        grid: {
          vertLines: { color: 'rgba(55, 65, 81, 0.3)' },
          horzLines: { color: 'rgba(55, 65, 81, 0.3)' },
        },
        crosshair: {
          vertLine: { color: 'rgba(34, 197, 94, 0.3)', labelBackgroundColor: '#22c55e' },
          horzLine: { color: 'rgba(34, 197, 94, 0.3)', labelBackgroundColor: '#22c55e' },
        },
        rightPriceScale: {
          borderColor: 'rgba(55, 65, 81, 0.5)',
        },
        timeScale: {
          borderColor: 'rgba(55, 65, 81, 0.5)',
          timeVisible: true,
          secondsVisible: false,
        },
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });

      const series = chart.addSeries(CandlestickSeries, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderUpColor: '#22c55e',
        borderDownColor: '#ef4444',
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
      });

      chartRef.current = chart;
      seriesRef.current = series;

      if (chartData.length) {
        series.setData(chartData);
        chart.timeScale().fitContent();
      }

      // Resize observer
      const ro = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect;
        chart.applyOptions({ width, height });
      });
      ro.observe(containerRef.current);

      return () => {
        ro.disconnect();
      };
    });

    return () => {
      mounted = false;
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, [symbol, timeframe]); // re-create on symbol/tf change

  // Update data
  useEffect(() => {
    if (seriesRef.current && chartData.length) {
      seriesRef.current.setData(chartData);
    }
  }, [chartData]);

  // Update last candle with live tick
  useEffect(() => {
    if (!seriesRef.current || !tick || !chartData.length) return;
    const last = chartData[chartData.length - 1];
    seriesRef.current.update({
      ...last,
      close: tick.mid ?? tick.bid,
      high: Math.max(last.high, tick.mid ?? tick.bid),
      low: Math.min(last.low, tick.mid ?? tick.bid),
    });
  }, [tick, chartData]);

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="w-full h-full min-h-[300px]" />
      {!candles.length && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
          {symbol ? 'Loading chart…' : 'Select a symbol'}
        </div>
      )}
    </div>
  );
}

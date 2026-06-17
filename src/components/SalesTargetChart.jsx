import React, { useEffect, useRef, useMemo } from 'react';
import Chart from 'chart.js/auto';

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const formatCurrencyFull = (val) => {
  if (val == null) return 'Q0';
  return 'Q' + Math.round(val).toLocaleString('es-GT');
};

const formatCurrencyK = (val) => {
  if (val === 0) return 'Q0';
  if (val < 1000) return 'Q' + Math.round(val);
  return 'Q' + (val / 1000).toFixed(0) + 'k';
};

export default function SalesTargetChart({ data, onOpenEditor, activeStore }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const { ventaValues, metaValues } = useMemo(() => {
    const sums = data.map(monthData => {
      const filteredMonthData = activeStore === 'Todos'
        ? monthData
        : monthData.filter(curr => curr.store === activeStore);

      return filteredMonthData.reduce((acc, curr) => {
        return {
          venta: acc.venta + curr.venta,
          meta: acc.meta + curr.meta
        };
      }, { venta: 0, meta: 0 });
    });

    // Find the last month index that has real sales data (venta > 0)
    let lastActiveIdx = -1;
    for (let i = sums.length - 1; i >= 0; i--) {
      if (sums[i].venta > 0) {
        lastActiveIdx = i;
        break;
      }
    }

    const ventaValues = sums.map((m, idx) => (idx <= lastActiveIdx ? m.venta : null));
    const metaValues = sums.map(m => m.meta);

    return { ventaValues, metaValues };
  }, [data, activeStore]);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');

    // Create gradient fill for Venta
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.28)'); // var(--accent-purple)
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.01)');

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: MONTH_LABELS,
        datasets: [
          {
            label: 'Venta',
            data: ventaValues,
            borderColor: '#8B5CF6', // var(--accent-purple)
            borderWidth: 3,
            backgroundColor: gradient,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#8B5CF6',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 8
          },
          {
            label: 'Meta',
            data: metaValues,
            borderColor: '#10B981', // var(--accent-green)
            borderWidth: 2.5,
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
            pointBackgroundColor: '#10B981',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              font: { family: 'Inter', size: 12, weight: '500' },
              color: '#475569',
              padding: 20
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrencyFull(ctx.raw)}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748B', font: { family: 'Inter', size: 11, weight: '600' } }
          },
          y: {
            grid: { color: '#F1F5F9' },
            min: 0,
            ticks: {
              color: '#64748B',
              font: { family: 'Inter', size: 11 },
              callback: v => formatCurrencyK(v)
            }
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [ventaValues, metaValues]);

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div className="card-header">
        <div>
          <div className="card-title" style={{ fontSize: '15px' }}>
            <span className="card-title-dot" style={{ background: '#8B5CF6' }}></span>
            Venta y Meta Año 2026
          </div>
          <div className="card-subtitle">Comparativa anual acumulada por tiendas</div>
        </div>
        <button
          className="card-menu-btn"
          onClick={onOpenEditor}
          title="Editar Metas y Ventas"
          style={{ fontSize: '18px', padding: '6px 10px' }}
        >
          <i className="fas fa-ellipsis-h"></i>
        </button>
      </div>
      <div className="chart-wrap" style={{ padding: '10px 20px 20px' }}>
        <div style={{ height: '320px' }}>
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}

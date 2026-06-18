import { useEffect, useRef, useMemo } from 'react';
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

export default function SalesTargetChart({
  data,
  onOpenEditor,
  activeStore,
  selectedStores = [],
  selectedMonths = [],
  userRole
}) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const { ventaValues, metaValues } = useMemo(() => {
    const monthsFullNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const isAdmin = userRole === 'admin';

    const sums = data.map(monthData => {
      let filteredMonthData = monthData;

      // Filter by stores:
      if (isAdmin) {
        if (selectedStores && selectedStores.length > 0) {
          filteredMonthData = filteredMonthData.filter(curr => selectedStores.includes(curr.store));
        }
      } else {
        const storeCode = activeStore === 'Todos' ? 'CB' : activeStore;
        filteredMonthData = filteredMonthData.filter(curr => curr.store === storeCode);
      }

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

    const hasMonthFilter = selectedMonths && selectedMonths.length > 0;

    const ventaValues = sums.map((m, idx) => {
      const monthName = monthsFullNames[idx];
      const isMonthAllowed = !hasMonthFilter || selectedMonths.includes(monthName);
      return (idx <= lastActiveIdx && isMonthAllowed) ? m.venta : null;
    });

    const metaValues = sums.map((m, idx) => {
      const monthName = monthsFullNames[idx];
      const isMonthAllowed = !hasMonthFilter || selectedMonths.includes(monthName);
      return isMonthAllowed ? m.meta : null;
    });

    return { ventaValues, metaValues };
  }, [data, activeStore, selectedStores, selectedMonths, userRole]);

  const isSingleMonth = selectedMonths && selectedMonths.length === 1;

  const chartData = useMemo(() => {
    if (isSingleMonth) {
      const monthsFullNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      const selectedMonthName = selectedMonths[0];
      const monthIdx = monthsFullNames.indexOf(selectedMonthName);
      const shortLabel = MONTH_LABELS[monthIdx] || selectedMonthName.slice(0, 3);

      const isAdmin = userRole === 'admin';
      const monthData = data[monthIdx] || [];
      let filteredMonthData = monthData;

      if (isAdmin) {
        if (selectedStores && selectedStores.length > 0) {
          filteredMonthData = filteredMonthData.filter(curr => selectedStores.includes(curr.store));
        }
      } else {
        const storeCode = activeStore === 'Todos' ? 'CB' : activeStore;
        filteredMonthData = filteredMonthData.filter(curr => curr.store === storeCode);
      }

      const totals = filteredMonthData.reduce((acc, curr) => {
        return {
          venta: acc.venta + curr.venta,
          meta: acc.meta + curr.meta
        };
      }, { venta: 0, meta: 0 });

      // Check if this month is active (<= last month with actual sales in the whole dataset)
      const allSums = data.map(mD => {
        let fD = mD;
        if (isAdmin) {
          if (selectedStores && selectedStores.length > 0) {
            fD = fD.filter(curr => selectedStores.includes(curr.store));
          }
        } else {
          const storeCode = activeStore === 'Todos' ? 'CB' : activeStore;
          fD = fD.filter(curr => curr.store === storeCode);
        }
        return fD.reduce((acc, curr) => ({ venta: acc.venta + curr.venta, meta: acc.meta + curr.meta }), { venta: 0, meta: 0 });
      });

      let lastActiveIdx = -1;
      for (let i = allSums.length - 1; i >= 0; i--) {
        if (allSums[i].venta > 0) {
          lastActiveIdx = i;
          break;
        }
      }

      const ventaVal = (monthIdx <= lastActiveIdx) ? totals.venta : null;
      const metaVal = totals.meta;

      return {
        type: 'bar',
        labels: [shortLabel],
        venta: [ventaVal],
        meta: [metaVal]
      };
    } else {
      return {
        type: 'line',
        labels: MONTH_LABELS,
        venta: ventaValues,
        meta: metaValues
      };
    }
  }, [isSingleMonth, selectedMonths, data, userRole, selectedStores, activeStore, ventaValues, metaValues]);

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

    const isLine = chartData.type === 'line';

    chartInstanceRef.current = new Chart(ctx, {
      type: chartData.type,
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: 'Venta',
            data: chartData.venta,
            borderColor: '#8B5CF6', // var(--accent-purple)
            borderWidth: 3,
            backgroundColor: isLine ? gradient : 'rgba(139, 92, 246, 0.85)',
            fill: isLine,
            tension: 0.4,
            borderRadius: isLine ? 0 : 8,
            pointBackgroundColor: '#8B5CF6',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: isLine ? 5 : 0,
            pointHoverRadius: isLine ? 8 : 0
          },
          {
            label: 'Meta',
            data: chartData.meta,
            borderColor: '#10B981', // var(--accent-green)
            borderWidth: 2.5,
            backgroundColor: isLine ? 'transparent' : 'rgba(16, 185, 129, 0.85)',
            borderDash: isLine ? [5, 5] : [],
            fill: false,
            tension: 0.4,
            borderRadius: isLine ? 0 : 8,
            pointBackgroundColor: '#10B981',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: isLine ? 5 : 0,
            pointHoverRadius: isLine ? 8 : 0
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
  }, [chartData]);

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

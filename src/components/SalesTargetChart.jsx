import { useEffect, useRef, useMemo } from 'react';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(ChartDataLabels);

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
  
  selectedStores = [],
  selectedMonths = [],
  userRole,
  onChartClick
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
      if (selectedStores && selectedStores.length > 0 && selectedStores[0] !== 'Todos') {
        filteredMonthData = filteredMonthData.filter(curr => selectedStores.includes(curr.store));
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
  }, [data,  selectedStores, selectedMonths, userRole]);

  const isSingleMonth = selectedMonths && selectedMonths.length === 1;

  
  const chartData = useMemo(() => {
    const monthsFullNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const storesToDisplay = selectedStores && selectedStores.length > 0 ? selectedStores : ['CB'];
    
    const ventaValues = [];
    const metaValues = [];

    storesToDisplay.forEach(store => {
      let sumV = 0;
      let sumM = 0;

      data.forEach((monthArray, mIdx) => {
        const monthName = monthsFullNames[mIdx]; // Use full names to match selectedMonths
        
        // If there's a month filter active, skip months not selected
        if (selectedMonths && selectedMonths.length > 0 && !selectedMonths.includes(monthName)) {
          return;
        }

        // Find this store's data in the month
        const sData = monthArray.find(d => d.store === store);
        if (sData) {
          sumV += sData.venta;
          sumM += sData.meta;
        }
      });

      ventaValues.push(sumV);
      metaValues.push(sumM);
    });

    return {
      labels: storesToDisplay,
      venta: ventaValues,
      meta: metaValues
    };
  }, [selectedMonths, data, selectedStores]);


  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            type: 'bar',
            label: 'Venta Alcanzada',
            data: chartData.venta,
            backgroundColor: 'rgba(20, 58, 94, 0.85)', // #143a5e
            borderColor: '#143a5e',
            borderWidth: 1,
            borderRadius: 6,
            barPercentage: 0.5,
            datalabels: {
              labels: {
                pct: {
                  display: true,
                  anchor: 'end',
                  align: 'top',
                  offset: 4,
                  color: (ctx) => {
                    const meta = chartData.meta[ctx.dataIndex];
                    const v = ctx.dataset.data[ctx.dataIndex];
                    const pct = meta > 0 ? v / meta : 0;
                    return pct >= 0.8 ? '#10B981' : '#EF4444'; 
                  },
                  font: { family: 'Inter', weight: 'bold', size: 11 },
                  formatter: (val, ctx) => {
                    const meta = chartData.meta[ctx.dataIndex];
                    if (!meta || meta === 0) return '0%';
                    return Math.round((val / meta) * 100) + '%';
                  }
                },
                value: {
                  display: true,
                  anchor: 'start',
                  align: 'top',
                  offset: 6,
                  color: '#ffffff',
                  font: { family: 'Courier New, monospace', weight: 'bold', size: 10 },
                  formatter: (val) => formatCurrencyK(val)
                }
              }
            }
          },
          {
            type: 'line',
            label: 'Meta Comercial',
            data: chartData.meta,
            backgroundColor: 'transparent',
            borderColor: '#fea514',
            borderWidth: 2,
            borderDash: [5, 5],
            pointBackgroundColor: '#fff',
            pointBorderColor: '#fea514',
            pointBorderWidth: 2,
            pointRadius: 4,
            tension: 0.3,
            datalabels: {
              display: true,
              anchor: 'end',
              align: 'right',
              offset: 4,
              backgroundColor: '#fff',
              borderColor: '#fea514',
              borderWidth: 1,
              borderRadius: 4,
              padding: { top: 2, bottom: 2, left: 4, right: 4 },
              color: '#fea514',
              font: { family: 'Inter', weight: 'bold', size: 10 },
              formatter: (val) => formatCurrencyK(val)
            }
          }
        ]
      },
      options: {
        
        onClick: (event, elements) => {
          if (onChartClick) onChartClick();
        },
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
            Venta contra Meta "{selectedMonths && selectedMonths.length > 0 ? selectedMonths.join(', ') : 'Mes en Curso'}" 2026
          </div>
          <div className="card-subtitle">Comparativa acumulada por tiendas</div>
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

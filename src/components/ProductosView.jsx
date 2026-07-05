import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels
);

const centerTextPlugin = {
  id: 'centerText',
  beforeDraw(chart) {
    if (chart.config.type !== 'doughnut') return;
    const { ctx, data, chartArea } = chart;
    if (!chartArea) return;
    const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
    ctx.save();
    const text = total.toLocaleString();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 24px Inter';
    ctx.fillStyle = '#1e293b';
    const centerX = (chartArea.left + chartArea.right) / 2;
    const centerY = (chartArea.top + chartArea.bottom) / 2;
    ctx.fillText(text, centerX, centerY);
    ctx.restore();
  }
};
ChartJS.register(centerTextPlugin);

ChartJS.defaults.font.family = "'Inter', sans-serif";

// Custom Multi-Select Component
const MultiSelectDropdown = ({ options, selected, onChange, label, disabled = false, icon = 'fa-filter' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggle = (val) => {
    if (disabled) return;
    if (selected.includes(val)) {
      onChange(selected.filter(x => x !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  const toggleAll = () => {
    if (disabled) return;
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange([...options]);
    }
  };

  const isAllSelected = selected.length === options.length;

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={disabled ? 'disabled' : ''}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 16px', borderRadius: '24px',
            border: `1.5px solid ${isOpen ? '#fca5a5' : '#fee2e2'}`,
            background: isOpen ? '#fff5f5' : '#fff',
            color: '#1a1f36', fontWeight: 'bold', fontSize: '14px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          <i className={`fas ${icon}`} style={{ color: 'var(--accent-coral)' }}></i>
          {label} {isAllSelected ? '(Todos)' : (selected.length > 0 ? `(${selected.length})` : '')}
          <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`} style={{ color: '#9ca3af', marginLeft: '4px', fontSize: '12px' }}></i>
        </button>
      </div>
      
      
      {isOpen && !disabled && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, background: '#fff', border: '1px solid #ddd', borderRadius: '12px', zIndex: 100, padding: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)', width: '280px' }}>
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleAll(); }}
            style={{ 
              width: '100%', padding: '10px', marginBottom: '12px', 
              backgroundColor: 'var(--accent-coral)', color: '#fff', 
              border: 'none', borderRadius: '8px', 
              fontWeight: 'bold', fontSize: '14px', cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(255, 109, 77, 0.2)'
            }}
          >
            {isAllSelected ? 'Quitar todas' : (label === 'Años' || label === 'Meses' ? `Todos los ${label}` : `Todas las ${label}`)}
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {options.map(opt => {
              const isSelected = selected.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(opt); }}
                  style={{
                    padding: '10px 4px',
                    borderRadius: '8px',
                    border: `1px solid ${isSelected ? 'var(--accent-coral)' : '#e2e8f0'}`,
                    background: isSelected ? 'var(--accent-coral)' : '#f8fafc',
                    color: isSelected ? '#fff' : '#475569',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '13px',
                    transition: 'all 0.2s',
                    width: '100%'
                  }}
                  onMouseEnter={(e) => { if(!isSelected) { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; } }}
                  onMouseLeave={(e) => { if(!isSelected) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; } }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default function ProductosView({ data = [], userRole, allowedStores }) {
  const [expandedStores, setExpandedStores] = useState({});
  const [showTendencia, setShowTendencia] = useState(false);
  const toggleStore = (storeName) => {
    setExpandedStores(prev => ({ ...prev, [storeName]: !prev[storeName] }));
  };

  const storeMap = {
    'Trofex Cobán': 'CB', 'Cobán': 'CB', 'CB': 'CB',
    'Trofex Chimaltenango': 'CHM', 'Chimaltenango': 'CHM', 'CHM': 'CHM',
    'Trofex Chiquimula': 'CHQ', 'Chiquimula': 'CHQ', 'CHQ': 'CHQ',
    'Trofex Escuintla': 'ESC', 'Escuintla': 'ESC', 'ESC': 'ESC',
    'Trofex Huehuetenango': 'HH', 'Huehuetenango': 'HH', 'HH': 'HH',
    'Trofex Jutiapa': 'JT', 'Jutiapa': 'JT', 'JT': 'JT',
    'Trofex Mazate': 'MZ', 'Trofex Mazatenango': 'MZ', 'Mazatenango': 'MZ', 'Mazate': 'MZ', 'MZ': 'MZ',
    'Trofex Petén': 'PT', 'Petén': 'PT', 'Peten': 'PT', 'PT': 'PT',
    'Trofex Pto. Barrios': 'PTB', 'Trofex Puerto Barrios': 'PTB', 'Pto. Barrios': 'PTB', 'Puerto Barrios': 'PTB', 'PTB': 'PTB',
    'Trofex San Juan': 'SJ', 'San Juan': 'SJ', 'SJ': 'SJ',
    'Trofex San Marcos': 'SMA', 'San Marcos': 'SMA', 'SMA': 'SMA',
    'Trofex Villa Nueva': 'VN', 'Villa Nueva': 'VN', 'VN': 'VN',
    'Trofex Xela': 'XL', 'Xela': 'XL', 'XL': 'XL',
    'Trofex Zona 3': 'Z3', 'Zona 3': 'Z3', 'Z3': 'Z3',
    'Distribuidora': 'Distribuidores', 'Distribuidor': 'Distribuidores', 'Distribuidores': 'Distribuidores'
  };

  // Helper: lee cantidad sin importar el nombre exacto de la columna en Google Sheets
  const getQty = (d) => Number(
    d['Cantidades Vendidas'] || d['Unidades Vendidas'] || d['Cantidad Vendida'] ||
    d['Cantidad'] || d['Unidades'] || d['cantidad_vendida'] || d['unidades_vendidas'] || 0
  );

  const processedData = useMemo(() => data.map(d => ({ ...d, Tienda: storeMap[d.Tienda] || d.Tienda })), [data]);
  const processedAllowedStores = useMemo(() => (allowedStores || []).map(s => storeMap[s] || s), [allowedStores]);

  // Base lists for initial state
  const availableYears = useMemo(() => Array.from(new Set(processedData.map(d => String(d.Año)))).filter(Boolean).sort(), [processedData]);
  const availableMonths = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const availableCategories = useMemo(() => Array.from(new Set(processedData.map(d => d.Categoría))).filter(Boolean).sort(), [processedData]);
  const availableStores = useMemo(() => {
    if (userRole !== 'admin') return processedAllowedStores;
    const fromData = processedData.map(d => d.Tienda);
    const predefined = Array.from(new Set(Object.values(storeMap)));
    return Array.from(new Set([...predefined, ...fromData])).filter(Boolean).sort();
  }, [processedData, userRole, processedAllowedStores]);

  // States (arrays for multi-select)
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState(availableMonths);
  const [selectedStores, setSelectedStores] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Initialize selected values once data is loaded
  useEffect(() => {
    if (availableYears.length > 0 && selectedYears.length === 0) setSelectedYears(availableYears);
    if (availableCategories.length > 0 && selectedCategories.length === 0) setSelectedCategories(availableCategories);
    if (availableStores.length > 0 && selectedStores.length === 0) setSelectedStores(userRole === 'admin' ? availableStores : processedAllowedStores);
  }, [availableYears, availableCategories, availableStores, userRole, processedAllowedStores]);

  // Filtered data
  const filteredData = useMemo(() => {
    return processedData.filter(d => {
      const matchYear = selectedYears.length === 0 || selectedYears.includes(String(d.Año));
      const matchMonth = selectedMonths.length === 0 || selectedMonths.includes(d.Mes);
      // Si no hay columna Tienda en los datos, se omite el filtro
      const hasStoreData = d.Tienda && d.Tienda.trim() !== '';
      const matchStore = !hasStoreData || (userRole === 'admin' ? selectedStores.includes(d.Tienda) : processedAllowedStores.includes(d.Tienda));
      const matchCategory = selectedCategories.length === 0 || selectedCategories.includes(d.Categoría);
      
      return matchYear && matchMonth && matchStore && matchCategory;
    });
  }, [processedData, selectedYears, selectedMonths, selectedStores, selectedCategories, userRole, processedAllowedStores]);

  // KPIs
  const productKPIs = useMemo(() => {
    let totalUnidades = 0;
    const catAgg = {};
    const yearAgg = {};
    
    let minYear = Infinity;
    let maxYear = -Infinity;
    
    filteredData.forEach(d => {
      const val = getQty(d);
      totalUnidades += val;
      catAgg[d.Categoría] = (catAgg[d.Categoría] || 0) + val;
      
      const y = parseInt(d.Año);
      if (!isNaN(y)) {
        yearAgg[y] = (yearAgg[y] || 0) + val;
        if (y < minYear) minYear = y;
        if (y > maxYear) maxYear = y;
      }
    });

    const catSorted = Object.keys(catAgg).sort((a,b) => catAgg[b] - catAgg[a]);
    const categoriaLider = catSorted.length > 0 ? catSorted[0] : 'N/A';

    const yearSorted = Object.keys(yearAgg).sort((a,b) => yearAgg[b] - yearAgg[a]);
    const añoMasAlto = yearSorted.length > 0 ? yearSorted[0] : 'N/A';
    
    let crecimientoStr = 'N/A';
    let crecimientoNum = 0;

    const isSingleYear = selectedYears.length === 1;
    const isSingleMonth = selectedMonths.length === 1;

    if (isSingleYear && isSingleMonth && availableMonths.length > 0) {
      const currentMonth = selectedMonths[0];
      const monthIndex = availableMonths.indexOf(currentMonth);
      if (monthIndex > 0) {
        const prevMonth = availableMonths[monthIndex - 1];
        let currentMonthVal = 0;
        let prevMonthVal = 0;
        const currentYear = selectedYears[0];
        
        processedData.forEach(d => {
           const hasStoreData = d.Tienda && d.Tienda.trim() !== '';
           const matchStore = !hasStoreData || (userRole === 'admin' ? selectedStores.includes(d.Tienda) : processedAllowedStores.includes(d.Tienda));
           const matchCategory = selectedCategories.length === 0 || selectedCategories.includes(d.Categoría);
           const matchYear = String(d.Año) === currentYear;
           
           if (matchStore && matchCategory && matchYear) {
             if (d.Mes === currentMonth) currentMonthVal += getQty(d);
             else if (d.Mes === prevMonth) prevMonthVal += getQty(d);
           }
        });
        
        if (prevMonthVal > 0) {
           crecimientoNum = ((currentMonthVal - prevMonthVal) / prevMonthVal) * 100;
           crecimientoStr = `${crecimientoNum > 0 ? '+' : ''}${crecimientoNum.toFixed(1)}%`;
        } else if (currentMonthVal > 0) {
           crecimientoNum = 100;
           crecimientoStr = '+100%';
        }
      }
    } else {
      if (minYear !== Infinity && maxYear !== -Infinity && minYear < maxYear) {
         const firstYearVal = yearAgg[minYear] || 0;
         const lastYearVal = yearAgg[maxYear] || 0;
         if (firstYearVal > 0) {
            crecimientoNum = ((lastYearVal - firstYearVal) / firstYearVal) * 100;
            crecimientoStr = `${crecimientoNum > 0 ? '+' : ''}${crecimientoNum.toFixed(1)}%`;
         } else if (lastYearVal > 0) {
            crecimientoNum = 100;
            crecimientoStr = '+100%';
         }
      }
    }

    // Top 3 años por total de unidades
    const top3Years = Object.keys(yearAgg)
      .sort((a, b) => yearAgg[b] - yearAgg[a])
      .slice(0, 3)
      .map(yr => ({ year: yr, total: yearAgg[yr] }));

    // Serie de crecimiento año a año (ordenado cronológicamente)
    const yearsSorted = Object.keys(yearAgg).map(Number).sort((a, b) => a - b);
    const yearGrowthSeries = yearsSorted.map((yr, i) => {
      const currentVal = yearAgg[yr] || 0;
      const prevVal = i > 0 ? (yearAgg[yearsSorted[i - 1]] || 0) : null;
      let growthPct = null;
      if (prevVal !== null && prevVal > 0) {
        growthPct = ((currentVal - prevVal) / prevVal) * 100;
      } else if (prevVal !== null && currentVal > 0) {
        growthPct = 100;
      }
      return { year: String(yr), total: currentVal, growthPct };
    });

    return {
      totalUnidades,
      categoriaLider,
      añoMasAlto,
      crecimientoStr,
      crecimientoNum,
      top5Categories: catSorted.slice(0, 5),
      top3Years,
      yearGrowthSeries
    };
  }, [filteredData, selectedYears, selectedMonths, availableMonths, processedData, selectedStores, selectedCategories, userRole, processedAllowedStores]);

  // Chart 2: Unidades vendidas por categoría
  const categoryChartData = useMemo(() => {
    const agg = {};
    filteredData.forEach(d => {
      agg[d.Categoría] = (agg[d.Categoría] || 0) + getQty(d);
    });
    const labels = Object.keys(agg).sort((a,b) => agg[b] - agg[a]);
    const values = labels.map(l => agg[l]);
    
    return {
      labels,
      datasets: [{
        label: 'Unidades Vendidas',
        data: values,
        backgroundColor: '#ff6d4d',
        borderRadius: 4
      }]
    };
  }, [filteredData]);

  // Chart 3: Top 5 Categorías por año
  const top5CategoryYearsData = useMemo(() => {
    const yearsSet = new Set();
    filteredData.forEach(d => {
      if (d.Año) yearsSet.add(String(d.Año));
    });
    const years = Array.from(yearsSet).sort();
    
    const top5Cats = productKPIs.top5Categories;
    
    const agg = {};
    years.forEach(y => {
      agg[y] = {};
      top5Cats.forEach(c => agg[y][c] = 0);
    });
    
    filteredData.forEach(d => {
      const y = String(d.Año);
      const c = d.Categoría;
      if (agg[y] && top5Cats.includes(c)) {
        agg[y][c] += getQty(d);
      }
    });

    const categoryColors = ['#ff6d4d', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
    
    const datasets = top5Cats.map((cat, index) => {
      return {
        label: cat,
        data: years.map(y => agg[y][cat]),
        backgroundColor: categoryColors[index % categoryColors.length],
        borderRadius: 4
      };
    });

    return {
      labels: years,
      datasets
    };
  }, [filteredData, productKPIs.top5Categories]);

  // Chart 1: Tendencias de Productos (Mixed: Line for past years, Bar for current year)
  const mixedProductData = useMemo(() => {
    const yearsSet = new Set();
    const catSet = new Set();
    
    filteredData.forEach(d => {
      if (d.Año) yearsSet.add(String(d.Año));
      if (d.Categoría) catSet.add(d.Categoría);
    });
    
    let years = Array.from(yearsSet).sort();
    const categories = Array.from(catSet).sort();
    
    if (years.length === 0) years = availableYears;
    const maxYear = years.length > 0 ? years[years.length - 1] : String(new Date().getFullYear());
    
    const agg = {};
    years.forEach(y => {
      agg[y] = {};
      categories.forEach(c => agg[y][c] = 0);
    });
    
    filteredData.forEach(d => {
      const y = String(d.Año);
      const c = d.Categoría;
      if (agg[y] && agg[y][c] !== undefined) {
        agg[y][c] += getQty(d);
      }
    });
    
    const lineColors = ['#94a3b8', '#60a5fa', '#34d399', '#fbbf24', '#f87171'];
    const datasets = years.map((y, index) => {
      const isMaxYear = y === maxYear;
        return {
          type: 'bar',
          label: isMaxYear ? `Unidades ${y}` : `Tendencia ${y}`,
          data: categories.map(c => agg[y][c]),
          backgroundColor: isMaxYear ? '#ff6d4d' : lineColors[index % lineColors.length],
          borderColor: isMaxYear ? '#e65c40' : lineColors[index % lineColors.length],
          borderWidth: 1,
          borderRadius: 4,
          order: isMaxYear ? 2 : 1
        };
    });

    return {
      labels: categories,
      datasets: datasets
    };
  }, [filteredData, availableYears]);

  // Chart 3 & 4: Ventas por Tienda (Doughnut) y Detalles Expandibles
  const { storeDataRuta1, storeDataRuta2, storeDetailsRuta1, storeDetailsRuta2 } = useMemo(() => {
    const agg1 = {};
    const agg2 = {};
    const details1 = {};
    const details2 = {};
    const ruta2Stores = ['CHM', 'ESC', 'HH', 'MZ', 'SMA', 'VN', 'XL'];

    filteredData.forEach(d => {
      const s = d.Tienda;
      const val = getQty(d);

      if (ruta2Stores.includes(s)) {
        agg2[s] = (agg2[s] || 0) + val;
        if (!details2[s]) details2[s] = { total: 0, categories: {} };
        details2[s].total += val;
        details2[s].categories[d.Categoría] = (details2[s].categories[d.Categoría] || 0) + val;
      } else {
        agg1[s] = (agg1[s] || 0) + val;
        if (!details1[s]) details1[s] = { total: 0, categories: {} };
        details1[s].total += val;
        details1[s].categories[d.Categoría] = (details1[s].categories[d.Categoría] || 0) + val;
      }
    });
    
    const colors = [
      '#1e3a8a', '#3b82f6', '#60a5fa', '#64748b', '#94a3b8', 
      '#10b981', '#34d399', '#ff6d4d', '#0f172a', '#334155',
      '#cbd5e1', '#059669', '#818cf8', '#4f46e5'
    ];

    const labels1 = Object.keys(agg1);
    const labels2 = Object.keys(agg2);

    const mapDetails = (detObj) => {
      const routeTotal = Object.values(detObj).reduce((sum, s) => sum + s.total, 0);
      return Object.keys(detObj).map(store => {
        const storeTotal = detObj[store].total;
        return {
          store,
          total: storeTotal,
          percentage: routeTotal > 0 ? Math.round((storeTotal / routeTotal) * 100) : 0,
          categories: Object.entries(detObj[store].categories)
            .sort((a,b) => b[1] - a[1])
            .map(([name, value]) => ({ 
              name, 
              value,
              percentage: storeTotal > 0 ? Math.round((value / storeTotal) * 100) : 0 
            }))
        };
      }).sort((a,b) => b.total - a.total);
    };

    return {
      storeDataRuta1: {
        labels: labels1,
        datasets: [{ data: labels1.map(l => agg1[l]), backgroundColor: colors.slice(0, labels1.length), borderWidth: 0 }]
      },
      storeDataRuta2: {
        labels: labels2,
        datasets: [{ data: labels2.map(l => agg2[l]), backgroundColor: colors.slice(0, labels2.length), borderWidth: 0 }]
      },
      storeDetailsRuta1: mapDetails(details1),
      storeDetailsRuta2: mapDetails(details2)
    };
  }, [filteredData]);

  // Update text colors to dark since background is light
  const textColor = '#333333';
  const gridColor = '#e0e0e0';

  const datalabelsStyle = {
    display: true,
    color: '#475569',
    rotation: -45,
    textStrokeColor: '#ffffff',
    textStrokeWidth: 3,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowBlur: 4,
    align: 'top',
    anchor: 'end',
    font: { weight: 'bold', size: 11 },
    offset: 4
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: textColor, font: { weight: 'bold' } } },
      datalabels: datalabelsStyle,
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#000', bodyColor: '#000', borderColor: '#ddd', borderWidth: 1
      }
    },
    scales: {
      y: { grid: { color: gridColor }, ticks: { color: textColor } },
      x: { grid: { display: false }, ticks: { color: textColor, maxRotation: 45, minRotation: 45 } }
    }
  };

  const lineOptions = {
    ...barOptions,
    plugins: {
      ...barOptions.plugins,
      datalabels: datalabelsStyle
    },
    scales: {
      y: { grid: { color: gridColor }, ticks: { color: textColor } },
      x: { grid: { display: false }, ticks: { color: textColor, maxRotation: 45, minRotation: 45 } }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { position: 'right', labels: { color: textColor, padding: 20, font: { weight: 'bold' } } },
      datalabels: {
        color: (context) => {
          const c = context.dataset.backgroundColor[context.dataIndex];
          return ['#cbd5e1', '#94a3b8', '#34d399', '#60a5fa'].includes(c) ? '#1E293B' : '#ffffff';
        },
        font: { weight: 'bold', size: 11 }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)', titleColor: '#000', bodyColor: '#000', borderColor: '#ddd', borderWidth: 1
      }
    }
  };

  // Mini gráfica de crecimiento año a año
  const miniLineData = {
    labels: productKPIs.yearGrowthSeries.map(d => d.year),
    datasets: [{
      data: productKPIs.yearGrowthSeries.map(d => d.growthPct),
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139, 92, 246, 0.12)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: productKPIs.yearGrowthSeries.map(d =>
        d.growthPct === null ? '#94a3b8' : d.growthPct >= 0 ? '#10b981' : '#ef4444'
      ),
      pointRadius: 5,
      pointHoverRadius: 7,
      spanGaps: true,
    }]
  };

  const miniLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
      datalabels: {
        display: (ctx) => ctx.dataset.data[ctx.dataIndex] !== null,
        color: (ctx) => {
          const val = ctx.dataset.data[ctx.dataIndex];
          return val !== null && val >= 0 ? '#10b981' : '#ef4444';
        },
        font: { weight: 'bold', size: 10 },
        formatter: (val) => val !== null ? `${val >= 0 ? '+' : ''}${val.toFixed(1)}%` : '',
        align: 'top',
        anchor: 'end',
        offset: 2,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 10, weight: 'bold' } },
        border: { display: false }
      },
      y: { display: false }
    },
    layout: { padding: { top: 22, bottom: 0, left: 4, right: 4 } }
  };

  if (!data || data.length === 0) {
    return (
      <div className="view-container" style={{ animation: 'fadeIn 0.4s ease-out' }}>
        <div className="empty-state">
          <i className="fas fa-chart-bar" style={{ fontSize: '48px', color: 'var(--text-muted)', marginBottom: '16px' }}></i>
          <h3>No hay datos de tendencias</h3>
          <p style={{ color: 'var(--text-muted)' }}>Carga datos en la hoja "Tendencias_Data" de tu Google Sheet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view-container" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* Filtros */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px', animation: 'slideUp 0.5s ease-out' }}>
        
        <MultiSelectDropdown 
          label="Años" 
          icon="fa-calendar"
          options={availableYears} 
          selected={selectedYears} 
          onChange={setSelectedYears} 
        />

        <MultiSelectDropdown 
          label="Meses" 
          icon="fa-calendar-alt"
          options={availableMonths} 
          selected={selectedMonths} 
          onChange={setSelectedMonths} 
        />

        <MultiSelectDropdown 
          label="Categorías" 
          icon="fa-tags"
          options={availableCategories} 
          selected={selectedCategories} 
          onChange={setSelectedCategories} 
        />

        <MultiSelectDropdown 
          label="Tiendas" 
          icon="fa-store"
          options={availableStores} 
          selected={selectedStores} 
          onChange={setSelectedStores}
          disabled={userRole !== 'admin'}
        />

      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* Total Unidades */}
        <div className="glass-card" style={{ padding: '16px', textAlign: 'center', backgroundColor: '#fff', borderTop: '4px solid #ff6d4d', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <i className="fas fa-boxes" style={{ fontSize: '24px', color: '#ff6d4d', opacity: 0.8, marginBottom: '12px' }}></i>
          <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>Total unidades vendidas</div>
          <div style={{ color: '#1a1f36', fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>{productKPIs.totalUnidades.toLocaleString()}</div>
        </div>

        {/* Categoría Líder */}
        <div className="glass-card" style={{ padding: '16px', textAlign: 'center', backgroundColor: '#fff', borderTop: '4px solid #3b82f6', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <i className="fas fa-trophy" style={{ fontSize: '24px', color: '#3b82f6', opacity: 0.8, marginBottom: '12px' }}></i>
          <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>Categoría líder</div>
          <div style={{ color: '#1a1f36', fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>{productKPIs.categoriaLider}</div>
        </div>

        {/* Año más alto - TOP 3 podio */}
        <div className="glass-card" style={{ padding: '16px 12px', backgroundColor: '#fff', borderTop: '4px solid #10b981', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.05em' }}>Top 3 Años</div>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', width: '100%', alignItems: 'flex-end' }}>

            {/* 2do lugar */}
            {productKPIs.top3Years[1] ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, paddingBottom: '0px' }}>
                <i className="fas fa-trophy" style={{ color: '#94a3b8', fontSize: '18px', marginBottom: '6px' }}></i>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#475569', lineHeight: 1 }}>{productKPIs.top3Years[1].year}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', marginTop: '4px' }}>{productKPIs.top3Years[1].total.toLocaleString()}</div>
                <div style={{ width: '100%', height: '4px', backgroundColor: '#94a3b8', borderRadius: '2px', marginTop: '8px', opacity: 0.4 }}></div>
              </div>
            ) : <div style={{ flex: 1 }} />}

            {/* 1er lugar */}
            {productKPIs.top3Years[0] ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <i className="fas fa-medal" style={{ color: '#f59e0b', fontSize: '24px', marginBottom: '6px' }}></i>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#1a1f36', lineHeight: 1 }}>{productKPIs.top3Years[0].year}</div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginTop: '4px' }}>{productKPIs.top3Years[0].total.toLocaleString()}</div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#f59e0b', borderRadius: '2px', marginTop: '8px', opacity: 0.7 }}></div>
              </div>
            ) : <div style={{ flex: 1 }} />}

            {/* 3er lugar */}
            {productKPIs.top3Years[2] ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <i className="fas fa-wine-glass" style={{ color: '#cd7f32', fontSize: '16px', marginBottom: '6px' }}></i>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#94a3b8', lineHeight: 1 }}>{productKPIs.top3Years[2].year}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', marginTop: '4px' }}>{productKPIs.top3Years[2].total.toLocaleString()}</div>
                <div style={{ width: '100%', height: '4px', backgroundColor: '#cd7f32', borderRadius: '2px', marginTop: '8px', opacity: 0.4 }}></div>
              </div>
            ) : <div style={{ flex: 1 }} />}

          </div>
        </div>

        {/* Crecimiento - Mini gráfica de líneas */}
        <div className="glass-card" style={{ padding: '16px 12px', backgroundColor: '#fff', borderTop: '4px solid #8b5cf6', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <i className="fas fa-chart-line" style={{ fontSize: '20px', color: '#8b5cf6', opacity: 0.8, marginBottom: '8px' }}></i>
          <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Crecimiento</div>
          {productKPIs.yearGrowthSeries.length >= 2 ? (
            <div style={{ width: '100%', height: '90px' }}>
              <Line data={miniLineData} options={miniLineOptions} />
            </div>
          ) : (
            <div style={{ color: productKPIs.crecimientoNum > 0 ? '#10b981' : productKPIs.crecimientoNum < 0 ? '#ef4444' : '#1a1f36', fontSize: '28px', fontWeight: '800' }}>
              {productKPIs.crecimientoStr}
            </div>
          )}
        </div>

      </div>

      {/* Botón de Tendencia Anual oculto, ya no se usa aquí */}
      {/* Gráficas Principales */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="glass-card full-width" style={{ animation: 'slideUp 0.6s ease-out', backgroundColor: '#ffffff' }}>
          <div className="card-header border-bottom">
            <h2 className="card-title">Tendencia de Productos</h2>
          </div>
          <div className="card-body" style={{ height: '400px' }}>
            <Bar data={mixedProductData} options={lineOptions} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          {/* Chart 2: Unidades vendidas por categoría */}
          <div className="glass-card full-width" style={{ animation: 'slideUp 0.7s ease-out', backgroundColor: '#ffffff' }}>
            <div className="card-header border-bottom">
              <h2 className="card-title">Unidades vendidas por categoría</h2>
            </div>
            <div className="card-body" style={{ height: '400px' }}>
              <Bar data={categoryChartData} options={{ ...barOptions, indexAxis: 'y' }} />
            </div>
          </div>
          
          {/* Chart 3: Top 5 Categorías por año */}
          <div className="glass-card full-width" style={{ animation: 'slideUp 0.8s ease-out', backgroundColor: '#ffffff' }}>
            <div className="card-header border-bottom">
              <h2 className="card-title">TOP 5 Categorías por año</h2>
            </div>
            <div className="card-body" style={{ height: '400px' }}>
              <Bar data={top5CategoryYearsData} options={barOptions} />
            </div>
          </div>
        </div>

        {(userRole === 'admin' && selectedStores.length > 1) && (
          <div className="glass-card full-width" style={{ animation: 'slideUp 0.8s ease-out', backgroundColor: '#f8fafc' }}>
            <div className="card-header border-bottom" style={{ backgroundColor: '#fff' }}>
              <h2 className="card-title">Productos vendidos por tienda</h2>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '40px', padding: '24px' }}>
              
              {/* Ruta 1 */}
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2.5fr', gap: '30px', alignItems: 'start' }}>
                  <div style={{ height: '450px', display: 'flex', flexDirection: 'column', backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ color: '#ff6d4d', fontSize: '18px', fontWeight: '700', marginBottom: '20px', textAlign: 'left' }}>Productos Vendidos Ruta 1</h3>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <Doughnut data={storeDataRuta1} options={doughnutOptions} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    {storeDetailsRuta1.map((storeObj) => (
                      <div key={storeObj.store} onClick={() => toggleStore('R1_' + storeObj.store)} style={{ cursor: 'pointer', backgroundColor: '#fff', borderRadius: '8px', padding: '16px', border: '1px solid #e2e8f0', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: expandedStores['R1_' + storeObj.store] ? '12px' : '0' }}>
                          <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{storeObj.store} <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '500', marginLeft: '4px' }}>{storeObj.percentage}%</span></h4>
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#ff6d4d', backgroundColor: '#fff0ed', padding: '4px 8px', borderRadius: '12px' }}>
                            {storeObj.total.toLocaleString()} <i className={`fas fa-chevron-${expandedStores['R1_' + storeObj.store] ? 'up' : 'down'}`} style={{ marginLeft: '4px', fontSize: '10px' }}></i>
                          </span>
                        </div>
                        {expandedStores['R1_' + storeObj.store] && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                            {storeObj.categories.map((cat) => (
                              <div key={cat.name} style={{ display: 'grid', gridTemplateColumns: '1fr auto 35px', gap: '8px', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>{cat.name}</span>
                                <span style={{ fontSize: '12px', color: '#1e293b', fontWeight: '800', textAlign: 'right' }}>{cat.value.toLocaleString()}</span>
                                <span style={{ color: '#94a3b8', fontSize: '11px', textAlign: 'right', fontWeight: '500' }}>{cat.percentage}%</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Ruta 2 */}
              <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '40px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2.5fr', gap: '30px', alignItems: 'start' }}>
                  <div style={{ height: '450px', display: 'flex', flexDirection: 'column', backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ color: '#ff6d4d', fontSize: '18px', fontWeight: '700', marginBottom: '20px', textAlign: 'left' }}>Productos Vendidos Ruta 2</h3>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <Doughnut data={storeDataRuta2} options={doughnutOptions} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    {storeDetailsRuta2.map((storeObj) => (
                      <div key={storeObj.store} onClick={() => toggleStore('R2_' + storeObj.store)} style={{ cursor: 'pointer', backgroundColor: '#fff', borderRadius: '8px', padding: '16px', border: '1px solid #e2e8f0', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: expandedStores['R2_' + storeObj.store] ? '12px' : '0' }}>
                          <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{storeObj.store} <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '500', marginLeft: '4px' }}>{storeObj.percentage}%</span></h4>
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#ff6d4d', backgroundColor: '#fff0ed', padding: '4px 8px', borderRadius: '12px' }}>
                            {storeObj.total.toLocaleString()} <i className={`fas fa-chevron-${expandedStores['R2_' + storeObj.store] ? 'up' : 'down'}`} style={{ marginLeft: '4px', fontSize: '10px' }}></i>
                          </span>
                        </div>
                        {expandedStores['R2_' + storeObj.store] && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                            {storeObj.categories.map((cat) => (
                              <div key={cat.name} style={{ display: 'grid', gridTemplateColumns: '1fr auto 35px', gap: '8px', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>{cat.name}</span>
                                <span style={{ fontSize: '12px', color: '#1e293b', fontWeight: '800', textAlign: 'right' }}>{cat.value.toLocaleString()}</span>
                                <span style={{ color: '#94a3b8', fontSize: '11px', textAlign: 'right', fontWeight: '500' }}>{cat.percentage}%</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

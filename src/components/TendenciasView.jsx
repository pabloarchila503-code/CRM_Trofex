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

export default function TendenciasView({ data = [], userRole, allowedStores }) {
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

  // Helper: lee código/descripción de producto sin importar el nombre exacto de columna
  const getProductCode = (d) =>
    d['Código'] || d['Codigo'] || d['SKU'] || d['Código Producto'] ||
    d['Código de Producto'] || d['Descripción'] || d['Descripcion'] ||
    d['Producto'] || null;

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

  // Top Categories KPIs
  const topCategories = useMemo(() => {
    const agg = {};
    let total = 0;
    filteredData.forEach(d => {
      const val = getQty(d);
      agg[d.Categoría] = (agg[d.Categoría] || 0) + val;
      total += val;
    });
    const sorted = Object.keys(agg).sort((a,b) => agg[b] - agg[a]);
    return sorted.slice(0, 5).map(name => ({
      name,
      value: agg[name],
      percentage: total > 0 ? ((agg[name] / total) * 100).toFixed(1) : 0
    }));
  }, [filteredData]);

  // TOP 8 Productos por Categoría
  const top8ByCategory = useMemo(() => {
    const catProducts = {};

    filteredData.forEach(d => {
      const cat = d.Categoría;
      const code = getProductCode(d);
      const qty = getQty(d);
      if (!cat) return;
      if (!catProducts[cat]) catProducts[cat] = { total: 0, products: {} };
      catProducts[cat].total += qty;
      if (code) {
        catProducts[cat].products[code] = (catProducts[cat].products[code] || 0) + qty;
      }
    });

    return Object.entries(catProducts)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([catName, { total, products }]) => {
        const sorted = Object.entries(products)
          .sort(([, a], [, b]) => b - a)
          .map(([code, qty]) => ({
            code,
            qty,
            percentage: total > 0 ? ((qty / total) * 100).toFixed(1) : '0.0'
          }));
        return { catName, total, products: sorted };
      });
  }, [filteredData]);

  // Chart 1: Ventas por Categoría (Bar)
  const categoryData = useMemo(() => {
    const agg = {};
    filteredData.forEach(d => {
      agg[d.Categoría] = (agg[d.Categoría] || 0) + getQty(d);
    });
    const labels = Object.keys(agg).sort((a,b) => agg[b] - agg[a]);
    const values = labels.map(l => agg[l]);
    
    const bgColors = labels.map((l, i) => i === 0 || l === 'Promocionales' ? '#ff6d4d' : 'rgba(20, 58, 94, 0.9)');
    const borderColors = labels.map((l, i) => i === 0 || l === 'Promocionales' ? '#e65c40' : '#143a5e');
    
    return {
      labels,
      datasets: [{
        label: 'Unidades Vendidas',
        data: values,
        backgroundColor: bgColors,
        borderColor: borderColors,
        borderWidth: 1,
        borderRadius: 4
      }]
    };
  }, [filteredData]);

  // Chart 2: Ventas por Mes (Line)
  const monthData = useMemo(() => {
    const agg = {};
    availableMonths.forEach(m => agg[m] = 0);
    filteredData.forEach(d => {
      if (agg[d.Mes] !== undefined) {
        agg[d.Mes] += getQty(d);
      }
    });

    return {
      labels: availableMonths, // Always show all months on X axis to preserve timeline, even if filtered
      datasets: [{
        label: 'Tendencia Mensual',
        data: availableMonths.map(m => agg[m]),
        borderColor: '#fea514',
        borderWidth: 3,
        backgroundColor: 'rgba(254, 165, 20, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#fea514',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }]
    };
  }, [filteredData, availableMonths]);

  // Chart 3 & 4: Ventas por Tienda (Doughnut) y Detalles Expandibles
  const { storeDataRuta1, storeDataRuta2, storeDetailsRuta1, storeDetailsRuta2 } = useMemo(() => {
    const agg1 = {};
    const agg2 = {};
    const details1 = {};
    const details2 = {};
    const ruta2Stores = ['CHM', 'ESC', 'HH', 'MZ', 'SMA', 'VN', 'XL'];

    filteredData.forEach(d => {
      const s = d.Tienda;
      if (!s) return;
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

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: textColor, font: { weight: 'bold' } } },
      datalabels: {
        color: '#ffffff',
        font: { weight: 'bold' },
        anchor: 'center',
        align: 'center'
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#000', bodyColor: '#000', borderColor: '#ddd', borderWidth: 1
      }
    },
    scales: {
      y: { grid: { color: gridColor }, ticks: { color: textColor } },
      x: { grid: { display: false }, ticks: { color: textColor, maxRotation: 0, minRotation: 0 } }
    }
  };

  const lineOptions = {
    ...barOptions,
    plugins: {
      ...barOptions.plugins,
      datalabels: { 
        display: true,
        color: '#1e293b',
        align: 'top',
        anchor: 'end',
        font: { weight: 'bold', size: 11 },
        offset: 4
      }
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

  const PRODUCT_COLORS = [
    '#ff6d4d', '#3b82f6', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#14b8a6', '#94a3b8'
  ];

  const categoryDoughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: { display: false },
      datalabels: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255,255,255,0.97)',
        titleColor: '#1e293b', bodyColor: '#475569',
        borderColor: '#e2e8f0', borderWidth: 1,
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${Number(ctx.parsed).toLocaleString()} uds`
        }
      }
    }
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

      {/* Tarjetas KPI de Categorías */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px', animation: 'slideUp 0.6s ease-out' }}>
        {topCategories.map((cat, i) => (
          <div key={cat.name} className="glass-card" style={{ padding: '16px', textAlign: 'center', backgroundColor: '#fff', borderTop: `4px solid ${i === 0 ? '#ff6d4d' : '#3b82f6'}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>{cat.name}</div>
            <div style={{ color: '#1a1f36', fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>{cat.value.toLocaleString()}</div>
            <div style={{ color: '#10b981', fontSize: '12px', fontWeight: '600' }}>{cat.percentage}% del total</div>
          </div>
        ))}
      </div>

      {/* Gráficas Principales */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* === TOP 8 Productos por Categoría === */}
        <div className="glass-card full-width" style={{ animation: 'slideUp 0.7s ease-out', backgroundColor: '#fff' }}>
          <div className="card-header border-bottom">
            <h2 className="card-title">TOP 8 Productos por Categoría</h2>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500', marginLeft: 'auto' }}>Donut = distribución · Lista = ranking</span>
          </div>
          <div className="card-body" style={{ padding: '24px' }}>
            {top8ByCategory.some(c => c.products.length > 0) ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px' }}>
                {top8ByCategory.map(({ catName, total, products }, catIdx) => {
                  if (products.length === 0) return null;
                  // Para el donut mostramos TOP 8 + "Otros" si hay más
                  const top8 = products.slice(0, 8);
                  const restQty = products.slice(8).reduce((s, p) => s + p.qty, 0);
                  const donutProds = restQty > 0 ? [...top8, { code: 'Otros', qty: restQty }] : top8;
                  const catDonutData = {
                    labels: donutProds.map(p => p.code),
                    datasets: [{ data: donutProds.map(p => p.qty), backgroundColor: [...PRODUCT_COLORS.slice(0, top8.length), '#cbd5e1'], borderWidth: 2, borderColor: '#ffffff' }]
                  };
                  const gradients = [
                    'linear-gradient(135deg,#1e3a8a,#3b82f6)',
                    'linear-gradient(135deg,#065f46,#10b981)',
                    'linear-gradient(135deg,#7c2d12,#f97316)',
                    'linear-gradient(135deg,#4c1d95,#8b5cf6)',
                    'linear-gradient(135deg,#831843,#ec4899)',
                    'linear-gradient(135deg,#134e4a,#14b8a6)',
                    'linear-gradient(135deg,#1e1b4b,#6366f1)',
                    'linear-gradient(135deg,#1c1917,#78716c)',
                    'linear-gradient(135deg,#0c4a6e,#0ea5e9)',
                    'linear-gradient(135deg,#14532d,#22c55e)',
                  ];
                  const gradient = gradients[catIdx % gradients.length];
                  return (
                    <div key={catName} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', transition: 'transform 0.2s,box-shadow 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
                    >
                      {/* Header degradado */}
                      <div style={{ padding: '12px 18px', background: gradient, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className="fas fa-tag" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px' }}></i>
                          <span style={{ color: '#fff', fontWeight: '800', fontSize: '15px' }}>{catName}</span>
                        </div>
                        <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                          {total.toLocaleString()} uds
                        </span>
                      </div>
                      {/* Donut + Lista */}
                      <div style={{ display: 'grid', gridTemplateColumns: '148px 1fr' }}>
                        <div style={{ padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #f1f5f9', background: '#fafbfc', gap: '10px' }}>
                          <div style={{ width: '116px', height: '116px' }}>
                            <Doughnut data={catDonutData} options={categoryDoughnutOptions} />
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 6px', justifyContent: 'center', maxWidth: '130px' }}>
                            {products.slice(0, 4).map((p, i) => (
                              <div key={p.code} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: PRODUCT_COLORS[i], flexShrink: 0 }}></div>
                                <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '600', maxWidth: '50px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.code}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{ padding: '12px 14px 12px', display: 'flex', flexDirection: 'column', gap: '0' }}>
                          {/* Encabezado fijo */}
                          <div style={{ display: 'grid', gridTemplateColumns: '20px 10px 1fr 64px 42px', gap: '4px', paddingBottom: '5px', borderBottom: '2px solid #f1f5f9', marginBottom: '4px', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
                            <span></span><span></span>
                            <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Código</span>
                            <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Cantidad</span>
                            <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>%</span>
                          </div>
                          {/* Lista con scroll: muestra 8 filas (~200px) y el resto es scrolleable */}
                          <div style={{ maxHeight: '208px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1px', paddingRight: '2px' }}>
                            {products.map((p, i) => (
                              <div key={p.code} style={{ display: 'grid', gridTemplateColumns: '20px 10px 1fr 64px 42px', alignItems: 'center', gap: '4px', padding: '4px 4px', borderRadius: '6px', backgroundColor: i === 0 ? '#fff7f5' : i % 2 === 0 ? '#fafafa' : '#fff' }}>
                                <span style={{ fontSize: '10px', fontWeight: '800', color: i === 0 ? '#ff6d4d' : i < 3 ? '#94a3b8' : '#cbd5e1', textAlign: 'center' }}>{i + 1}</span>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: PRODUCT_COLORS[i % 8] || '#e2e8f0', flexShrink: 0 }}></div>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.code}>{p.code}</span>
                                <span style={{ fontSize: '11px', fontWeight: '600', color: '#475569', textAlign: 'right' }}>{p.qty.toLocaleString()}</span>
                                <span style={{ fontSize: '11px', fontWeight: '700', color: i < 3 ? '#ff6d4d' : '#94a3b8', textAlign: 'right', background: i < 3 ? '#fff0ed' : 'transparent', padding: '1px 3px', borderRadius: '3px' }}>{p.percentage}%</span>
                              </div>
                            ))}
                          </div>
                          {products.length > 8 && (
                            <div style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8', marginTop: '6px', fontWeight: '600' }}>
                              ↕ {products.length} productos · scroll para ver todos
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8' }}>
                <i className="fas fa-box-open" style={{ fontSize: '40px', marginBottom: '14px', display: 'block', opacity: 0.4 }}></i>
                <p style={{ margin: '0 0 6px', fontWeight: '700', color: '#64748b', fontSize: '15px' }}>Sin datos de código de producto</p>
                <p style={{ margin: 0, fontSize: '12px' }}>Agrega una columna "Código", "SKU" o "Descripción" en tu hoja de Google Sheets.</p>
              </div>
            )}
          </div>
        </div>

        {/* Productos vendidos por tienda removido — ver pestaña Tendencia de Producto */}
        {false && (userRole === 'admin' && selectedStores.length > 1) && (
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

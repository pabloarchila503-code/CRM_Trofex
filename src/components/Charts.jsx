import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

// Helper to format currency
const formatCurrency = (val) => {
  if (val >= 1_000_000) return 'Q' + (val / 1_000_000).toFixed(2) + 'M';
  if (val >= 1_000)     return 'Q' + (val / 1_000).toFixed(1) + 'k';
  return 'Q' + val.toFixed(0);
};

// ── Custom Datalabels Plugin for Chart.js ────────────────────────────
const customDatalabelsPlugin = {
  id: 'customDatalabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    ctx.save();
    
    chart.data.datasets.forEach((dataset, i) => {
      const meta = chart.getDatasetMeta(i);
      meta.data.forEach((element, index) => {
        let val;
        let percentageText = '';
        
        const isFunnel = chart.options.plugins?.customDatalabels?.isFunnel;
        const totalValue = chart.options.plugins?.customDatalabels?.totalValue;
        
        if (isFunnel) {
          const raw = dataset.data[index];
          if (Array.isArray(raw)) {
            val = Math.round(raw[1] - raw[0]);
            // Percentage relative to Level 1 (Prospecciones Total)
            const firstRaw = dataset.data[0];
            const total = firstRaw[1] - firstRaw[0];
            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
            percentageText = ` (${pct}%)`;
          } else {
            val = raw;
          }
        } else {
          val = dataset.data[index];
          
          if (chart.config.type === 'doughnut' || chart.config.type === 'pie') {
            const sum = dataset.data.reduce((a, b) => a + b, 0);
            const pct = sum > 0 ? Math.round((val / sum) * 100) : 0;
            percentageText = ` (${pct}%)`;
          } else if (totalValue) {
            const pct = totalValue > 0 ? Math.round((val / totalValue) * 100) : 0;
            percentageText = ` (${pct}%)`;
          } else {
            const sum = dataset.data.reduce((a, b) => a + b, 0);
            const pct = sum > 0 ? Math.round((val / sum) * 100) : 0;
            percentageText = ` (${pct}%)`;
          }
        }
        
        // Formato requerido: '45 (30%)'
        const labelText = `${val}${percentageText}`;
        
        ctx.font = 'bold 10px Inter, sans-serif';
        
        if (chart.config.type === 'doughnut' || chart.config.type === 'pie') {
          // Centrado en el slice
          const centerAngle = element.startAngle + (element.endAngle - element.startAngle) / 2;
          const radius = element.innerRadius + (element.outerRadius - element.innerRadius) / 2;
          const labelX = element.x + Math.cos(centerAngle) * radius;
          const labelY = element.y + Math.sin(centerAngle) * radius;
          
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#FFFFFF';
          
          ctx.shadowBlur = 3;
          ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
          
          if (element.endAngle - element.startAngle > 0.22 && val > 0) {
            ctx.fillText(labelText, labelX, labelY);
          }
          ctx.shadowBlur = 0; // reset
        } else if (chart.options.indexAxis === 'y') {
          ctx.textBaseline = 'middle';
          if (isFunnel) {
            const labelX = (element.x + element.base) / 2;
            const labelY = element.y;
            ctx.textAlign = 'center';
            
            if (element.x - element.base > 55 && val > 0) {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillText(labelText, labelX, labelY);
            } else if (val > 0) {
              ctx.fillStyle = '#1E293B';
              ctx.textAlign = 'left';
              ctx.fillText(labelText, element.x + 6, labelY);
            }
          } else {
            ctx.fillStyle = '#1E293B';
            ctx.textAlign = 'left';
            if (val > 0) {
              ctx.fillText(labelText, element.x + 6, element.y);
            }
          }
        } else {
          // Vertical Bar Chart
          ctx.fillStyle = '#1E293B';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          if (val > 0) {
            ctx.fillText(labelText, element.x, element.y - 6);
          }
        }
      });
    });
    
    ctx.restore();
  }
};

// ── Gráfico 1: Valor por Etapa del Pipeline (Barra) ──────────────────
export function PipelineChart({ deals, stages }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const stageMap = {};
    stages.forEach(s => { stageMap[s.id] = { name: s.name, total: 0, color: s.color }; });
    deals.forEach(d => {
      if (stageMap[d.stage_id]) stageMap[d.stage_id].total += d.amount;
    });

    const labels = stages.map(s => s.name);
    const values = stages.map(s => stageMap[s.id].total);
    const colors = stages.map(s => s.color);

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Valor del Pipeline (Q)',
          data: values,
          backgroundColor: colors.map(c => c + 'CC'),
          borderColor: colors,
          borderWidth: 2,
          borderRadius: 10,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ' ' + formatCurrency(ctx.raw)
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
            ticks: {
              color: '#64748B',
              font: { family: 'Inter', size: 11 },
              callback: v => formatCurrency(v)
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
  }, [deals, stages]);

  return <canvas ref={canvasRef} />;
}

// ── Gráfica 1 (Reordenado): Prospectos/Prospecciones (Cono / Funnel Chart) ────
export function ProspectosChart({ deals }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Niveles: 1. Prospecciones (Total), 2. Cotizaciones, 3. Seguimiento, 4. Cerrados
    const total = deals.length;
    const cotizaciones = deals.filter(d => d.stage_id === 's3' || d.status === 'won' || d.status === 'lost').length;
    const seguimiento = deals.filter(d => d.stage_id === 's2' || d.stage_id === 's3').length;
    const cerrados = deals.filter(d => d.status === 'won').length;

    const labels = ['1. Prospecciones', '2. Cotizaciones', '3. Seguimiento', '4. Cerrados'];
    const values = [total, cotizaciones, seguimiento, cerrados];
    
    // Semáforo:
    // Prospecciones -> Gris (#94A3B8)
    // Cotizaciones -> Amarillo (#F59E0B)
    // Seguimiento -> Naranja (#FF6D4D)
    // Cerrados -> Verde (#10B981)
    const colors = ['#94A3B8', '#F59E0B', '#FF6D4D', '#10B981'];

    // Simular embudo flotante centrado
    const dataValues = values.map(val => {
      if (total === 0) return [0, 0];
      const start = (total - val) / 2;
      const end = start + val;
      return [start, end];
    });

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: dataValues,
          backgroundColor: colors.map(c => c + 'CC'),
          borderColor: colors,
          borderWidth: 1.5,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => labels[items[0].dataIndex],
              label: (item) => ` Conteo: ${values[item.dataIndex]}`
            }
          },
          customDatalabels: {
            isFunnel: true
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { display: false }
          },
          y: {
            grid: { display: false },
            ticks: {
              color: '#64748B',
              font: { family: 'Inter', size: 10, weight: '600' }
            }
          }
        }
      },
      plugins: [customDatalabelsPlugin]
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [deals]);

  return <canvas ref={canvasRef} />;
}

// ── Gráfica 2 (Reordenado): Análisis 80/20 (Donut) ───────────────────────────
export function AnalisisChart({ deals }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Categorías: No contactados, Contactados, Cotizados, Cerrados y Perdidos
    const noContactados = deals.filter(d => d.stage_id === 's1' && d.status === 'open').length;
    const contactados = deals.filter(d => d.stage_id === 's2' && d.status === 'open').length;
    const cotizados = deals.filter(d => d.stage_id === 's3' && d.status === 'open').length;
    const cerrados = deals.filter(d => d.status === 'won').length;
    const perdidos = deals.filter(d => d.status === 'lost').length;

    const labels = ['No Contactados', 'Contactados', 'Cotizados', 'Cerrados', 'Perdidos'];
    const values = [noContactados, contactados, cotizados, cerrados, perdidos];

    // Semáforo:
    // No Contactados -> Gris (#94A3B8)
    // Contactados -> Azul (#3B82F6)
    // Cotizados -> Amarillo (#F59E0B)
    // Cerrados -> Verde (#10B981)
    // Perdidos -> Rojo (#EF4444)
    const colors = ['#94A3B8', '#3B82F6', '#F59E0B', '#10B981', '#EF4444'];

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    chartInstanceRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors.map(c => c + 'CC'),
          borderColor: colors,
          borderWidth: 1.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              font: { family: 'Inter', size: 9, weight: '500' },
              color: '#475569'
            }
          },
          tooltip: {
            callbacks: {
              label: (item) => ` Conteo: ${item.raw}`
            }
          }
        }
      },
      plugins: [customDatalabelsPlugin]
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [deals]);

  return <canvas ref={canvasRef} />;
}

// ── Gráfica 3 (Reordenado): Proyectos (Barra Vertical) ────────────────────────
export function ProyectosChart({ deals }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const totalEmpresas = new Set(deals.map(d => d.customer_id)).size;
    const contactados = deals.filter(d => d.stage_id === 's2').length;
    const cotizados = deals.filter(d => d.stage_id === 's3').length;
    const cerrados = deals.filter(d => d.status === 'won').length;

    const labels = ['Total de Empresas', 'Contactados', 'Cotizados', 'Cerrados'];
    const values = [totalEmpresas, contactados, cotizados, cerrados];

    // Semáforo:
    // Total de Empresas -> Gris (#94A3B8)
    // Contactados -> Azul (#3B82F6)
    // Cotizados -> Amarillo (#F59E0B)
    // Cerrados -> Verde (#10B981)
    const colors = ['#94A3B8', '#3B82F6', '#F59E0B', '#10B981'];

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors.map(c => c + 'CC'),
          borderColor: colors,
          borderWidth: 1.5,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => ` Conteo: ${item.raw}`
            }
          },
          customDatalabels: {
            totalValue: totalEmpresas
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748B', font: { family: 'Inter', size: 10, weight: '600' } }
          },
          y: {
            grid: { color: '#F1F5F9' },
            min: 0,
            ticks: {
              stepSize: 1,
              precision: 0,
              color: '#64748B',
              font: { family: 'Inter', size: 10 }
            }
          }
        }
      },
      plugins: [customDatalabelsPlugin]
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [deals]);

  return <canvas ref={canvasRef} />;
}

// ── Gráfica 4 (Reordenado): Carreras (Barra Horizontal) ───────────────────────
export function CarretasChart({ deals }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Categorías: No contactados, Contactados, Cotizados, Cerrados y Perdidos
    const noContactados = deals.filter(d => d.stage_id === 's1' && d.status === 'open').length;
    const contactados = deals.filter(d => d.stage_id === 's2' && d.status === 'open').length;
    const cotizados = deals.filter(d => d.stage_id === 's3' && d.status === 'open').length;
    const cerrados = deals.filter(d => d.status === 'won').length;
    const perdidos = deals.filter(d => d.status === 'lost').length;

    const labels = ['No Contactados', 'Contactados', 'Cotizados', 'Cerrados', 'Perdidos'];
    const values = [noContactados, contactados, cotizados, cerrados, perdidos];

    // Semáforo:
    // No Contactados -> Gris (#94A3B8)
    // Contactados -> Azul (#3B82F6)
    // Cotizados -> Amarillo (#F59E0B)
    // Cerrados -> Verde (#10B981)
    // Perdidos -> Rojo (#EF4444)
    const colors = ['#94A3B8', '#3B82F6', '#F59E0B', '#10B981', '#EF4444'];

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors.map(c => c + 'CC'),
          borderColor: colors,
          borderWidth: 1.5,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => ` Conteo: ${item.raw}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: '#F1F5F9' },
            min: 0,
            ticks: {
              stepSize: 1,
              precision: 0,
              color: '#64748B',
              font: { family: 'Inter', size: 10 }
            }
          },
          y: {
            grid: { display: false },
            ticks: {
              color: '#64748B',
              font: { family: 'Inter', size: 10, weight: '600' }
            }
          }
        }
      },
      plugins: [customDatalabelsPlugin]
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [deals]);

  return <canvas ref={canvasRef} />;
}

// ── Gráfico 5: Pipeline Grande (Barra para Kanban View) ───────────────
export function BigPipelineChart({ deals, stages }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const stageMap = {};
    stages.forEach(s => { stageMap[s.id] = { name: s.name, total: 0, color: s.color }; });
    deals.forEach(d => {
      if (stageMap[d.stage_id]) stageMap[d.stage_id].total += d.amount;
    });

    const labels = stages.map(s => s.name);
    const values = stages.map(s => stageMap[s.id].total);
    const colors = stages.map(s => s.color);

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Valor (Q)',
          data: values,
          backgroundColor: colors.map(c => c + 'BB'),
          borderColor: colors,
          borderWidth: 2,
          borderRadius: 12,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: ctx => ' ' + formatCurrency(ctx.raw) }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748B', font: { family: 'Inter', size: 12, weight: '600' } }
          },
          y: {
            grid: { color: '#F1F5F9' },
            ticks: {
              color: '#64748B',
              font: { family: 'Inter', size: 11 },
              callback: v => formatCurrency(v)
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
  }, [deals, stages]);

  return <canvas ref={canvasRef} />;
}

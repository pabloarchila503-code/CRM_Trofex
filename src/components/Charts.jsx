import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

// Helper to format currency
const formatCurrency = (val) => {
  if (val >= 1_000_000) return 'Q' + (val / 1_000_000).toFixed(2) + 'M';
  if (val >= 1_000)     return 'Q' + (val / 1_000).toFixed(1) + 'k';
  return 'Q' + val.toFixed(0);
};

// ── Gráfico 1: Valor por Etapa del Pipeline (Barra) ──────────────────
export function PipelineChart({ deals, stages }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Sum amounts by stage
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
          label: 'Valor del Pipeline (€)',
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

// ── Gráfica 1: Análisis 80/20 (Barra) ────────────────────────────────
export function AnalisisChart({ deals }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const totalClientes = new Set(deals.filter(d => d.status !== 'lost').map(d => d.customer_id)).size;
    const contactados = deals.filter(d => d.stage_id === 's2' || d.stage_id === 's3').length;
    const cotizados = deals.filter(d => d.stage_id === 's3' || d.status === 'won' || d.status === 'lost').length;
    const cerrados = deals.filter(d => d.status === 'won').length;
    const perdidos = deals.filter(d => d.status === 'lost').length;

    const labels = ['Clientes Totales', 'Clientes Contactados', 'Cotizados', 'Cerrados', 'Perdidos'];
    const values = [totalClientes, contactados, cotizados, cerrados, perdidos];
    const colors = ['#FF6D4D', '#3B82F6', '#8B5CF6', '#10B981', '#EF4444'];

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
              label: (ctx) => ` Conteo: ${ctx.raw}`
            }
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
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [deals]);

  return <canvas ref={canvasRef} />;
}

// ── Gráfica 2: Proyectos (Barra) ─────────────────────────────────────
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
    const colors = ['#6366F1', '#3B82F6', '#8B5CF6', '#10B981'];

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
              label: (ctx) => ` Conteo: ${ctx.raw}`
            }
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
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [deals]);

  return <canvas ref={canvasRef} />;
}

// ── Gráfica 3: Prospectos (Barra) ────────────────────────────────────
export function ProspectosChart({ deals }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const totalProspectos = deals.filter(d => d.stage_id === 's1').length;
    const contactados = deals.filter(d => d.stage_id === 's2').length;
    const cotizados = deals.filter(d => d.stage_id === 's3').length;
    const cerrados = deals.filter(d => d.status === 'won').length;
    const perdidos = deals.filter(d => d.status === 'lost').length;

    const labels = ['Total de Prospectos', 'Contactados', 'Cotizados', 'Cerrados', 'Perdidos'];
    const values = [totalProspectos, contactados, cotizados, cerrados, perdidos];
    const colors = ['#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#EF4444'];

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
              label: (ctx) => ` Conteo: ${ctx.raw}`
            }
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
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [deals]);

  return <canvas ref={canvasRef} />;
}

// ── Gráfica 4: Carretas (Barra) ──────────────────────────────────────
export function CarretasChart({ deals }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const totalCarretas = new Set(deals.map(d => d.store_code).filter(Boolean)).size || 1;
    const contactadas = deals.filter(d => d.stage_id === 's2').length;
    const cotizadas = deals.filter(d => d.stage_id === 's3').length;
    const erradas = deals.filter(d => d.status === 'won').length;
    const perdidas = deals.filter(d => d.status === 'lost').length;

    const labels = ['Total de Carretas', 'Contactadas', 'Cotizadas', 'Erradas (Cerradas)', 'Perdidas'];
    const values = [totalCarretas, contactadas, cotizadas, erradas, perdidas];
    const colors = ['#EC4899', '#3B82F6', '#8B5CF6', '#10B981', '#EF4444'];

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
              label: (ctx) => ` Conteo: ${ctx.raw}`
            }
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
      }
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

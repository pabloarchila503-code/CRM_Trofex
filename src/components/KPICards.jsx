import React, { useState, useEffect, useRef } from 'react';

// ── Animación de números ────────────────────────────────────────────────────
function AnimatedNumber({ value, format }) {
  const [cur, setCur] = useState(0);
  const animRef  = useRef(null);
  const startRef = useRef(0);

  useEffect(() => {
    const duration = 600;
    const start    = performance.now();
    const from     = startRef.current;
    const to       = value;

    const tick = (now) => {
      const p    = Math.min((now - start) / duration, 1);
      const ease = p * (2 - p);
      setCur(from + (to - from) * ease);
      if (p < 1) animRef.current = requestAnimationFrame(tick);
      else { setCur(to); startRef.current = to; }
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [value]);

  return <>{format(cur)}</>;
}

// ── Definición de las 4 Áreas ───────────────────────────────────────────────
const AREAS = [
  {
    key:    'prospecciones',
    label:  'Prospecciones',
    icon:   'fas fa-funnel-dollar',
    color:  '#94A3B8',
    accent: 'rgba(148,163,184,0.12)',
    fields: ['prospectados', 'contactados', 'cotizados', 'cerrados', 'perdidos'],
    labels: ['Prospectados', 'Contactados', 'Cotizados', 'Cerrados', 'Perdidos'],
  },
  {
    key:    '8020',
    label:  'Análisis 80/20',
    icon:   'fas fa-chart-pie',
    color:  '#3B82F6',
    accent: 'rgba(59,130,246,0.10)',
    fields: ['noContactados', 'contactados', 'cotizados', 'cerrados', 'perdidos'],
    labels: ['No Contactados', 'Contactados', 'Cotizados', 'Cerrados', 'Perdidos'],
  },
  {
    key:    'proyectos',
    label:  'Proyectos',
    icon:   'fas fa-building',
    color:  '#F59E0B',
    accent: 'rgba(245,158,11,0.10)',
    fields: ['empresas', 'contactados', 'cotizados', 'cerrados', 'perdidos'],
    labels: ['Empresas', 'Contactados', 'Cotizados', 'Cerrados', 'Perdidos'],
  },
  {
    key:    'carreras',
    label:  'Carreras',
    icon:   'fas fa-flag-checkered',
    color:  '#EC4899',
    accent: 'rgba(236,72,153,0.10)',
    fields: ['noContactados', 'contactados', 'cotizados', 'cerrados', 'perdidos'],
    labels: ['No Contactados', 'Contactados', 'Cotizados', 'Cerrados', 'Perdidos'],
  },
];

const fmt = (val) => Math.round(val).toLocaleString('es-GT');

// ── KPI Card individual ─────────────────────────────────────────────────────
function AreaCard({ area, summary }) {
  const total = Object.values(summary).reduce((a, b) => a + b, 0);

  return (
    <div className="kpi-card" style={{ padding: '18px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: area.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className={area.icon} style={{ color: area.color, fontSize: '14px' }} />
          </div>
          <span className="kpi-label" style={{ fontSize: '12px' }}>{area.label}</span>
        </div>
        <div style={{
          background: area.accent, color: area.color,
          padding: '4px 10px', borderRadius: '20px',
          fontSize: '15px', fontWeight: '800',
        }}>
          <AnimatedNumber value={total} format={fmt} />
        </div>
      </div>

      {/* Detalle de campos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {area.fields.map((f, i) => {
          const val  = summary[f] || 0;
          const pct  = total > 0 ? (val / total) * 100 : 0;
          const barColors = ['#94A3B8', '#3B82F6', '#F59E0B', '#10B981', '#EF4444'];
          const barColor  = barColors[i] || area.color;
          return (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', width: '90px', flexShrink: 0 }}>
                {area.labels[i]}
              </span>
              <div style={{ flex: 1, height: '4px', background: '#F1F5F9', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${Math.min(pct, 100)}%`,
                  background: barColor, borderRadius: '2px',
                  transition: 'width 0.4s ease-out',
                }} />
              </div>
              <span style={{ fontSize: '10px', fontWeight: '700', color: barColor, width: '28px', textAlign: 'right' }}>
                {val}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Componente principal ────────────────────────────────────────────────────
export default function KPICards({ areaSummary }) {
  return (
    <div className="kpis-row">
      {AREAS.map(area => (
        <AreaCard key={area.key} area={area} summary={areaSummary[area.key] || {}} />
      ))}
    </div>
  );
}

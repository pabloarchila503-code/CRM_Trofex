import React, { useState, useEffect, useRef } from 'react';

// ── Animación de números ────────────────────────────────────────────────────
function AnimatedNumber({ value, format }) {
  const [cur, setCur] = useState(0);
  const animRef  = useRef(null);
  const startRef = useRef(0);

  useEffect(() => {
    const duration = 700;
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
    key:         'prospecciones',
    label:       'PROSPECCIONES',
    icon:        'fas fa-funnel-dollar',
    color:       '#94A3B8',
    colorLight:  'rgba(148,163,184,0.13)',
    borderColor: 'rgba(148,163,184,0.45)',
    gradientFrom:'#F8FAFC',
  },
  {
    key:         '8020',
    label:       'ANÁLISIS 80/20',
    icon:        'fas fa-chart-pie',
    color:       '#3B82F6',
    colorLight:  'rgba(59,130,246,0.10)',
    borderColor: 'rgba(59,130,246,0.35)',
    gradientFrom:'#EFF6FF',
  },
  {
    key:         'proyectos',
    label:       'PROYECTOS',
    icon:        'fas fa-building',
    color:       '#F59E0B',
    colorLight:  'rgba(245,158,11,0.10)',
    borderColor: 'rgba(245,158,11,0.40)',
    gradientFrom:'#FFFBEB',
  },
  {
    key:         'carreras',
    label:       'CARRERAS',
    icon:        'fas fa-flag-checkered',
    color:       '#EC4899',
    colorLight:  'rgba(236,72,153,0.10)',
    borderColor: 'rgba(236,72,153,0.35)',
    gradientFrom:'#FDF2F8',
  },
];

const fmt = (val) => Math.round(val).toLocaleString('es-GT');

// ── Tarjeta KPI Ejecutiva ────────────────────────────────────────────────────
function ExecCard({ area, total }) {
  return (
    <div
      className="kpi-card"
      style={{
        padding: '22px 20px',
        background: `linear-gradient(135deg, ${area.gradientFrom} 0%, #ffffff 100%)`,
        border: `1.5px solid ${area.borderColor}`,
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 2px 12px rgba(30,41,59,0.07)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        textAlign: 'center',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = `0 8px 24px ${area.colorLight.replace('0.10','0.22')}`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(30,41,59,0.07)';
      }}
    >
      {/* Ícono */}
      <div style={{
        width: '48px', height: '48px',
        borderRadius: '14px',
        background: area.colorLight,
        border: `1.5px solid ${area.borderColor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <i className={area.icon} style={{ color: area.color, fontSize: '20px' }} />
      </div>

      {/* Título */}
      <span style={{
        fontSize: '10px',
        fontWeight: '800',
        letterSpacing: '1.2px',
        textTransform: 'uppercase',
        color: area.color,
      }}>
        {area.label}
      </span>

      {/* Número Total en grande */}
      <div style={{
        fontSize: '40px',
        fontWeight: '900',
        color: 'var(--text-primary)',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}>
        <AnimatedNumber value={total} format={fmt} />
      </div>

      {/* Sub-label */}
      <span style={{
        fontSize: '10px',
        color: 'var(--text-muted)',
        fontWeight: '500',
      }}>
        registros totales
      </span>
    </div>
  );
}

// ── Componente principal ────────────────────────────────────────────────────
export default function KPICards({ areaSummary }) {
  return (
    <div className="kpis-row">
      {AREAS.map(area => {
        const summary = areaSummary[area.key] || {};
        const total   = Object.values(summary).reduce((a, b) => a + b, 0);
        return <ExecCard key={area.key} area={area} total={total} />;
      })}
    </div>
  );
}

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
    sublabel:    'Total de Prospecciones',
    icon:        'fas fa-funnel-dollar',
    color:       '#94A3B8',
    colorLight:  'rgba(148,163,184,0.13)',
    borderColor: 'rgba(148,163,184,0.45)',
    gradientFrom:'#F8FAFC',
  },
  {
    key:         '8020',
    label:       'ANÁLISIS 80/20',
    sublabel:    'Total de Registros',
    icon:        'fas fa-chart-pie',
    color:       '#3B82F6',
    colorLight:  'rgba(59,130,246,0.10)',
    borderColor: 'rgba(59,130,246,0.35)',
    gradientFrom:'#EFF6FF',
  },
  {
    key:         'proyectos',
    label:       'PROYECTOS',
    sublabel:    'Total de Empresas',
    icon:        'fas fa-building',
    color:       '#F59E0B',
    colorLight:  'rgba(245,158,11,0.10)',
    borderColor: 'rgba(245,158,11,0.40)',
    gradientFrom:'#FFFBEB',
  },
  {
    key:         'carreras',
    label:       'CARRERAS',
    sublabel:    'Total de Registros',
    icon:        'fas fa-flag-checkered',
    color:       '#EC4899',
    colorLight:  'rgba(236,72,153,0.10)',
    borderColor: 'rgba(236,72,153,0.35)',
    gradientFrom:'#FDF2F8',
  },
];

const fmt = (val) => Math.round(val).toLocaleString('es-GT');

// ── Color del badge de efectividad ──────────────────────────────────────────
const efectividadColor = (pct) => {
  if (pct >= 50) return { bg: 'rgba(16,185,129,0.12)', text: '#059669' };  // Verde
  if (pct >= 25) return { bg: 'rgba(245,158,11,0.12)', text: '#B45309' };  // Ámbar
  return           { bg: 'rgba(239,68,68,0.12)',  text: '#DC2626' };        // Rojo
};

// ── Tarjeta KPI Ejecutiva ────────────────────────────────────────────────────
function ExecCard({ area, summary }) {
  const total       = summary.total       || 0;
  const efectividad = summary.efectividad ?? 0;
  const { bg, text } = efectividadColor(efectividad);

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
        gap: '8px',
        textAlign: 'center',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = `0 8px 28px ${area.colorLight.replace('0.13','0.28').replace('0.10','0.22')}`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(30,41,59,0.07)';
      }}
    >
      {/* Ícono */}
      <div style={{
        width: '46px', height: '46px',
        borderRadius: '13px',
        background: area.colorLight,
        border: `1.5px solid ${area.borderColor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <i className={area.icon} style={{ color: area.color, fontSize: '19px' }} />
      </div>

      {/* Título del área */}
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
        fontSize: '42px',
        fontWeight: '900',
        color: 'var(--text-primary)',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}>
        <AnimatedNumber value={total} format={fmt} />
      </div>

      {/* Sub-label discreto */}
      <span style={{
        fontSize: '10px',
        color: 'var(--text-muted)',
        fontWeight: '500',
        marginTop: '-4px',
      }}>
        {area.sublabel}
      </span>

      {/* ── Badge de Efectividad ── */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 12px',
        borderRadius: '20px',
        background: bg,
        marginTop: '2px',
      }}>
        <i
          className={`fas fa-${efectividad >= 25 ? 'arrow-trend-up' : 'arrow-trend-down'}`}
          style={{ fontSize: '10px', color: text }}
        />
        <span style={{
          fontSize: '11px',
          fontWeight: '800',
          color: text,
          letterSpacing: '0.3px',
        }}>
          {efectividad}% de efectividad
        </span>
      </div>
    </div>
  );
}

// ── Componente principal ────────────────────────────────────────────────────
export default function KPICards({ areaSummary }) {
  return (
    <div className="kpis-row">
      {AREAS.map(area => (
        <ExecCard
          key={area.key}
          area={area}
          summary={areaSummary[area.key] || { total: 0, cerrados: 0, efectividad: 0 }}
        />
      ))}
    </div>
  );
}

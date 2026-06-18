import { useState, useEffect, useRef } from 'react';

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

// ── Definición de las 5 Etapas del Embudo ──────────────────────────────────────
const STAGES = [
  {
    key:         'prospectados',
    label:       'PROSPECTADOS',
    sublabel:    'Total Prospectados',
    icon:        'fas fa-users',
    color:       '#94A3B8', // Gris
    colorLight:  'rgba(148,163,184,0.13)',
    borderColor: 'rgba(148,163,184,0.45)',
    gradientFrom:'#F8FAFC',
  },
  {
    key:         'contactados',
    label:       'CONTACTADOS',
    sublabel:    'Total Contactados',
    icon:        'fas fa-comments',
    color:       '#3B82F6', // Azul
    colorLight:  'rgba(59,130,246,0.10)',
    borderColor: 'rgba(59,130,246,0.30)',
    gradientFrom:'#EFF6FF',
  },
  {
    key:         'cotizados',
    label:       'COTIZADOS',
    sublabel:    'Total Cotizados',
    icon:        'fas fa-file-invoice-dollar',
    color:       '#F59E0B', // Amarillo
    colorLight:  'rgba(245,158,11,0.10)',
    borderColor: 'rgba(245,158,11,0.40)',
    gradientFrom:'#FFFBEB',
  },
  {
    key:         'cerrados',
    label:       'CERRADOS',
    sublabel:    'Total Cerrados',
    icon:        'fas fa-handshake',
    color:       '#10B981', // Verde
    colorLight:  'rgba(16,185,129,0.10)',
    borderColor: 'rgba(16,185,129,0.35)',
    gradientFrom:'#ECFDF5',
  },
  {
    key:         'perdidos',
    label:       'PERDIDOS',
    sublabel:    'Total Perdidos',
    icon:        'fas fa-ban',
    color:       '#EF4444', // Rojo
    colorLight:  'rgba(239,68,68,0.10)',
    borderColor: 'rgba(239,68,68,0.30)',
    gradientFrom:'#FEF2F2',
  },
];

const fmt = (val) => Math.round(val).toLocaleString('es-GT');

// ── Tarjeta KPI Ejecutiva (Etapa del Embudo) ──────────────────────────────────
function ExecCard({ stage, val, badgeText, badgeBg, badgeTextColor, isPositive }) {
  return (
    <div
      className="kpi-card"
      style={{
        padding: '22px 20px',
        background: `linear-gradient(135deg, ${stage.gradientFrom} 0%, #ffffff 100%)`,
        border: `1.5px solid ${stage.borderColor}`,
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
        e.currentTarget.style.boxShadow = `0 8px 28px ${stage.colorLight.replace('0.13','0.28').replace('0.10','0.22')}`;
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
        background: stage.colorLight,
        border: `1.5px solid ${stage.borderColor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <i className={stage.icon} style={{ color: stage.color, fontSize: '19px' }} />
      </div>

      {/* Título de la etapa */}
      <span style={{
        fontSize: '10px',
        fontWeight: '800',
        letterSpacing: '1.2px',
        textTransform: 'uppercase',
        color: stage.color,
      }}>
        {stage.label}
      </span>

      {/* Número Total en grande */}
      <div style={{
        fontSize: '42px',
        fontWeight: '900',
        color: 'var(--text-primary)',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}>
        <AnimatedNumber value={val} format={fmt} />
      </div>

      {/* Sub-label discreto */}
      <span style={{
        fontSize: '10px',
        color: 'var(--text-muted)',
        fontWeight: '500',
        marginTop: '-4px',
      }}>
        {stage.sublabel}
      </span>

      {/* ── Badge de Conversión / Avance ── */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 12px',
        borderRadius: '20px',
        background: badgeBg,
        marginTop: '2px',
      }}>
        <i
          className={`fas fa-${isPositive ? 'arrow-trend-up' : 'arrow-trend-down'}`}
          style={{ fontSize: '10px', color: badgeTextColor }}
        />
        <span style={{
          fontSize: '11px',
          fontWeight: '800',
          color: badgeTextColor,
          letterSpacing: '0.3px',
        }}>
          {badgeText}
        </span>
      </div>
    </div>
  );
}

// ── Componente principal ────────────────────────────────────────────────────
export default function KPICards({ globalSums = {} }) {
  const prosp = globalSums.prospectados || 0;

  return (
    <div className="kpis-row">
      {STAGES.map(stage => {
        const val = globalSums[stage.key] || 0;
        const pct = prosp > 0 ? Math.round((val / prosp) * 100) : 0;
        
        let badgeText = '';
        let badgeColorLight = stage.colorLight;
        let badgeTextColor = stage.color;

        if (stage.key === 'prospectados') {
          badgeText = '100% del embudo';
          badgeTextColor = '#64748B';
          badgeColorLight = 'rgba(148,163,184,0.12)';
        } else if (stage.key === 'contactados') {
          badgeText = `${pct}% de contacto`;
          badgeTextColor = '#2563EB';
          badgeColorLight = 'rgba(59,130,246,0.12)';
        } else if (stage.key === 'cotizados') {
          badgeText = `${pct}% de cotización`;
          badgeTextColor = '#B45309';
          badgeColorLight = 'rgba(245,158,11,0.12)';
        } else if (stage.key === 'cerrados') {
          badgeText = `${pct}% de efectividad`;
          badgeTextColor = '#059669';
          badgeColorLight = 'rgba(16,185,129,0.12)';
        } else if (stage.key === 'perdidos') {
          badgeText = `${pct}% de pérdida`;
          badgeTextColor = '#DC2626';
          badgeColorLight = 'rgba(239,68,68,0.12)';
        }

        return (
          <ExecCard
            key={stage.key}
            stage={stage}
            val={val}
            badgeText={badgeText}
            badgeBg={badgeColorLight}
            badgeTextColor={badgeTextColor}
            isPositive={stage.key !== 'perdidos'}
          />
        );
      })}
    </div>
  );
}

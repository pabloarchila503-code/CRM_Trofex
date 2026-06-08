import React, { useState, useEffect, useRef } from 'react';

function AnimatedNumber({ value, format }) {
  const [currentValue, setCurrentValue] = useState(0);
  const animationRef = useRef(null);
  const startValueRef = useRef(0);
  const endValueRef = useRef(value);

  useEffect(() => {
    const duration = 600; // Animation duration in ms
    const startTime = performance.now();
    const startVal = startValueRef.current;
    const endVal = value;
    endValueRef.current = endVal;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function: Ease Out Quad
      const ease = progress * (2 - progress);
      const val = startVal + (endVal - startVal) * ease;
      setCurrentValue(val);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentValue(endVal);
        startValueRef.current = endVal;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [value]);

  return <>{format(currentValue)}</>;
}

export default function KPICards({ kpis }) {
  const { totalCustomers, totalContacted, totalQuotes, montoCotizacion, trends } = kpis;

  const formatCurrency = (val) => {
    return 'Q' + Math.round(val).toLocaleString('es-GT');
  };

  const formatInteger = (val) => Math.round(val).toString();
  const formatPercent = (val) => val.toFixed(1) + '%';

  return (
    <div className="kpis-row">
      {/* Total de Clientes */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-label">Total de Clientes</span>
          <i className="fas fa-users" style={{ color: 'var(--accent-blue)', fontSize: '16px' }}></i>
        </div>
        <div className="kpi-value">
          <AnimatedNumber value={totalCustomers} format={formatInteger} />
        </div>
        <div className="kpi-footer">
          <span className={`kpi-trend ${trends.customers >= 0 ? 'positive' : 'negative'}`}>
            <i className={`fas fa-arrow-${trends.customers >= 0 ? 'up' : 'down'}`}></i>{' '}
            {Math.abs(trends.customers).toFixed(0)}%
          </span>
          <span className="kpi-sub">vs. mes anterior</span>
        </div>
      </div>

      {/* Total Contactados */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-label">Total Contactados</span>
          <i className="fas fa-comments" style={{ color: 'var(--accent-orange)', fontSize: '16px' }}></i>
        </div>
        <div className="kpi-value">
          <AnimatedNumber value={totalContacted} format={formatInteger} />
        </div>
        <div className="kpi-footer">
          <span className={`kpi-trend ${trends.contacted >= 0 ? 'positive' : 'negative'}`}>
            <i className={`fas fa-arrow-${trends.contacted >= 0 ? 'up' : 'down'}`}></i>{' '}
            {Math.abs(trends.contacted).toFixed(0)}%
          </span>
          <span className="kpi-sub">vs. mes anterior</span>
        </div>
      </div>

      {/* Cotizaciones Generadas */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-label">Cotizaciones Generadas</span>
          <i className="fas fa-file-invoice-dollar" style={{ color: 'var(--accent-green)', fontSize: '16px' }}></i>
        </div>
        <div className="kpi-value">
          <AnimatedNumber value={totalQuotes} format={formatInteger} />
        </div>
        <div className="kpi-footer">
          <span className={`kpi-trend ${trends.quotes >= 0 ? 'positive' : 'negative'}`}>
            <i className={`fas fa-arrow-${trends.quotes >= 0 ? 'up' : 'down'}`}></i>{' '}
            {Math.abs(trends.quotes).toFixed(0)}%
          </span>
          <span className="kpi-sub">vs. mes anterior</span>
        </div>
      </div>

      {/* Monto de Cotización */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-label">Monto de Cotización</span>
          <i className="fas fa-coins" style={{ color: 'var(--accent-coral)', fontSize: '16px' }}></i>
        </div>
        <div className="kpi-value">
          <AnimatedNumber value={montoCotizacion} format={formatCurrency} />
        </div>
        <div className="kpi-footer">
          <span className={`kpi-trend ${trends.monto >= 0 ? 'positive' : 'negative'}`}>
            <i className={`fas fa-arrow-${trends.monto >= 0 ? 'up' : 'down'}`}></i>{' '}
            {Math.abs(trends.monto).toFixed(0)}%
          </span>
          <span className="kpi-sub">vs. mes anterior</span>
        </div>
      </div>
    </div>
  );
}

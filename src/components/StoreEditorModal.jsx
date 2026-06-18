import { useState, useEffect } from 'react';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function StoreEditorModal({ isOpen, onClose, data, onSave, userRole, activeStore }) {
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(5); // Default to June (idx 5)
  const [localStoreData, setLocalStoreData] = useState([]);

  // Load data for the selected month when modal opens or month changes
  useEffect(() => {
    if (isOpen && data && data[selectedMonthIdx]) {
      let monthData = data[selectedMonthIdx];
      if (userRole === 'store') {
        monthData = monthData.filter(item => item.store === activeStore);
      }
      // Create a deep copy of the selected month's data
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalStoreData(JSON.parse(JSON.stringify(monthData)));
    }
  }, [isOpen, selectedMonthIdx, data, userRole, activeStore]);

  const handleInputChange = (storeName, field, value) => {
    const numericValue = value === '' ? 0 : parseFloat(value);
    setLocalStoreData(prev => prev.map(item => {
      if (item.store === storeName) {
        return { ...item, [field]: isNaN(numericValue) ? 0 : numericValue };
      }
      return item;
    }));
  };

  const handleClearAll = () => {
    if (window.confirm(`¿Estás seguro de que deseas borrar todas las ventas y metas para el mes de ${MONTHS[selectedMonthIdx]}?`)) {
      setLocalStoreData(prev => prev.map(item => ({ ...item, venta: 0, meta: 0 })));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSave(selectedMonthIdx, localStoreData);
  };  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay active"
      role="dialog"
      aria-modal="true"
      aria-labelledby="store-modal-title"
      onClick={(e) => {
        if (e.target.className.includes('modal-overlay')) onClose();
      }}
    >
      <div className="modal-box" style={{ 
        maxWidth: '560px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div className="modal-head" style={{ flexShrink: 0 }}>
          <h3 id="store-modal-title">Editar Metas y Ventas</h3>
          <button className="modal-close" aria-label="Cerrar modal" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSave} style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'hidden'
        }}>
          <div className="modal-body" style={{ 
            flex: 1,
            padding: '20px 24px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Month Selector */}
            <div className="form-group" style={{ alignItems: 'center', marginBottom: '18px', flexShrink: 0 }}>
              <label className="form-label" style={{ marginBottom: '8px' }}>Selecciona el Mes:</label>
              <select
                className="form-control"
                value={selectedMonthIdx}
                onChange={(e) => setSelectedMonthIdx(parseInt(e.target.value))}
                style={{ width: '240px', textAlign: 'center' }}
              >
                {MONTHS.map((m, idx) => (
                  <option key={idx} value={idx}>{m}</option>
                ))}
              </select>
            </div>

            {/* Stores Input Table wrapped in modal-form-wrapper */}
            <div className="modal-form-wrapper" style={{ flex: 1 }}>
              <div className="table-responsive" style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <table className="deals-table" style={{ margin: 0 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-body)' }}>
                      <th style={{ padding: '8px 12px', fontSize: '10px' }}>TX</th>
                      <th style={{ padding: '8px 12px', fontSize: '10px', textAlign: 'right' }}>VENTA</th>
                      <th style={{ padding: '8px 12px', fontSize: '10px', textAlign: 'right' }}>META</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localStoreData.map((item) => (
                      <tr key={item.store} style={{ borderBottom: '1px solid var(--border-card)' }}>
                        <td style={{ padding: '8px 12px', fontWeight: '700', fontSize: '12px' }}>{item.store}</td>
                        <td style={{ padding: '6px 12px' }}>
                          <input
                            type="number"
                            className="form-control"
                            value={item.venta === 0 ? '' : item.venta}
                            placeholder="0"
                            onChange={(e) => handleInputChange(item.store, 'venta', e.target.value)}
                            style={{ width: '100%', textAlign: 'right', padding: '6px 10px', background: 'var(--bg-body)' }}
                            min="0"
                          />
                        </td>
                        <td style={{ padding: '6px 12px' }}>
                          <input
                            type="number"
                            className="form-control"
                            value={item.meta === 0 ? '' : item.meta}
                            placeholder="0"
                            onChange={(e) => handleInputChange(item.store, 'meta', e.target.value)}
                            style={{ width: '100%', textAlign: 'right', padding: '6px 10px', background: 'var(--bg-body)' }}
                            min="0"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="modal-foot" style={{ justifyContent: 'space-between', flexShrink: 0 }}>
            <button
              type="button"
              className="topbar-btn btn-outline"
              onClick={handleClearAll}
              style={{ color: 'var(--accent-red)', borderColor: 'var(--accent-red)' }}
            >
              <i className="fas fa-trash-alt"></i> Borrar Todo
            </button>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="topbar-btn btn-primary" style={{ background: 'linear-gradient(135deg, var(--accent-coral), #FF9070)' }}>
                Guarda
              </button>
              <button type="button" className="topbar-btn btn-outline" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

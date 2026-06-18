/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';

export default function DealModal({ isOpen, dealId, deals, stages, users, customers, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [stageId, setStageId] = useState('');
  const [status, setStatus] = useState('open');
  const [amount, setAmount] = useState('');

  // Reps list
  const reps = users.filter(u => u.role === 'sales_rep');

  useEffect(() => {
    if (isOpen) {
      if (dealId) {
        // Edit mode
        const deal = deals.find(d => d.id === dealId);
        if (deal) {
          setTitle(deal.title || '');
          setCustomerId(deal.customer_id || (customers[0]?.id || ''));
          setOwnerId(deal.owner_id || (reps[0]?.id || ''));
          setStageId(deal.stage_id || (stages[0]?.id || ''));
          setStatus(deal.status || 'open');
          setAmount(deal.amount || '');
        }
      } else {
        // Add mode - Reset fields
        setTitle('');
        setCustomerId(customers[0]?.id || '');
        setOwnerId(reps[0]?.id || '');
        setStageId(stages[0]?.id || '');
        setStatus('open');
        setAmount('');
      }
    }
  }, [isOpen, dealId, deals, customers, reps, stages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !customerId || !ownerId || !stageId || !amount) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Por favor, ingresa un importe válido mayor a 0.');
      return;
    }

    onSave({
      id: dealId, // Can be undefined/null for new
      title: title.trim(),
      customer_id: customerId,
      owner_id: ownerId,
      stage_id: stageId,
      status: status,
      amount: numericAmount
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className={`modal-overlay ${isOpen ? 'active' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target.className.includes('modal-overlay')) onClose();
      }}
    >
      <div className="modal-box">
        <div className="modal-head">
          <h3 id="modal-title">{dealId ? 'Editar Oportunidad' : 'Nueva Oportunidad'}</h3>
          <button className="modal-close" aria-label="Cerrar modal" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} novalidate>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label" htmlFor="modal-title-input">
                Título de la Oportunidad
              </label>
              <input
                type="text"
                id="modal-title-input"
                className="form-control"
                placeholder="Ej: Renovación Anual Licencias"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="modal-row">
              <div className="form-group">
                <label className="form-label" htmlFor="modal-customer">
                  Empresa Cliente
                </label>
                <select
                  id="modal-customer"
                  className="form-control"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.company_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="modal-owner">
                  Responsable
                </label>
                <select
                  id="modal-owner"
                  className="form-control"
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  required
                >
                  {reps.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-row">
              <div className="form-group">
                <label className="form-label" htmlFor="modal-stage">
                  Etapa del Pipeline
                </label>
                <select
                  id="modal-stage"
                  className="form-control"
                  value={stageId}
                  onChange={(e) => setStageId(e.target.value)}
                  required
                >
                  {stages.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="modal-status">
                  Estado
                </label>
                <select
                  id="modal-status"
                  className="form-control"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  required
                >
                  <option value="open">Abierto</option>
                  <option value="won">Ganado (Closed Won)</option>
                  <option value="lost">Perdido (Closed Lost)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="modal-amount">
                Importe (Q)
              </label>
              <input
                type="number"
                id="modal-amount"
                className="form-control"
                placeholder="Ej: 25000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                step="any"
                required
              />
            </div>
          </div>

          <div className="modal-foot">
            <button type="button" className="topbar-btn btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="topbar-btn btn-primary">
              <i className="fas fa-save"></i> Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

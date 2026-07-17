export default function ESlipModal({ runner, overallRank, catRank, onClose }) {
  const fmtTime = (ts) => ts ? new Date(ts).toTimeString().slice(0, 8) : '—';
  const fmtDur = (ms) => {
    if (ms == null) return '—';
    const s = Math.floor(ms / 1e3);
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor(s % 3600 / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${ss}`;
  };

  return (
    <div className="modal-bg open" onClick={(e) => { if(e.target === e.currentTarget) onClose() }}>
      <div className="eslip">
        <div className="head">
          <div className="logo-mark" style={{margin: '0 auto 8px'}}>TT</div>
          <b>TrailTime</b><br/>Official e-Slip
        </div>
        
        <div className="row">
          <span>Name</span>
          <b style={{textAlign: 'right'}}>{runner.name}</b>
        </div>
        <div className="row">
          <span>BIB</span>
          <b>{runner.bib}</b>
        </div>
        <div className="row">
          <span>Category</span>
          <b>{runner.cat}</b>
        </div>
        <div className="row">
          <span>Gender/Age</span>
          <b>{runner.gender} · {runner.age}</b>
        </div>
        
        <div className="hr"></div>
        
        <div className="row">
          <span>Start</span>
          <span>{fmtTime(runner.checkin)}</span>
        </div>
        {Object.entries(runner.cps).map(([cp, ts]) => (
          <div className="row" key={cp}>
            <span>{cp}</span>
            <span>{fmtTime(ts)}</span>
          </div>
        ))}
        <div className="row">
          <span>Finish</span>
          <span>{fmtTime(runner.finish)}</span>
        </div>
        
        <div className="hr"></div>
        
        <div className="rank">
          <div style={{color: 'var(--ink-2)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px'}}>Total Time</div>
          <div style={{fontSize: '24px'}}>{fmtDur(runner.finish - runner.checkin)}</div>
        </div>
        
        <div style={{display: 'flex', gap: '10px', marginTop: '12px'}}>
          <div style={{flex: 1, background: 'var(--bg-soft)', padding: '10px', borderRadius: '10px', textAlign: 'center'}}>
            <div style={{fontSize: '11px', color: 'var(--ink-2)'}}>Overall</div>
            <div style={{fontSize: '18px', fontWeight: 600}}>#{overallRank}</div>
          </div>
          <div style={{flex: 1, background: 'var(--bg-soft)', padding: '10px', borderRadius: '10px', textAlign: 'center'}}>
            <div style={{fontSize: '11px', color: 'var(--ink-2)'}}>Category</div>
            <div style={{fontSize: '18px', fontWeight: 600}}>#{catRank}</div>
          </div>
        </div>
        
        <div className="foot">Powered by TrailTime System</div>
        
        <div className="actions">
          <button className="btn btn-dark" style={{width: '100%'}} onClick={onClose}>ปิดหน้าต่าง</button>
        </div>
      </div>
    </div>
  );
}

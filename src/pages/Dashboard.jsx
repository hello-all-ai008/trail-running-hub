import { useRace, CATEGORIES, CHECKPOINTS } from '../context/RaceContext';

export default function Dashboard() {
  const { runners, getCpName } = useRace();
  
  const total = runners.length;
  const ci = runners.filter(r => r.checkin).length;
  const onCourse = runners.filter(r => r.checkin && !r.finish).length;
  const fin = runners.filter(r => r.finish).length;

  const fmtTime = (ts) => {
    if (!ts) return '—';
    return new Date(ts).toTimeString().slice(0, 8);
  };

  const latestFinishers = runners
    .filter(r => r.finish)
    .sort((a, b) => b.finish - a.finish)
    .slice(0, 5);

  return (
    <div className="page active">
      <div className="page-head">
        <span className="eyebrow">Live Overview</span>
        <h1>แดชบอร์ด</h1>
        <p>สรุปสถานะการแข่งขันแบบเรียลไทม์ อัปเดตทันทีเมื่อมีการสแกน</p>
      </div>
      
      <div className="grid grid-4">
        <div className="card card-pad stat">
          <span className="eyebrow">ผู้สมัครทั้งหมด</span>
          <div className="num">{total}</div>
          <div className="sub">Registered runners</div>
        </div>
        <div className="card card-pad stat">
          <span className="eyebrow">Check-in แล้ว</span>
          <div className="num">{ci}</div>
          <div className="sub">{total ? Math.round(ci/total*100) : 0}% ของผู้สมัคร</div>
        </div>
        <div className="card card-pad stat">
          <span className="eyebrow">อยู่ในเส้นทาง</span>
          <div className="num">{onCourse}</div>
          <div className="sub">On course</div>
        </div>
        <div className="card card-pad stat">
          <span className="eyebrow">เข้าเส้นชัย</span>
          <div className="num">{fin}</div>
          <div className="sub">{ci ? Math.round(fin/ci*100) : 0}% ของผู้เริ่มวิ่ง</div>
        </div>
      </div>

      <div className="grid grid-2" style={{marginTop: '14px'}}>
        <div className="card card-pad">
          <span className="eyebrow">Progress by Category</span>
          <div style={{marginTop: '12px'}}>
            {CATEGORIES.map(c => {
              const grp = runners.filter(r => r.cat === c);
              const f = grp.filter(r => r.finish).length;
              const pct = grp.length ? Math.round(f/grp.length*100) : 0;
              return (
                <div className="bar-row" key={c}>
                  <b className="mono" style={{textAlign: 'left', color: 'var(--ink)'}}>{c}</b>
                  <div className="bar-track">
                    <div className="bar-fill" style={{width: `${pct}%`}}></div>
                  </div>
                  <span className="mono">{f}/{grp.length} จบ</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card card-pad">
          <span className="eyebrow">Runner Flow</span>
          <div className="cp-flow" style={{marginTop: '14px'}}>
            <div className="cp-node">
              <span className="eyebrow" style={{color: 'var(--start)'}}>Start</span>
              <div className="num">{runners.filter(r => r.checkin).length}</div>
            </div>
            {CHECKPOINTS.map(c => (
              <div className="cp-node" key={c.id}>
                <span className="eyebrow" style={{color: 'var(--cp)'}}>{c.id}</span>
                <div className="num">{runners.filter(r => r.cps[c.id]).length}</div>
              </div>
            ))}
            <div className="cp-node">
              <span className="eyebrow" style={{color: 'var(--finish)'}}>Finish</span>
              <div className="num">{fin}</div>
            </div>
          </div>

          <span className="eyebrow" style={{display: 'block', marginTop: '22px'}}>Latest Finishers</span>
          <div style={{marginTop: '8px', fontSize: '13.5px'}}>
            {latestFinishers.length > 0 ? (
              <table style={{width: '100%'}}>
                <tbody>
                  {latestFinishers.map(r => (
                    <tr key={r.bib}>
                      <td style={{padding: '6px 0', border: 'none'}}>
                        <span className="mono" style={{fontWeight: 600, marginRight: '8px'}}>{r.bib}</span>
                        {r.name}
                      </td>
                      <td style={{padding: '6px 0', border: 'none', textAlign: 'right', color: 'var(--ink-2)'}}>
                        {fmtTime(r.finish)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{color: 'var(--ink-2)'}}>ยังไม่มีผู้เข้าเส้นชัย</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

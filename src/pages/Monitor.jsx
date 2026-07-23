import { useMemo, useState } from 'react';
import { useRace } from '../context/RaceContext';
import { Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Monitor() {
  const { scanLog, runners } = useRace();
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Get all possible groups first
  const allGroups = useMemo(() => {
    const groups = new Set();
    runners.forEach(r => {
      groups.add(`${r.cat} | ${r.age}`);
    });
    return Array.from(groups).sort();
  }, [runners]);

  const groupedLogs = useMemo(() => {
    const runnerMap = new Map();
    runners.forEach(r => {
      runnerMap.set(r.bib, r);
    });

    const groups = {};
    
    scanLog.forEach(log => {
      const runner = runnerMap.get(log.bib);
      if (runner) {
        const groupKey = `${runner.cat} | ${runner.age}`;
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(log);
      }
    });

    return Object.keys(groups)
      .sort()
      .map(key => ({
        key,
        logs: groups[key].slice(0, 10)
      }));
  }, [scanLog, runners]);

  // Filter visible groups
  const visibleGroups = useMemo(() => {
    if (selectedKeys.size === 0) return groupedLogs;
    return groupedLogs.filter(g => selectedKeys.has(g.key));
  }, [groupedLogs, selectedKeys]);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  const toggleKey = (key) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const fmtTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toTimeString().slice(0, 8);
  };

  return (
    <div className="page active">
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <span className="eyebrow">Real-time</span>
          <h1>Category Monitor</h1>
          <p>ติดตามความเคลื่อนไหวของนักวิ่งแยกตามรุ่นและช่วงอายุ (แสดง 10 รายการล่าสุด)</p>
        </div>
        {!isSidebarOpen && (
          <button className="btn btn-secondary" onClick={toggleSidebar} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} /> Filter
          </button>
        )}
      </div>

      <div className="monitor-layout">
        {/* Filter Sidebar */}
        <div className={`monitor-sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
          <div className="monitor-sidebar-inner card">
            <div className="monitor-sidebar-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                <Filter size={16} />
                <span>ตัวกรอง (Filter)</span>
              </div>
              <button className="icon-btn" onClick={toggleSidebar} title="ซ่อนแถบตัวกรอง">
                <ChevronLeft size={20} />
              </button>
            </div>
            <div className="monitor-sidebar-body">
              <div style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--ink-2)' }}>
                เลือกรายการเพื่อดูเฉพาะกลุ่ม (หากไม่เลือกเลยจะแสดงทั้งหมด)
              </div>
              {allGroups.map(key => (
                <label key={key} className="filter-checkbox">
                  <input 
                    type="checkbox" 
                    checked={selectedKeys.has(key)}
                    onChange={() => toggleKey(key)}
                  />
                  <span>{key}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="monitor-content">
          <div className="monitor-grid">
            {visibleGroups.map(group => (
              <div key={group.key} className="card monitor-card">
                <div className="monitor-card-head">
                  <h3>{group.key}</h3>
                  <span className="badge">{group.logs.length} ล่าสุด</span>
                </div>
                <div className="monitor-card-body">
                  {group.logs.length === 0 ? (
                    <div className="empty" style={{padding: '20px 0'}}>ไม่มีข้อมูล</div>
                  ) : (
                    <table className="compact-table">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Station</th>
                          <th>BIB</th>
                          <th>Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.logs.map((log, idx) => (
                          <tr key={idx} className={log.ok ? '' : 'error-row'}>
                            <td className="mono" style={{color: 'var(--ink-2)'}}>{fmtTime(log.time)}</td>
                            <td style={{fontWeight: 500}}>{log.station}</td>
                            <td className="mono" style={{fontWeight: 600}}>{log.bib}</td>
                            <td className="truncate" style={{maxWidth: '120px'}} title={log.name}>{log.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ))}
            {visibleGroups.length === 0 && (
              <div className="card card-pad" style={{gridColumn: '1 / -1', textAlign: 'center', color: 'var(--ink-2)'}}>
                {selectedKeys.size > 0 ? 'ไม่มีรายการสแกนในกลุ่มที่เลือก' : 'ไม่มีรายการสแกนในระบบ'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

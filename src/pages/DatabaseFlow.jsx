import { ExternalLink } from 'lucide-react';

export default function DatabaseFlow() {
  return (
    <div className="page active" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 80px)' }}>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span className="eyebrow">System Architecture</span>
          <h1>Database Flow & Schema</h1>
          <p>แผนผังโครงสร้างฐานข้อมูล (ERD), ตารางข้อมูล และ Data Flow ของระบบ TrailTime</p>
        </div>
        <a 
          href="/database_flow.html" 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
        >
          <ExternalLink size={15} />
          เปิดในหน้าต่างใหม่
        </a>
      </div>

      <div className="card" style={{ flex: 1, minHeight: '750px', overflow: 'hidden', borderRadius: 'var(--radius)' }}>
        <iframe 
          src="/database_flow.html" 
          title="Database Flow & Schema"
          style={{ width: '100%', height: '100%', minHeight: '750px', border: 'none' }}
        />
      </div>
    </div>
  );
}

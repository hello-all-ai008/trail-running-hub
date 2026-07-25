import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Trophy, 
  History, 
  MonitorPlay,
  Image as ImageIcon,
  Settings2,
  Database,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

function CollapsibleGroup({ title, children, defaultOpen = true, isSidebarCollapsed }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`nav-group-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div 
        className="nav-group" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
      >
        <span>{title}</span>
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </div>
      <div className={`nav-group-items ${isOpen || isSidebarCollapsed ? 'open' : 'closed'}`}>
        {children}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="logo">
        <div className="logo-mark">TT</div>
        <div><b>TrailTime</b><span>Race Timing System</span></div>
      </div>
      
      <button 
        className="collapse-btn" 
        onClick={() => setIsCollapsed(!isCollapsed)}
        title="ย่อ/ขยาย Sidebar"
      >
        {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
      </button>

      <CollapsibleGroup title="ภาพรวม" defaultOpen={true} isSidebarCollapsed={isCollapsed}>
        <NavLink to="/dashboard" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={17} />
          <span className="label">แดชบอร์ด</span>
        </NavLink>
        <NavLink to="/runners" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users size={17} />
          <span className="label">รายชื่อนักวิ่ง</span>
        </NavLink>
        <NavLink to="/import" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <UserPlus size={17} />
          <span className="label">เพิ่มข้อมูลนักวิ่ง</span>
        </NavLink>
        <NavLink to="/auto-bib" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <ImageIcon size={17} />
          <span className="label">Auto BIB</span>
        </NavLink>
        <NavLink to="/rebuild-bib" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Settings2 size={17} />
          <span className="label">Rebuild BIB</span>
        </NavLink>
        <NavLink to="/database-flow" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Database size={17} />
          <span className="label">Database Flow</span>
        </NavLink>
      </CollapsibleGroup>

      <CollapsibleGroup title="จุดสแกน" defaultOpen={true} isSidebarCollapsed={isCollapsed}>
        <NavLink to="/checkin" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="dot" style={{background: 'var(--start)'}}></span>
          <span className="label">Check-in (Start)</span>
        </NavLink>
        <NavLink to="/checkpoint" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="dot" style={{background: 'var(--cp)'}}></span>
          <span className="label">Check Point</span>
        </NavLink>
        <NavLink to="/finish" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="dot" style={{background: 'var(--finish)'}}></span>
          <span className="label">Finish Line</span>
        </NavLink>
      </CollapsibleGroup>

      <CollapsibleGroup title="รายงาน" defaultOpen={false} isSidebarCollapsed={isCollapsed}>
        <NavLink to="/results" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Trophy size={17} />
          <span className="label">ผลการแข่งขัน</span>
        </NavLink>
        <NavLink to="/log" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <History size={17} />
          <span className="label">Scan Log</span>
        </NavLink>
      </CollapsibleGroup>

      <CollapsibleGroup title="Live Screen" defaultOpen={false} isSidebarCollapsed={isCollapsed}>
        <NavLink to="/live" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <MonitorPlay size={17} />
          <span className="label">Live Stream 🌟</span>
        </NavLink>
        <NavLink to="/monitor" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={17} />
          <span className="label">Category Monitor</span>
        </NavLink>
      </CollapsibleGroup>
    </aside>
  );
}

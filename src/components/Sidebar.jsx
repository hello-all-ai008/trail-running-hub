import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Trophy, 
  History, 
  MonitorPlay 
} from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-mark">TT</div>
        <div><b>TrailTime</b><span>Race Timing System</span></div>
      </div>
      
      <div className="nav-group">ภาพรวม</div>
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

      <div className="nav-group">จุดสแกน</div>
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

      <div className="nav-group">รายงาน</div>
      <NavLink to="/results" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
        <Trophy size={17} />
        <span className="label">ผลการแข่งขัน</span>
      </NavLink>
      <NavLink to="/log" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
        <History size={17} />
        <span className="label">Scan Log</span>
      </NavLink>

      <div className="nav-group">Live Screen</div>
      <NavLink to="/live" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
        <MonitorPlay size={17} />
        <span className="label">Live Stream 🌟</span>
      </NavLink>
    </aside>
  );
}

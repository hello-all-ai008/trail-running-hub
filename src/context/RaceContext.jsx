import { createContext, useState, useEffect, useContext } from 'react';

const RaceContext = createContext();

export const CHECKPOINTS = [
  {id:'A1', name:'A1 Mae Kha Nin'},
  {id:'A2', name:'A2 Doi Pha Daeng'},
  {id:'A3', name:'A3 Huai Nam Sai'},
];
export const CATEGORIES = ['MKT10','MKT25','PST50'];

const firstTH = ['สมชาย','วิภา','อนันต์','กมล','ธนพล','สุนิสา','ปรีชา','อรทัย','ณัฐพงษ์','จิราพร','เสริมศักดิ์','พิมพ์ชนก','วีระ','ศิริพร','ชัยวัฒน์','นภัสสร','ก้องภพ','อัญชลี','ภูมิ','ดวงใจ'];
const lastTH  = ['ใจดี','ทิพย์พันธ์','แสงทอง','บุญมา','ศรีสุข','คำมูล','วงศ์ใหญ่','จันทร์เพ็ญ','อินทะวงศ์','สุขสวัสดิ์','ทองดี','ปัญญาดี','แก้วมณี','พรมมา','ตันติกุล','ไชยวงศ์','มาลัย','สุริยะ','บัวคำ','ธาราทิพย์'];
const ageGroups = ['20-29','30-39','40-49','50-59'];

// Seed Data
function generateSeedData() {
  let runners = [];
  let scanLog = [];
  let n = 0;
  const plan=[{cat:'MKT10',base:1001,count:14},{cat:'MKT25',base:2001,count:12},{cat:'PST50',base:5001,count:12}];
  plan.forEach(p=>{
    for(let i=0;i<p.count;i++){
      const g = Math.random()<.6?'M':'F';
      runners.push({
        bib:String(p.base+i),
        name:firstTH[(n*7)%20]+' '+lastTH[(n*11)%20],
        gender:g, age:ageGroups[n%4], nat:'THAI', cat:p.cat,
        checkin:null, cps:{}, finish:null
      });
      n++;
    }
  });

  const now = Date.now();
  const rnd = (a, b) => a + Math.random() * (b - a);
  
  runners.forEach((r,i)=>{
    if(i%3!==0){ r.checkin = now - rnd(3.5,5)*3600e3; }
  });
  
  runners.filter(r=>r.checkin).forEach((r,i)=>{
    if(i%2===0){ r.cps['A1'] = r.checkin + rnd(.8,1.4)*3600e3; }
    if(i%4===0){ r.cps['A2'] = r.checkin + rnd(1.8,2.4)*3600e3; }
    if(i%5===0){ r.finish = r.checkin + rnd(2.6,4.2)*3600e3; }
  });

  // Seed log
  const cpName = (id) => { const c=CHECKPOINTS.find(c=>c.id===id); return c?c.name:id };
  runners.forEach(r=>{
    if(r.checkin) scanLog.push({time:r.checkin,station:'Check-in',bib:r.bib,name:r.name,ok:true});
    Object.entries(r.cps).forEach(([cp,t])=>scanLog.push({time:t,station:cpName(cp),bib:r.bib,name:r.name,ok:true}));
    if(r.finish) scanLog.push({time:r.finish,station:'Finish',bib:r.bib,name:r.name,ok:true});
  });
  scanLog.sort((a,b)=>b.time-a.time);

  return { runners, scanLog };
}

export function RaceProvider({ children }) {
  const [runners, setRunners] = useState([]);
  const [scanLog, setScanLog] = useState([]);
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    // Load seed data on mount
    const data = generateSeedData();
    setRunners(data.runners);
    setScanLog(data.scanLog);
  }, []);

  const addToast = (msg, err = false) => {
    setToastMsg({ msg, err, id: Date.now() });
    setTimeout(() => setToastMsg(null), 2600);
  };

  const getCpName = (id) => {
    const c = CHECKPOINTS.find(c => c.id === id);
    return c ? c.name : id;
  };

  const findRunner = (bib) => runners.find(r => r.bib === bib.trim());

  const addLog = (entry) => {
    setScanLog(prev => [entry, ...prev].sort((a, b) => b.time - a.time));
  };

  const updateRunner = (updatedRunner) => {
    setRunners(prev => prev.map(r => r.bib === updatedRunner.bib ? updatedRunner : r));
  };

  const processScan = (stationType, bib, stationId = null) => {
    const now = Date.now();
    const r = findRunner(bib);
    let result = { success: false, runner: r, now, message: '', stationName: '' };

    if (!r) {
      addLog({ time: now, station: stationType === 'CheckPoint' ? getCpName(stationId) : stationType, bib, name: 'ไม่พบในระบบ', ok: false });
      addToast(`ไม่พบ BIB ${bib} ในฐานข้อมูล`, true);
      result.message = 'NOT FOUND · ไม่พบในระบบ';
      return result;
    }

    if (stationType === 'Check-in') {
      result.stationName = 'Check-in';
      if (r.checkin) {
        result.message = `Already checked-in`;
        addToast(`BIB ${r.bib} เช็คอินไปแล้ว`, true);
        addLog({ time: now, station: 'Check-in', bib, name: r.name, ok: false, msg: 'ซ้ำ' });
      } else {
        const updated = { ...r, checkin: now };
        updateRunner(updated);
        result.success = true;
        result.runner = updated;
        addToast(`✓ Check-in สำเร็จ — BIB ${r.bib} ${r.name}`);
        addLog({ time: now, station: 'Check-in', bib, name: r.name, ok: true });
      }
    } 
    else if (stationType === 'CheckPoint') {
      const cpName = getCpName(stationId);
      result.stationName = cpName;
      
      if (!r.checkin) {
        result.message = `ยังไม่ได้ Check-in ที่จุดสตาร์ท`;
        addToast(`BIB ${r.bib} ยังไม่ผ่าน Check-in`, true);
        addLog({ time: now, station: cpName, bib, name: r.name, ok: false, msg: 'ยังไม่เช็คอิน' });
      } else if (r.cps[stationId]) {
        result.message = `Already scanned`;
        addToast(`BIB ${r.bib} ผ่าน ${stationId} ไปแล้ว`, true);
        addLog({ time: now, station: cpName, bib, name: r.name, ok: false, msg: 'ซ้ำ' });
      } else {
        const updated = { ...r, cps: { ...r.cps, [stationId]: now } };
        updateRunner(updated);
        result.success = true;
        result.runner = updated;
        addToast(`✓ ${cpName} — BIB ${r.bib} ${r.name}`);
        addLog({ time: now, station: cpName, bib, name: r.name, ok: true });
      }
    }
    else if (stationType === 'Finish') {
      result.stationName = 'Finish';
      if (!r.checkin) {
        result.message = `ยังไม่ได้ Check-in — ไม่สามารถบันทึก Finish`;
        addToast(`BIB ${r.bib} ยังไม่ผ่าน Check-in`, true);
        addLog({ time: now, station: 'Finish', bib, name: r.name, ok: false, msg: 'ยังไม่เช็คอิน' });
      } else if (r.finish) {
        result.message = `Already finished`;
        addToast(`BIB ${r.bib} เข้าเส้นชัยแล้ว (ยึดเวลาแรก)`, true);
        addLog({ time: now, station: 'Finish', bib, name: r.name, ok: false, msg: 'ซ้ำ' });
      } else {
        const updated = { ...r, finish: now };
        updateRunner(updated);
        result.success = true;
        result.runner = updated;
        addToast(`🏁 Finish! BIB ${r.bib} ${r.name}`);
        addLog({ time: now, station: 'Finish', bib, name: r.name, ok: true });
      }
    }

    return result;
  };

  const importRunners = (newRunners) => {
    setRunners(prev => [...prev, ...newRunners]);
    addToast(`✓ นำเข้าข้อมูลสำเร็จ ${newRunners.length} รายการ`);
  };

  return (
    <RaceContext.Provider value={{
      runners,
      scanLog,
      toastMsg,
      processScan,
      addToast,
      getCpName,
      importRunners,
      updateRunner
    }}>
      {children}
    </RaceContext.Provider>
  );
}

export const useRace = () => useContext(RaceContext);

/* ScholarHub live-sync layer (Phase 2, Firebase/Firestore).
   GUARDED: does nothing unless a Firebase config is stored in
   localStorage('scholarhub_fb_config'). App stays fully local/offline otherwise.
   Uses the compat SDK loaded from CDN in index.html.
   References the global `DB`, `defaultDB`, `save` from index.html (same page scope). */
window.Sync = (function(){
  const CFG_KEY='scholarhub_fb_config', SID_KEY='scholarhub_school_id';
  let app=null, db=null, ref=null, onSnap=null, ready=false, applyingRemote=false, pushTimer=null;

  function config(){ try{ return JSON.parse(localStorage.getItem(CFG_KEY)); }catch(e){ return null; } }
  function schoolId(){ return localStorage.getItem(SID_KEY) || 'default-school'; }
  function enabled(){ return !!(window.firebase && config()); }

  function init(){
    if(!enabled()) return false;
    try{
      if(!firebase.apps || !firebase.apps.length) firebase.initializeApp(config());
      db = firebase.firestore();
      ref = db.collection('schools').doc(schoolId());
      ready=true; return true;
    }catch(e){ console.warn('Sync init failed', e); return false; }
  }

  // Pull once; if local is essentially empty, adopt cloud. Then subscribe.
  async function start(getLocalEmpty, onRemote){
    if(!enabled()) return false;
    if(!init()) return false;
    try{
      const snap = await ref.get();
      if(snap.exists){
        const data = snap.data();
        if(data && typeof data==='object'){
          // adopt cloud if local has little/no data, so a new device pulls real data
          if(getLocalEmpty()){
            DB = Object.assign(defaultDB(), data);
            save();
            if(onRemote) onRemote();
          }
        }
      } else {
        // cloud empty -> push current local as the master
        await ref.set(DB);
      }
      // realtime subscription
      onSnap = ref.onSnapshot(s=>{
        if(!s.exists) return;
        const data = s.data();
        if(!data) return;
        const incoming = JSON.stringify(Object.assign(defaultDB(), data));
        if(incoming === JSON.stringify(DB)) return; // echo / no real change
        applyingRemote = true;
        DB = Object.assign(defaultDB(), data);
        save();
        if(onRemote) onRemote();
        setTimeout(()=>{ applyingRemote=false; }, 600);
      });
      return true;
    }catch(e){ console.warn('Sync start failed', e); return false; }
  }

  function push(){
    if(!ready || applyingRemote || !ref) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(()=>{ try{ ref.set(DB); }catch(e){} }, 700);
  }

  function stop(){ if(onSnap) try{ onSnap(); }catch(e){} onSnap=null; ready=false; }

  return { config, schoolId, enabled, init, start, push, stop, CFG_KEY, SID_KEY };
})();

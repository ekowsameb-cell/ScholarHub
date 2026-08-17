/* ScholarHub live-sync layer (Phase 2, Firebase/Firestore).
   Uses the COMPAT SDK loaded from CDN in index.html (global `firebase`).
   This config is a PUBLIC client key (normal for Firebase web apps); security
   is enforced by Firestore Security Rules, NOT by hiding this. See firestore.rules.
   References the global `DB`, `defaultDB`, `save` from index.html (same page scope). */
window.Sync = (function(){
  const CFG_KEY='scholarhub_fb_config', SID_KEY='scholarhub_school_id', DISABLED_KEY='scholarhub_sync_disabled';

  // Default config embedded so every device auto-connects to THIS project.
  // The Connect Firebase UI in Admin > Data Sync can override it per-device.
  const DEFAULT_CONFIG = {
    apiKey: "AIzaSyC6IbyLlmwXchp507oaRe0sEUZ9nKr1v8E",
    authDomain: "scholar-hub-198c5.firebaseapp.com",
    projectId: "scholar-hub-198c5",
    storageBucket: "scholar-hub-198c5.firebasestorage.app",
    messagingSenderId: "772649683244",
    appId: "1:772649683244:web:58451728c3e359c5338489",
    measurementId: "G-YGM32WJRFK"
  };

  let db=null, ref=null, onSnap=null, ready=false, applyingRemote=false, pushTimer=null;

  function config(){ try{ const s=localStorage.getItem(CFG_KEY); if(s) return JSON.parse(s); }catch(e){} return DEFAULT_CONFIG; }
  function schoolId(){ return localStorage.getItem(SID_KEY) || 'default-school'; }
  function isDisabled(){ return localStorage.getItem(DISABLED_KEY)==='1'; }
  function enabled(){ return !isDisabled() && !!(window.firebase && config()); }

  function init(){
    if(!enabled()) return false;
    try{
      if(!firebase.apps || !firebase.apps.length) firebase.initializeApp(config());
      db = firebase.firestore();
      ref = db.collection('schools').doc(schoolId());
      ready=true; return true;
    }catch(e){ console.warn('Sync init failed', e); return false; }
  }

  // Sign in anonymously so Firestore rules (request.auth != null) allow access.
  // Requires Ecow to enable Anonymous Auth in Firebase console (one toggle).
  async function ensureAuth(){
    if(!window.firebase || !firebase.auth) return false;
    try{
      if(!firebase.auth().currentUser){
        await firebase.auth().signInAnonymously();
      }
      return !!firebase.auth().currentUser;
    }catch(e){ console.warn('Anon auth failed (enable Anonymous Auth in console):', e.message); return false; }
  }

  // Pull once; if local is essentially empty, adopt cloud. Then subscribe.
  async function start(getLocalEmpty, onRemote){
    if(!enabled()) return false;
    if(!init()) return false;
    const authed = await ensureAuth();
    if(!authed){ console.warn('Sync: not authenticated — staying local. Enable Anonymous Auth in Firebase console.'); return false; }
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
    }catch(e){
      // Initial read/write was denied (e.g. Firestore rules not published yet).
      // Surface a clear, actionable message instead of failing silently.
      const denied = /permission|insufficient|denied/i.test(e.message);
      console.warn('Sync start failed:', e.message);
      if(denied){
        console.warn('FIX: In Firebase console -> Firestore Database -> Rules, paste the scholarhub firestore.rules and Publish. Anon Auth is on, so allowing request.auth != null will enable sync.');
        if(window.__onSyncBlocked) window.__onSyncBlocked('Firestore rules not published. Go to Firebase console → Firestore → Rules, paste the provided rules, and Publish. (Anon Auth is already on, so this one step enables sync.)');
      } else {
        if(window.__onSyncBlocked) window.__onSyncBlocked('Sync error: '+e.message);
      }
      return false;
    }
  }

  function push(){
    if(!ready || applyingRemote || !ref) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(()=>{ try{ ref.set(DB); }catch(e){} }, 700);
  }

  function stop(){ if(onSnap) try{ onSnap(); }catch(e){} onSnap=null; ready=false; }

  return { config, schoolId, enabled, isDisabled, init, start, push, stop, CFG_KEY, SID_KEY, DISABLED_KEY };
})();

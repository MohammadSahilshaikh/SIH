// ================================================================
// Demo-mode detection: if config.js still has placeholder keys,
// the dashboard runs entirely in-memory so it's demoable instantly.
// Once real Supabase keys are added, it switches to live data.
// ================================================================
const DEMO_MODE = SUPABASE_URL.startsWith('YOUR_') || SUPABASE_ANON_KEY.startsWith('YOUR_');

const JUNCTION_SEED = [
  { id: 'J1', name: 'MG Road Junction' },
  { id: 'J2', name: 'Station Road Junction' },
  { id: 'J3', name: 'Ring Road Circle' },
  { id: 'J4', name: 'Hospital Chowk' },
  { id: 'J5', name: 'City Center Square' },
  { id: 'J6', name: 'Highway Entry Point' },
];

// In-memory state used both as the demo-mode "database" and as the
// render cache for live mode.
let junctions = JUNCTION_SEED.map(j => ({
  ...j,
  status: 'normal',       // 'normal' | 'emergency'
  active_direction: 'NS', // which pair is currently green
}));

let requests = []; // emergency_requests rows

// ---------------------------------------------------------------
// Normal-mode cycling (Local YOLO Computer Vision Simulation)
// ---------------------------------------------------------------
// Since Vercel is a static host and the Python backend isn't deployed,
// we simulate the YOLO object detection data locally in JS for the demo.
const localYoloData = {
  'J1': { NS_density: 45, EW_density: 10 },
  'J2': { NS_density: 15, EW_density: 35 },
  'J3': { NS_density: 50, EW_density: 50 },
  'J4': { NS_density: 5, EW_density: 20 },
  'J5': { NS_density: 25, EW_density: 10 },
  'J6': { NS_density: 5, EW_density: 5 }
};

setInterval(() => {
  // Fluctuate the mock YOLO data randomly
  Object.keys(localYoloData).forEach(j_id => {
    localYoloData[j_id].NS_density = Math.max(0, localYoloData[j_id].NS_density + Math.floor(Math.random() * 11) - 5);
    localYoloData[j_id].EW_density = Math.max(0, localYoloData[j_id].EW_density + Math.floor(Math.random() * 11) - 5);
  });
  
  junctions.forEach(j => {
    if (j.status === 'normal') {
      const density = localYoloData[j.id];
      if (density) {
        j.active_direction = density.NS_density >= density.EW_density ? 'NS' : 'EW';
        j.ns_count = density.NS_density;
        j.ew_count = density.EW_density;
      }
    }
  });
  renderJunctions();
}, 4000);

// ---------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------
const grid = document.getElementById('junction-grid');
const junctionCount = document.getElementById('junction-count');
const reqList = document.getElementById('req-list');
const reqCount = document.getElementById('req-count');

function lightClass(dir, activeDir, mode) {
  if (mode === 'emergency') {
    return dir === activeDir ? 'on-green' : 'on-red';
  }
  return dir === activeDir ? 'on-green' : 'on-red';
}

function renderJunctions() {
  junctionCount.textContent = DEMO_MODE
    ? `${junctions.length} junctions · YOLO demo mode (AI Vision)`
    : `${junctions.length} junctions · live`;

  grid.innerHTML = junctions.map(j => `
    <div class="junction-card ${j.status === 'emergency' ? 'emergency' : ''}">
      <div class="junction-card__name">${j.name} <span class="junction-card__id">${j.id}</span></div>
      <div class="signal-row">
        <span style="font-size:10px;color:var(--muted);width:30px;">N–S</span>
        <span class="light ${lightClass('NS', j.active_direction, j.status)}"></span>
        ${j.ns_count !== undefined ? `<span style="font-size:10px;margin-left:10px;color:var(--muted);">🚗 YOLO: ${j.ns_count}</span>` : ''}
      </div>
      <div class="signal-row">
        <span style="font-size:10px;color:var(--muted);width:30px;">E–W</span>
        <span class="light ${lightClass('EW', j.active_direction, j.status)}"></span>
        ${j.ew_count !== undefined ? `<span style="font-size:10px;margin-left:10px;color:var(--muted);">🚗 YOLO: ${j.ew_count}</span>` : ''}
      </div>
      <div class="junction-card__mode">${j.status === 'emergency' ? 'Emergency corridor active' : 'Adaptive normal cycling (YOLO)'}</div>
    </div>
  `).join('');
}

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

function renderRequests() {
  const active = requests.filter(r => r.status !== 'completed' && r.status !== 'cancelled');
  reqCount.textContent = `${active.length} active · ${requests.length} total today`;

  if (active.length === 0) {
    reqList.innerHTML = `<div class="empty-state">No active requests. They'll appear here the moment someone submits one.</div>`;
    return;
  }

  // newest first
  const sorted = [...active].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  reqList.innerHTML = sorted.map(r => `
    <div class="req-item" data-id="${r.id}">
      <div class="req-item__top">
        <span class="req-item__type">${r.vehicle_type} · ${r.vehicle_number}</span>
        <span class="req-badge ${r.status}">${r.status.replace('_', ' ')}</span>
      </div>
      <div class="req-item__meta">
        ${r.current_junction} → ${r.destination} · ${timeAgo(r.created_at)}<br>
        <strong>Contact:</strong> ${r.driver_contact || 'N/A'}<br>
        Route: ${(r.route || []).join(' → ')}
      </div>
      <div class="req-item__actions">
        ${r.status === 'pending'
          ? `<button class="mini-btn clear" data-action="clear" data-id="${r.id}">Clear route</button>`
          : `<button class="mini-btn done" data-action="complete" data-id="${r.id}">Mark passed</button>`
        }
      </div>
    </div>
  `).join('');
}

// ---------------------------------------------------------------
// Actions
// ---------------------------------------------------------------
async function clearRoute(requestId) {
  const req = requests.find(r => r.id === requestId);
  if (!req) return;

  const routeIds = req.route || [];
  junctions.forEach(j => {
    if (routeIds.includes(j.id)) {
      j.status = 'emergency';
      j.active_direction = 'NS'; // approach direction held green for the corridor
    }
  });
  req.status = 'in_progress';

  renderJunctions();
  renderRequests();

  if (!DEMO_MODE) {
    await supabaseClient.from('junctions').update({ status: 'emergency_green', active_direction: 'NS' }).in('id', routeIds);
    await supabaseClient.from('emergency_requests').update({ status: 'in_progress' }).eq('id', requestId);
  }
}

async function completeRequest(requestId) {
  const req = requests.find(r => r.id === requestId);
  if (!req) return;

  const routeIds = req.route || [];
  junctions.forEach(j => {
    if (routeIds.includes(j.id)) {
      j.status = 'normal';
    }
  });
  req.status = 'completed';

  renderJunctions();
  renderRequests();

  if (!DEMO_MODE) {
    await supabaseClient.from('junctions').update({ status: 'normal' }).in('id', routeIds);
    await supabaseClient.from('emergency_requests').update({ status: 'completed' }).eq('id', requestId);
  }
}

reqList.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;
  if (action === 'clear') clearRoute(id);
  if (action === 'complete') completeRequest(id);
});

// ---------------------------------------------------------------
// Data loading — live Supabase, or demo-mode seed data
// ---------------------------------------------------------------
async function loadLiveData() {
  const { data: jData } = await supabaseClient.from('junctions').select('*');
  if (jData && jData.length) {
    junctions = jData.map(j => ({
      id: j.id,
      name: j.name,
      status: j.status === 'emergency_green' ? 'emergency' : 'normal',
      active_direction: j.active_direction || 'NS',
    }));
  }

  const { data: rData } = await supabaseClient
    .from('emergency_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (rData) requests = rData;

  renderJunctions();
  renderRequests();
}

function subscribeLive() {
  supabaseClient
    .channel('emergency_requests_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_requests' }, (payload) => {
      if (payload.eventType === 'INSERT') requests.unshift(payload.new);
      else {
        const idx = requests.findIndex(r => r.id === payload.new.id);
        if (idx >= 0) requests[idx] = payload.new;
      }
      renderRequests();
    })
    .subscribe();
}

function seedDemoRequest() {
  // Drops one sample request in shortly after load so the dashboard
  // isn't empty on first look, even with zero setup.
  setTimeout(() => {
    requests.unshift({
      id: 'demo-' + Date.now(),
      vehicle_type: 'Ambulance',
      vehicle_number: 'MH-12 AB 3456',
      current_junction: 'J1',
      destination: 'City General Hospital, Sector 12',
      route: ['J1', 'J2', 'J3'],
      status: 'pending',
      created_at: new Date().toISOString(),
    });
    renderRequests();
  }, 1500);
}

// ---------------------------------------------------------------
// Init
// ---------------------------------------------------------------
renderJunctions();
renderRequests();

if (DEMO_MODE) {
  seedDemoRequest();
} else {
  loadLiveData();
  subscribeLive();
  setInterval(loadLiveData, 15000); // safety-net poll alongside realtime
}

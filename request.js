// ---- Vehicle type picker UI ----------------------------------
const vehicleOpts = document.querySelectorAll('.vehicle-opt');
function refreshVehicleUI() {
  vehicleOpts.forEach(opt => {
    const input = opt.querySelector('input');
    opt.classList.toggle('checked', input.checked);
  });
}
vehicleOpts.forEach(opt => {
  opt.addEventListener('click', () => {
    opt.querySelector('input').checked = true;
    refreshVehicleUI();
  });
});
refreshVehicleUI();

// ---- Junction name lookup (for readable emails/logs) ----------
const JUNCTION_NAMES = {
  J1: 'MG Road Junction',
  J2: 'Station Road Junction',
  J3: 'Ring Road Circle',
  J4: 'Hospital Chowk',
  J5: 'City Center Square',
  J6: 'Highway Entry Point',
};

// A very small mock router: in the real system this would call a
// routing/graph service. For the prototype we just take every
// junction from the current one onward in the seeded list, which is
// enough to demonstrate a multi-junction green corridor.
function mockRoute(fromId) {
  const ids = Object.keys(JUNCTION_NAMES);
  const startIdx = ids.indexOf(fromId);
  return ids.slice(startIdx, startIdx + 3); // up to 3 junctions ahead
}

// ---- Form submit -----------------------------------------------
const form = document.getElementById('emergency-form');
const statusEl = document.getElementById('status-msg');
const submitBtn = document.getElementById('submit-btn');

function showStatus(kind, message) {
  statusEl.textContent = message;
  statusEl.className = `status-msg show ${kind}`;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending…';

  const vehicle_type = form.querySelector('input[name="vehicle_type"]:checked').value;
  const vehicle_number = document.getElementById('vehicle_number').value.trim();
  const driver_contact = document.getElementById('driver_contact').value.trim();
  const current_junction = document.getElementById('current_junction').value;
  const destination = document.getElementById('destination').value.trim();
  const notesEl = document.getElementById('notes');
  const notes = notesEl ? notesEl.value.trim() : '';

  if (!current_junction) {
    showStatus('err', 'Please select the current junction.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send request →';
    return;
  }

  const route = mockRoute(current_junction);

  try {
    // 1. Write the request to Supabase
    const { data, error } = await supabaseClient
      .from('emergency_requests')
      .insert([{
        vehicle_type,
        vehicle_number,
        driver_contact,
        current_junction,
        destination,
        notes,
        route,
        status: 'pending',
      }])
      .select()
      .single();

    if (error) throw error;

    // 2. Alert the traffic control room by email via EmailJS
    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_email: TRAFFIC_CONTROL_EMAIL,
        vehicle_type,
        vehicle_number,
        current_junction: `${current_junction} — ${JUNCTION_NAMES[current_junction]}`,
        destination,
        notes: notes || 'None provided',
        request_id: data.id,
      });
    } catch (mailErr) {
      // Don't block the driver's confirmation on email failure —
      // the dashboard already has the request via Supabase realtime.
      console.warn('EmailJS alert failed:', mailErr);
    }

    showStatus('ok', `Request sent. Reference ID: ${data.id.slice(0, 8)}. Control room has been notified — watch the dashboard for signal clearance.`);
    form.reset();
    refreshVehicleUI();

  } catch (err) {
    console.error(err);
    showStatus('err', 'Could not send the request. Check your Supabase config in js/config.js and try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send request →';
  }
});

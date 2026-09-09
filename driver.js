let map;
let routingControl;

// Mock Database of Hospitals in Kolkata (Moved from Python to JS for Vercel Hosting)
const KOLKATA_HOSPITALS = [
  { id: "h1", name: "College of Medicine & Sagore Dutta Hospital", area: "Agarpara", lat: 22.684, lng: 88.375, specialty: "General" },
  { id: "h2", name: "Apollo Gleneagles Hospitals", area: "Salt Lake", lat: 22.574, lng: 88.400, specialty: "Multispecialty" },
  { id: "h3", name: "Tata Medical Center", area: "New Town", lat: 22.580, lng: 88.460, specialty: "Cancer / Oncology" },
  { id: "h4", name: "Narayana Multispeciality Hospital", area: "Howrah", lat: 22.570, lng: 88.310, specialty: "Cardiology" },
  { id: "h5", name: "KPC Medical College and Hospital", area: "Jadavpur", lat: 22.498, lng: 88.370, specialty: "General" },
  { id: "h6", name: "Zenith Super Specialist Hospital", area: "Agarpara", lat: 22.690, lng: 88.370, specialty: "Emergency" }
];

// Populate dropdown
function loadHospitals() {
  const select = document.getElementById('hospital-select');
  KOLKATA_HOSPITALS.forEach(h => {
    const opt = document.createElement('option');
    opt.value = h.id;
    opt.textContent = `${h.name} (${h.area}) - ${h.specialty}`;
    select.appendChild(opt);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadHospitals();
  initMap(); // Initialize Leaflet immediately
  
  document.getElementById('btn-find-route').addEventListener('click', () => {
    const startObj = JSON.parse(document.getElementById('start-location').value);
    const hospitalId = document.getElementById('hospital-select').value;
    
    let bestHospital = null;
    let mockTrafficMultiplier = (Math.random() * (2.5 - 1.0) + 1.0).toFixed(2);

    if (hospitalId) {
      bestHospital = KOLKATA_HOSPITALS.find(h => h.id === hospitalId);
    } else {
      // Find nearest hospital using basic distance
      let minScore = Infinity;
      KOLKATA_HOSPITALS.forEach(h => {
        const dist = Math.sqrt(Math.pow(startObj.lat - h.lat, 2) + Math.pow(startObj.lng - h.lng, 2));
        const traffic = Math.random() * (2.5 - 1.0) + 1.0;
        const score = dist * traffic;
        if (score < minScore) {
          minScore = score;
          bestHospital = h;
          mockTrafficMultiplier = traffic.toFixed(2);
        }
      });
    }
    
    if(bestHospital) {
      const info = document.getElementById('route-info');
      info.style.display = 'block';
      info.innerHTML = `
        ✓ Routing to ${bestHospital.name} in ${bestHospital.area} via fastest route. <br>
        <span style="font-size:12px; font-weight:normal;">Traffic Index: ${mockTrafficMultiplier} (Lower is faster)</span>
      `;
      
      // If Leaflet API is loaded, draw the route
      if (typeof L !== 'undefined') {
        drawRouteOnMap(startObj, {lat: bestHospital.lat, lng: bestHospital.lng});
      } else {
        document.getElementById('map').innerHTML = `<div style="padding:40px; text-align:center; color:#fff;">
          <strong>Map Library Not Loaded</strong><br>
          We have calculated the route to: ${bestHospital.name}.<br>
        </div>`;
      }
    }
  });
});

// Initialization function for Leaflet
function initMap() {
  const defaultPos = [22.5726, 88.3639]; // Kolkata
  
  // Prevent re-initialization if map already exists
  if (!map) {
    map = L.map("map").setView(defaultPos, 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);
  }
}

function drawRouteOnMap(start, end) {
  if (routingControl) {
    map.removeControl(routingControl);
  }

  routingControl = L.Routing.control({
    waypoints: [
      L.latLng(start.lat, start.lng),
      L.latLng(end.lat, end.lng)
    ],
    routeWhileDragging: false,
    addWaypoints: false, // Don't let users add waypoints by clicking
    createMarker: function(i, wp, nWps) {
      // Add markers for start and end
      let popupContent = i === 0 ? "Start Location" : "Destination Hospital";
      return L.marker(wp.latLng).bindPopup(popupContent);
    }
  }).addTo(map);
}

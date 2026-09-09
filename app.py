from flask import Flask, jsonify, send_from_directory, request
import random
import time
import os
import threading

app = Flask(__name__, static_folder='.', static_url_path='')

# Fixed temp data simulating YOLO detections on camera feeds
YOLO_MOCK_DATA = {
    'J1': {'NS_density': 45, 'EW_density': 10},
    'J2': {'NS_density': 15, 'EW_density': 35},
    'J3': {'NS_density': 50, 'EW_density': 50},
    'J4': {'NS_density': 5, 'EW_density': 20},
    'J5': {'NS_density': 25, 'EW_density': 10},
    'J6': {'NS_density': 5, 'EW_density': 5},
}

def simulate_yolo_detections():
    """
    Simulates a YOLO model reading from camera feeds and calculating 
    vehicle density per direction. For this demo, we fluctuate the fixed temp data.
    """
    while True:
        for j_id in YOLO_MOCK_DATA:
            # Randomly fluctuate the vehicle count (YOLO detection simulation)
            YOLO_MOCK_DATA[j_id]['NS_density'] = max(0, YOLO_MOCK_DATA[j_id]['NS_density'] + random.randint(-5, 5))
            YOLO_MOCK_DATA[j_id]['EW_density'] = max(0, YOLO_MOCK_DATA[j_id]['EW_density'] + random.randint(-5, 5))
        time.sleep(3)

# Mock Database of Hospitals in Kolkata (5 Districts)
# With coordinates roughly matching the areas
KOLKATA_HOSPITALS = [
    {"id": "h1", "name": "College of Medicine & Sagore Dutta Hospital", "area": "Agarpara", "lat": 22.684, "lng": 88.375, "specialty": "General"},
    {"id": "h2", "name": "Apollo Gleneagles Hospitals", "area": "Salt Lake", "lat": 22.574, "lng": 88.400, "specialty": "Multispecialty"},
    {"id": "h3", "name": "Tata Medical Center", "area": "New Town", "lat": 22.580, "lng": 88.460, "specialty": "Cancer / Oncology"},
    {"id": "h4", "name": "Narayana Multispeciality Hospital", "area": "Howrah", "lat": 22.570, "lng": 88.310, "specialty": "Cardiology"},
    {"id": "h5", "name": "KPC Medical College and Hospital", "area": "Jadavpur", "lat": 22.498, "lng": 88.370, "specialty": "General"},
    {"id": "h6", "name": "Zenith Super Specialist Hospital", "area": "Agarpara", "lat": 22.690, "lng": 88.370, "specialty": "Emergency"}
]

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/api/yolo_density')
def get_yolo_density():
    return jsonify(YOLO_MOCK_DATA)

# --- New APIs for Ambulance Routing ---

@app.route('/api/hospitals')
def get_hospitals():
    """Return list of all hospitals for the dropdown/search"""
    return jsonify(KOLKATA_HOSPITALS)

@app.route('/api/route', methods=['POST'])
def calculate_route():
    """
    Given a driver's start location and (optional) target hospital,
    find the shortest/fastest route considering 'traffic'.
    """
    data = request.json
    start_lat = data.get('lat')
    start_lng = data.get('lng')
    target_hospital_id = data.get('hospital_id')
    
    # Simple straight-line distance function for mock data
    def calc_distance(lat1, lon1, lat2, lon2):
        return ((lat1 - lat2)**2 + (lon1 - lon2)**2)**0.5

    best_hospital = None
    
    if target_hospital_id:
        # Patient wants a specific hospital
        best_hospital = next((h for h in KOLKATA_HOSPITALS if h['id'] == target_hospital_id), None)
    else:
        # Find nearest hospital based on distance & mock traffic
        # Mock traffic: We add a random multiplier to distance to simulate traffic delay
        min_score = float('inf')
        for h in KOLKATA_HOSPITALS:
            base_dist = calc_distance(start_lat, start_lng, h['lat'], h['lng'])
            traffic_multiplier = random.uniform(1.0, 2.5) # Simulating heavy vs low traffic
            score = base_dist * traffic_multiplier
            if score < min_score:
                min_score = score
                best_hospital = h

    if not best_hospital:
        return jsonify({"error": "Hospital not found"}), 404

    return jsonify({
        "status": "success",
        "hospital": best_hospital,
        "mock_traffic_multiplier": round(random.uniform(1.0, 2.5), 2),
        "message": f"Routing to {best_hospital['name']} in {best_hospital['area']} via fastest route."
    })

if __name__ == '__main__':
    # Start the YOLO simulation loop in the background
    threading.Thread(target=simulate_yolo_detections, daemon=True).start()
    
    print("===============================================================")
    print(" YOLO Traffic Model Backend running on http://localhost:5000")
    print("===============================================================")
    app.run(host='0.0.0.0', port=5000)

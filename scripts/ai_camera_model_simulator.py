"""
AI CAMERA MODEL SIMULATOR
=========================
Simulates an external AI Perception Model (YOLO / ANPR / OpenCV) sending live
vehicle observations to the city-intelligence backend (POST /api/events).

Usage:
  python scripts/ai_camera_model_simulator.py
"""

import requests
import json
import time
import random
from datetime import datetime, timezone

# Backend Ingestion Endpoint (via Vite Proxy or directly)
INGEST_URL = "http://localhost:5173/api/events"

# Delhi / NCR Cameras
CAMERAS = [
    {"id": "CHD_CAM_01", "name": "Connaught Place Radial", "lat": 28.6315, "lon": 77.2167},
    {"id": "CHD_CAM_02", "name": "India Gate Circle", "lat": 28.6129, "lon": 77.2295},
    {"id": "CHD_CAM_03", "name": "Karol Bagh Junction", "lat": 28.6517, "lon": 77.1906},
    {"id": "CHD_CAM_04", "name": "ITO Intersection", "lat": 28.6289, "lon": 77.2405},
    {"id": "CHD_CAM_05", "name": "Rajiv Chowk Metro Gate", "lat": 28.6328, "lon": 77.2197},
    {"id": "CHD_CAM_06", "name": "Chandni Chowk Core", "lat": 28.6506, "lon": 77.2303},
    {"id": "CHD_CAM_07", "name": "Laxmi Nagar Vikas Marg", "lat": 28.6304, "lon": 77.2773},
    {"id": "CHD_CAM_08", "name": "Mayur Vihar Phase 1", "lat": 28.6083, "lon": 77.2942},
    {"id": "CHD_CAM_09", "name": "Lajpat Nagar Ring Road", "lat": 28.5677, "lon": 77.2433},
    {"id": "CHD_CAM_10", "name": "Nehru Place Outer Ring", "lat": 28.5494, "lon": 77.2517},
]

# Simulated Plates to Track
VEHICLES = [
    {"plate": "DL01AB1234", "type": "car", "colour": "white"},
    {"plate": "HR26DK8337", "type": "car", "colour": "black"},
    {"plate": "UP14CF9988", "type": "truck", "colour": "blue"},
    {"plate": "PB65XY5512", "type": "car", "colour": "silver"},
]

def simulate_ai_detection(vehicle, camera):
    now_iso = datetime.now(timezone.utc).isoformat()
    
    payload = {
        "event_id": f"ai_evt_{int(time.time() * 1000)}",
        "camera_id": camera["id"],
        "camera_location": {
            "lat": camera["lat"],
            "lon": camera["lon"],
            "name": camera["name"]
        },
        "timestamp_first_seen": now_iso,
        "timestamp_last_seen": now_iso,
        "tracklet_id": f"trk_{camera['id']}_{int(time.time())}",
        "plate": {
            "text": vehicle["plate"],
            "confidence": round(random.uniform(0.92, 0.99), 2),
            "raw_ocr_reads": [vehicle["plate"]]
        },
        "vehicle": {
            "type": vehicle["type"],
            "type_confidence": 0.96,
            "colour": vehicle["colour"],
            "colour_confidence": 0.94
        },
        "detection_confidence": 0.97,
        "node_mode": "live"
    }

    try:
        res = requests.post(INGEST_URL, json=payload, headers={"Content-Type": "application/json"}, timeout=5)
        print(f"[{res.status_code}] AI Model detected {vehicle['plate']} ({vehicle['type']}) at {camera['name']} ({camera['id']})")
    except Exception as err:
        print(f"Error sending detection: {err}")

def main():
    print("Starting AI Camera Model Live Detection Simulator...")
    print(f"Posting events to: {INGEST_URL}")
    print("-------------------------------------------------------")
    
    step = 0
    try:
        while True:
            vehicle = VEHICLES[step % len(VEHICLES)]
            camera = CAMERAS[step % len(CAMERAS)]
            simulate_ai_detection(vehicle, camera)
            step += 1
            time.sleep(4)  # Send a detection every 4 seconds
    except KeyboardInterrupt:
        print("\nStopped AI Model Simulator.")

if __name__ == "__main__":
    main()

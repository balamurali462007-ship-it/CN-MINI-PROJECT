from flask import Flask, request, jsonify, render_template
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Basic Networking Constants for simulation (simplified for Viva explanation)
# Bandwidth mapping: Low (1 Mbps), Medium (10 Mbps), High (100 Mbps)
BANDWIDTH_MAP = {
    'low': 1_000_000,
    'medium': 10_000_000,
    'high': 100_000_000
}

# Standard Packet Sizes in bits (roughly 1500 bytes = 12000 bits)
PACKET_SIZE_BITS = 12000

@app.route('/')
def index():
    # Will serve the index.html once created
    return "Backend Running Successfully"

@app.route('/simulate', methods=['POST'])
def simulate():
    """
    Simulates networking metrics for TCP, UDP, HTTP, HTTPS based on inputs.
    Strictly dynamic and layered calculations.
    """
    data = request.json
    bandwidth_level = data.get('bandwidth', 'medium')
    packet_loss_percent = float(data.get('packet_loss', 0))
    base_latency = float(data.get('latency', 50)) 

    bandwidth_bps = BANDWIDTH_MAP.get(bandwidth_level, 10_000_000)
    base_throughput = bandwidth_bps # bits per sec

    results = {}

    # --- UDP Simulation ---
    # UDP is simple: base latency + minimal overhead
    udp_latency = base_latency + 5
    udp_throughput = base_throughput * (1 - (packet_loss_percent / 100))
    results['UDP'] = {
        'latency': round(udp_latency, 2),
        'throughput_kbps': round(udp_throughput / 1000, 2),
        'loss_percent': packet_loss_percent,
        'description': 'Connectionless. Fast but unreliable.'
    }

    # --- TCP Simulation ---
    # tcp_latency = base_latency + (packet_loss * 5) + 20
    tcp_latency = base_latency + (packet_loss_percent * 5) + 20
    # tcp_throughput = base_throughput * (1 - packet_loss/100)
    tcp_throughput = base_throughput * (1 - (packet_loss_percent / 100))
    results['TCP'] = {
        'latency': round(tcp_latency, 2),
        'throughput_kbps': round(tcp_throughput / 1000, 2),
        'loss_percent': 0, # TCP ensures reliability
        'description': 'Reliable transport. Latency scales with loss.'
    }

    # --- HTTP Simulation ---
    # http_overhead = 10 + (packet_loss * 2)
    http_overhead = 10 + (packet_loss_percent * 2)
    # http_latency = tcp_latency + http_overhead
    http_latency = tcp_latency + http_overhead
    # http_throughput = tcp_throughput * 0.9
    http_throughput = tcp_throughput * 0.9
    results['HTTP'] = {
        'latency': round(http_latency, 2),
        'throughput_kbps': round(http_throughput / 1000, 2),
        'loss_percent': 0,
        'description': 'Application layer over TCP. Adds processing overhead.'
    }

    # --- HTTPS Simulation ---
    # https_overhead = 40 + (packet_loss * 5)
    https_overhead = 40 + (packet_loss_percent * 5)
    # https_latency = http_latency + https_overhead
    https_latency = http_latency + https_overhead
    # https_throughput = http_throughput * 0.7
    https_throughput = http_throughput * 0.7
    results['HTTPS'] = {
        'latency': round(https_latency, 2),
        'throughput_kbps': round(https_throughput / 1000, 2),
        'loss_percent': 0,
        'description': 'Secure HTTP. Significant encryption and handshake overhead.'
    }

    return jsonify(results)

    return jsonify(results)

@app.route('/recommend', methods=['POST'])
def recommend():
    """
    Explainable Rule-Based Recommendation Engine
    """
    data = request.json
    scenario = data.get('scenario', 'video')  # video, chat, file
    
    # Rule 1: Video Streaming heavily relies on timeliness, tolerates loss.
    if scenario == 'video':
        return jsonify({
            'recommended_protocol': 'UDP',
            'explanation': 'UDP is recommended for Video Streaming because it has NO retransmission overhead. Late packets are useless in live video, so UDP prioritizes low latency over perfect reliability.'
        })

    # Rule 2: File Transfer needs 100% data integrity
    elif scenario == 'file':
        return jsonify({
            'recommended_protocol': 'TCP',
            'explanation': 'TCP is recommended for File Transfers. It guarantees 100% data delivery through its ACK and retransmission mechanisms, which is essential because a missing byte ruins a file.'
        })

    # Rule 3: Chat Application (general web traffic)
    elif scenario == 'chat':
        # If it's modern chat, usually over HTTPS (WebSockets)
        return jsonify({
            'recommended_protocol': 'HTTPS',
            'explanation': 'HTTPS (over TCP) is recommended for Chat. It ensures reliable text delivery and provides TLS encryption to ensure privacy over untrusted networks.'
        })

    return jsonify({
        'recommended_protocol': 'TCP',
        'explanation': 'TCP is the default reliable choice.'
    })


import os

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

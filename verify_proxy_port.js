const net = require('net');

const portsToCheck = [
    { port: 9050, name: 'Tor Service (Default)' },
    { port: 9150, name: 'Tor Browser (Default)' },
    { port: 8080, name: 'Generic HTTP Proxy' },
    { port: 1080, name: 'Generic SOCKS Proxy' }
];

console.log("🔍 Scanning for active Proxy Tunnel endpoints on localhost...\n");

let activeFound = false;

portsToCheck.forEach(target => {
    const socket = new net.Socket();
    socket.setTimeout(2000);

    socket.on('connect', () => {
        console.log(`   ✅ [OPEN] ${target.name} is listening on port ${target.port}`);
        console.log(`      -> The Extension Tunnel should work if configured to Port ${target.port}.`);
        activeFound = true;
        socket.destroy();
    });

    socket.on('timeout', () => {
        // console.log(`   Detailed: Timeout on ${target.port}`);
        socket.destroy();
    });

    socket.on('error', (err) => {
        // Connection refused means port is closed
        // console.log(`   ❌ [CLOSED] Port ${target.port} is not accepting connections.`);
    });

    socket.connect(target.port, '127.0.0.1');
});

// Wait a bit for async results
setTimeout(() => {
    if (!activeFound) {
        console.log("\n⚠️  No common proxy ports found open.");
        console.log("   Explanation: The Extension routes traffic to a local proxy.");
        console.log("   Requirement: You must have Tor Browser or a VPN app running in background.");
    } else {
        console.log("\n🚀 Tunnel endpoint detected. If Extension is set to the OPEN port above, traffic is secure.");
    }
}, 3000);

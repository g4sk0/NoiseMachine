const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log("🛠️ Starting Data Poisoning Extension Simulation...\n");

// Paths
const bgPath = String.raw`c:\Users\efepo\Downloads\Yeni klasör\NoiseMachineExtension\src\background\noise_engine.js`;
const contentPath = String.raw`c:\Users\efepo\Downloads\Yeni klasör\NoiseMachineExtension\src\content\spoofing.js`;

// ==========================================
// TEST 1: Background Noise Engine
// ==========================================
console.log("🧪 Test 1: Noise Engine (Background Worker)");

const mockChrome = {
    runtime: {
        onInstalled: { addListener: (cb) => cb() },
        onMessage: { addListener: () => { } }
    },
    alarms: {
        onAlarm: {
            addListener: (cb) => { mockChrome.alarms.callback = cb; }
        },
        create: (name, opts) => console.log(`   [MockChrome] Alarm created: ${name} (delay: ${opts.delayInMinutes.toFixed(2)}m)`),
        clear: (name) => console.log(`   [MockChrome] Alarm cleared: ${name}`)
    },
    storage: {
        local: {
            data: { isNoiseActive: true, noiseLevel: 'high', stats: { sitesVisited: 0 } },
            get: async (keys) => mockChrome.storage.local.data,
            set: async (obj) => {
                Object.assign(mockChrome.storage.local.data, obj);
                if (obj.stats) console.log(`   [MockChrome] Stats updated: Sites Visited = ${obj.stats.sitesVisited}`);
            }
        }
    }
};

const mockFetch = async (url) => {
    console.log(`   [MockNetwork] 📡 Fetching: ${url}`);
    return { ok: true };
};

// Create Sandbox for Background Script
const bgSandbox = {
    chrome: mockChrome,
    fetch: mockFetch,
    console: console,
    Math: Math,
    setTimeout: setTimeout
};
vm.createContext(bgSandbox);

try {
    const bgCode = fs.readFileSync(bgPath, 'utf8');
    vm.runInContext(bgCode, bgSandbox);
    console.log("   ✅ Background Script Loaded");

    // Simulate Alarm Trigger
    console.log("   ▶️ Triggering Alarm 'noise_tick'...");
    if (mockChrome.alarms.callback) {
        // We need to wait for the async function inside the alarm to finish
        // But since the callback isn't exposed as a promise, we rely on the console logs in mockFetch/Storage
        mockChrome.alarms.callback({ name: 'noise_tick' });

        // Wait a bit for async operations
        setTimeout(() => {
            console.log("   ✅ Noise Engine Test Completed\n");
            runContentScriptTest();
        }, 1000);
    } else {
        console.error("   ❌ Alarm listener not registered!");
    }

} catch (e) {
    console.error("   ❌ Background Script Error:", e);
}


// ==========================================
// TEST 2: Content Script (Spoofing)
// ==========================================
function runContentScriptTest() {
    console.log("🧪 Test 2: Canvas Spoofing (Content Script)");

    // We need to extract the inner script content because the content script 
    // just injects a script tag.
    const contentCodeRaw = fs.readFileSync(contentPath, 'utf8');

    // Extract everything between `const scriptContent = \`` and `\`;`
    // Simple regex to grab the string content
    const match = contentCodeRaw.match(/const scriptContent = `([\s\S]*?)`;/);

    if (!match) {
        console.error("   ❌ Could not extract script content from spoofing.js");
        return;
    }

    const injectedCode = match[1];

    // Mock Browser DOM Environment
    const mockWindow = {
        HTMLCanvasElement: class {
            getContext() { return { fillStyle: '' }; }
            toDataURL() { return "data:image/png;base64,real_hardware_hash"; }
        },
        CanvasRenderingContext2D: class {
            getImageData() {
                // Return a fake 4-pixel buffer (R,G,B,A) * 10 works
                return { data: new Uint8ClampedArray(40).fill(100) };
            }
        },
        document: {
            createElement: () => ({}),
            head: { appendChild: () => { }, remove: () => { } },
            documentElement: { appendChild: () => { } }
        },
        console: console,
        Math: Math
    };

    // Bind prototypes for the script to hook
    mockWindow.HTMLCanvasElement.prototype = mockWindow.HTMLCanvasElement.prototype;
    mockWindow.CanvasRenderingContext2D.prototype = mockWindow.CanvasRenderingContext2D.prototype;

    const contentSandbox = mockWindow;
    vm.createContext(contentSandbox);

    try {
        console.log("   ▶️ Injecting Spoof Script...");
        vm.runInContext(injectedCode, contentSandbox);

        // VERIFY 2: getImageData Noise
        console.log("   ▶️ Testing getImageData noise...");
        const ctx = new mockWindow.CanvasRenderingContext2D();
        const originalData = new Uint8ClampedArray(40).fill(100); // What real hardware returns

        const noisyData = ctx.getImageData(0, 0, 10, 1); // Should trigger our hook

        // Check if data changed
        let isDifferent = false;
        for (let i = 0; i < noisyData.data.length; i++) {
            if (noisyData.data[i] !== originalData[i]) {
                isDifferent = true;
                break;
            }
        }

        if (isDifferent) {
            console.log("   ✅ SUCCESS: Pixel data was altered (Noise detected)!");
        } else {
            console.warn("   ⚠️ WARNING: Pixel data remained identical (Spoofing might be too subtle or failed)");
        }

    } catch (e) {
        console.error("   ❌ Content Script Error:", e);
    }
}

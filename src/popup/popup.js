/**
 * The Noise Machine - Extension Controller
 * Handles UI interactions, Storage management, and Background communication.
 */

const API_MAIL_BASE = "https://www.1secmail.com/api/v1/";

class NoiseApp {
    constructor() {
        this.cache = {};
        this.dom = {}; // Cache DOM elements
        this.init();
    }

    async init() {
        this.cacheDOM();
        this.setupTabs();
        await this.loadState();
        this.setupListeners();
        this.startTimers();
    }

    cacheDOM() {
        // Tabs
        this.dom.tabs = document.querySelectorAll('.tab-btn');
        this.dom.pages = document.querySelectorAll('.page');

        // Noise
        this.dom.noiseToggle = document.getElementById('noiseToggle');
        this.dom.noiseLevel = document.getElementById('noiseLevel');
        this.dom.siteCount = document.getElementById('siteCount');

        // Burner
        this.dom.fakeName = document.getElementById('fakeName');
        this.dom.fakeCC = document.getElementById('fakeCC');
        this.dom.genIdentityBtn = document.getElementById('genIdentityBtn');
        this.dom.burnerEmail = document.getElementById('burnerEmail');
        this.dom.newMailBtn = document.getElementById('newMailBtn');
        this.dom.refreshMailBtn = document.getElementById('refreshMailBtn');
        this.dom.inboxList = document.getElementById('inbox-list');
        this.dom.openWebBtn = document.getElementById('openWebBtn'); // Fallback

        // Tunnel
        this.dom.proxyToggle = document.getElementById('proxyToggle');
        this.dom.proxyType = document.getElementById('proxyType');
        this.dom.proxyHost = document.getElementById('proxyHost');
        this.dom.proxyPort = document.getElementById('proxyPort');
        this.dom.proxyStatus = document.getElementById('proxyStatus');

        // Shield
        this.dom.uaToggle = document.getElementById('uaToggle');
        this.dom.uaProfile = document.getElementById('uaProfile');
        this.dom.currentUA = document.getElementById('currentUA');
        this.dom.webrtcToggle = document.getElementById('webrtcToggle');
        this.dom.urlCleanToggle = document.getElementById('urlCleanToggle');
    }

    setupTabs() {
        this.dom.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all
                this.dom.tabs.forEach(t => t.classList.remove('active'));
                this.dom.pages.forEach(p => p.classList.remove('active'));

                // Activate clicked
                tab.classList.add('active');
                const targetId = tab.dataset.tab;
                document.getElementById(targetId).classList.add('active');
            });
        });
    }

    async loadState() {
        const data = await chrome.storage.local.get(null); // Get all
        this.state = data;

        // 1. Noise
        this.dom.noiseToggle.checked = data.isNoiseActive || false;
        this.dom.noiseLevel.value = data.noiseLevel || 'medium';
        this.dom.siteCount.textContent = data.stats?.sitesVisited || 0;

        // 2. Burner Identity
        if (data.burnerIdentity) {
            this.renderIdentity(data.burnerIdentity);
        } else {
            this.generateAndSaveIdentity();
        }

        // 3. Burner Mail
        if (data.burnerEmail) {
            this.dom.burnerEmail.textContent = data.burnerEmail.full;
            this.dom.openWebBtn.style.display = 'block';
        }

        // 4. Tunnel
        if (data.proxyConfig) {
            this.dom.proxyType.value = data.proxyConfig.type || 'socks5';
            this.dom.proxyHost.value = data.proxyConfig.host || '127.0.0.1';
            this.dom.proxyPort.value = data.proxyConfig.port || 9050;
        }
        this.checkProxyStatus(); // Async check

        // 5. Shield - UA
        if (data.uaConfig) {
            this.dom.uaToggle.checked = data.uaConfig.enabled;
            this.dom.uaProfile.value = data.uaConfig.profile || "win_chrome";
            this.renderCurrentUA();
        }

        // 5. Shield - WebRTC & URL
        this.dom.webrtcToggle.checked = data.webrtcEnabled || false;
        this.dom.urlCleanToggle.checked = data.urlCleanEnabled || false;
    }

    setupListeners() {
        // --- Noise ---
        this.dom.noiseToggle.addEventListener('change', (e) => {
            const isActive = e.target.checked;
            chrome.storage.local.set({ isNoiseActive: isActive });
            chrome.runtime.sendMessage({ action: "toggleNoise", value: isActive });
        });

        this.dom.noiseLevel.addEventListener('change', (e) => {
            chrome.storage.local.set({ noiseLevel: e.target.value });
        });

        // --- Burner ---
        this.dom.genIdentityBtn.addEventListener('click', () => this.generateAndSaveIdentity());
        this.dom.newMailBtn.addEventListener('click', () => this.generateNewMail());
        this.dom.refreshMailBtn.addEventListener('click', () => this.checkInbox());

        // Open Web Fallback
        // Open Web Fallback
        this.dom.openWebBtn.addEventListener('click', () => {
            // Guerrilla uses cookies/session, so direct link with params isn't as simple as 1secmail.
            // We just open the main site, they might need to use the site manually if session doesn't carry over (it serves as a general fallback).
            window.open('https://www.guerrillamail.com/', '_blank');
        });

        // --- Tunnel ---
        this.dom.proxyToggle.addEventListener('change', (e) => this.toggleProxy(e.target.checked));

        // --- Shield ---
        this.dom.uaToggle.addEventListener('change', () => this.updateShieldUA());
        this.dom.uaProfile.addEventListener('change', () => this.updateShieldUA());

        this.dom.webrtcToggle.addEventListener('change', (e) => {
            chrome.storage.local.set({ webrtcEnabled: e.target.checked });
            this.applyWebRTC(e.target.checked);
        });

        this.dom.urlCleanToggle.addEventListener('change', (e) => {
            chrome.storage.local.set({ urlCleanEnabled: e.target.checked });
            this.applyUrlCleaner(e.target.checked);
        });
    }

    startTimers() {
        setInterval(async () => {
            const data = await chrome.storage.local.get(['stats']);
            if (data.stats) this.dom.siteCount.textContent = data.stats.sitesVisited;
        }, 1000);
    }

    // ===========================================
    // LOGIC MODULES
    // ===========================================

    // --- Identity ---
    generateAndSaveIdentity() {
        const id = Utility.generateFakeID();
        this.renderIdentity(id);
        chrome.storage.local.set({ burnerIdentity: id });
    }

    renderIdentity(id) {
        this.dom.fakeName.textContent = id.name;
        this.dom.fakeCC.textContent = id.cc;
    }

    // --- Mail ---
    // --- Mail (Guerrilla Logic) ---
    async generateNewMail() {
        this.dom.burnerEmail.textContent = "Connecting to Guerrilla...";
        try {
            // Guerrilla Mail API
            const API = "https://api.guerrillamail.com/ajax.php";

            // 1. Get Session / Address
            // If we have a token, we might want to extend it, but mostly we just get a new address/session
            // Passing lang=en to be safe
            const res = await fetch(`${API}?f=get_email_address&lang=en`);
            const json = await res.json();

            // Expected: { email_addr: "...", sid_token: "...", ... }
            if (!json.email_addr) throw new Error("Failed to get address");

            const email = json.email_addr;
            const sid = json.sid_token;

            this.dom.burnerEmail.textContent = email;

            // Save state
            this.state.burnerEmail = { full: email, sid_token: sid };
            await chrome.storage.local.set({ burnerEmail: this.state.burnerEmail });

            this.dom.inboxList.innerHTML = '<div style="padding:15px; text-align:center; color:#666;">Inbox Ready (SharkLasers)</div>';
            this.dom.openWebBtn.style.display = 'block';

        } catch (e) {
            console.error(e);
            this.dom.burnerEmail.textContent = "Connection Error";
            this.dom.inboxList.innerHTML = `<div style="padding:10px; color:red; text-align:center;">${e.message}</div>`;
        }
    }

    async checkInbox() {
        if (!this.state.burnerEmail || !this.state.burnerEmail.sid_token) return;

        const sid = this.state.burnerEmail.sid_token;
        this.dom.refreshMailBtn.textContent = "Checking...";

        try {
            const API = "https://api.guerrillamail.com/ajax.php";
            // Check list
            const res = await fetch(`${API}?f=get_email_list&offset=0&sid_token=${sid}`);
            const json = await res.json();

            // Guerrilla returns { list: [ ... ], count: ... }
            this.renderInbox(json.list || [], sid);

        } catch (e) {
            console.error(e);
            this.dom.inboxList.innerHTML = `<div style="padding:10px; color:#eda723; text-align:center;">
                API Error. Use Web View.
            </div>`;
        } finally {
            this.dom.refreshMailBtn.textContent = "Refresh";
        }
    }

    renderInbox(messages, sid) {
        this.dom.inboxList.innerHTML = '';
        if (!messages || messages.length === 0) {
            this.dom.inboxList.innerHTML = '<div style="padding:15px; text-align:center; color:#666;">No unread messages</div>';
            return;
        }

        messages.forEach(msg => {
            const div = document.createElement('div');
            div.className = 'email-item';
            // Guerrilla fields: mail_subject, mail_from, mail_excerpt
            div.innerHTML = `<div class="email-subject">${msg.mail_subject}</div><div class="email-from">${msg.mail_from}</div>`;

            div.onclick = () => {
                // To fetch full content: f=fetch_email&email_id=...
                const url = `https://api.guerrillamail.com/ajax.php?f=fetch_email&email_id=${msg.mail_id}&sid_token=${sid}`;

                const w = window.open("", "MailView", "width=600,height=600");
                w.document.write("Loading content...");

                fetch(url).then(r => r.json()).then(d => {
                    // body is in d.mail_body
                    w.document.body.innerHTML = `<h3>${d.mail_subject}</h3><p>From: ${d.mail_from}</p><hr>${d.mail_body}`;
                });
            };
            this.dom.inboxList.appendChild(div);
        });
    }


    // --- Tunnel ---
    checkProxyStatus() {
        chrome.proxy.settings.get({}, (config) => {
            const isControlled = (config.levelOfControl === 'controlled_by_this_extension');
            this.dom.proxyToggle.checked = isControlled;

            if (isControlled) {
                this.dom.proxyStatus.textContent = "Tunnel ACTIVE (Routing Traffic)";
                this.dom.proxyStatus.classList.add('active');
                this.toggleProxyInputs(false);
            } else {
                this.dom.proxyStatus.textContent = "Direct Connection (Tunnel Off)";
                this.dom.proxyStatus.classList.remove('active');
                this.toggleProxyInputs(true);
            }
        });
    }

    toggleProxyInputs(enabled) {
        this.dom.proxyHost.disabled = !enabled;
        this.dom.proxyPort.disabled = !enabled;
        this.dom.proxyType.disabled = !enabled;
    }

    toggleProxy(shouldEnable) {
        if (shouldEnable) {
            const config = {
                mode: "fixed_servers",
                rules: {
                    singleProxy: {
                        scheme: this.dom.proxyType.value,
                        host: this.dom.proxyHost.value,
                        port: parseInt(this.dom.proxyPort.value)
                    },
                    bypassList: ["localhost", "127.0.0.1"]
                }
            };

            chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
                this.checkProxyStatus();
                // Persist config
                chrome.storage.local.set({
                    proxyConfig: {
                        type: this.dom.proxyType.value,
                        host: this.dom.proxyHost.value,
                        port: this.dom.proxyPort.value
                    }
                });
            });
        } else {
            chrome.proxy.settings.clear({ scope: 'regular' }, () => this.checkProxyStatus());
        }
    }


    // --- Shield ---
    renderCurrentUA() {
        if (this.dom.uaToggle.checked) {
            this.dom.currentUA.innerHTML = `Spoofed: <span style="color:var(--accent-color)">${this.dom.uaProfile.value}</span>`;
        } else {
            this.dom.currentUA.innerHTML = `Real: <span style="color:#666">System Default</span>`;
        }
    }

    async updateShieldUA() {
        const enabled = this.dom.uaToggle.checked;
        const profile = this.dom.uaProfile.value;
        const RULE_ID = 999;

        await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [RULE_ID] });

        if (enabled) {
            const uaString = Utility.getUAString(profile);
            await chrome.declarativeNetRequest.updateDynamicRules({
                addRules: [{
                    "id": RULE_ID,
                    "priority": 1,
                    "action": {
                        "type": "modifyHeaders",
                        "requestHeaders": [{ "header": "User-Agent", "operation": "set", "value": uaString }]
                    },
                    "condition": { "urlFilter": "*", "resourceTypes": ["main_frame", "sub_frame", "xmlhttprequest"] }
                }]
            });
        }

        chrome.storage.local.set({ uaConfig: { enabled, profile } });
        this.renderCurrentUA();
    }

    applyWebRTC(enabled) {
        if (chrome.privacy?.network?.webRTCIPHandlingPolicy) {
            const policy = enabled ? 'disable_non_proxied_udp' : 'default_public_interface_only';
            chrome.privacy.network.webRTCIPHandlingPolicy.set({ value: policy });
        }
    }

    async applyUrlCleaner(enabled) {
        const RULE_ID = 888;
        await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [RULE_ID] });

        if (enabled) {
            const params = ["utm_source", "utm_medium", "utm_campaign", "fbclid", "gclid", "ref"];
            await chrome.declarativeNetRequest.updateDynamicRules({
                addRules: [{
                    "id": RULE_ID,
                    "priority": 1,
                    "action": {
                        "type": "redirect",
                        "redirect": { "transform": { "queryTransform": { "removeParams": params } } }
                    },
                    "condition": { "urlFilter": "*", "resourceTypes": ["main_frame"] }
                }]
            });
        }
    }
}


// --- Helper Utilities ---
class Utility {
    static generateFakeID() {
        const names = ["James", "John", "Robert", "Alice", "Sofia", "Emma"];
        const lasts = ["Smith", "Doe", "Wayne", "Stark", "Bond", "Hunt"];
        const name = `${names[Math.floor(Math.random() * names.length)]} ${lasts[Math.floor(Math.random() * lasts.length)]}`;

        // Luhn Generator
        let cc = "4";
        for (let i = 0; i < 14; i++) cc += Math.floor(Math.random() * 10);
        let sum = 0, isSecond = true;
        for (let i = cc.length - 1; i >= 0; i--) {
            let d = parseInt(cc[i]);
            if (isSecond) d *= 2;
            if (d > 9) d -= 9;
            sum += d;
            isSecond = !isSecond;
        }
        cc += ((sum * 9) % 10);
        return { name, cc: cc.match(/.{1,4}/g).join(' ') };
    }

    static randomString(len) {
        const c = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let s = '';
        for (let i = 0; i < len; i++) s += c[Math.floor(Math.random() * c.length)];
        return s;
    }

    static getUAString(key) {
        const UAs = {
            "win_chrome": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "mac_safari": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
            "linux_firefox": "Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0",
            "android_mobile": "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36",
            "iphone_mobile": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        };
        return UAs[key] || UAs["win_chrome"];
    }
}

// Initializer
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NoiseApp();
});

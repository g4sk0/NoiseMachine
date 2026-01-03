const https = require('https');

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function testApi() {
    console.log("Testing 1secmail API...");

    try {
        // 1. Get Active Domains
        console.log("1. Fetching Active Domains...");
        const domains = await fetchUrl("https://www.1secmail.com/api/v1/?action=getDomainList");
        console.log("   Active Domains:", domains);

        if (!domains || domains.length === 0) {
            console.error("   ❌ No active domains found!");
            return;
        }

        // 2. Generate a valid address
        const login = "testuser" + Math.floor(Math.random() * 1000);
        const domain = domains[0];
        const email = `${login}@${domain}`;
        console.log(`2. Generated Test Email: ${email}`);

        // 3. Check Inbox (Should be empty)
        console.log("3. Checking Inbox...");
        const msgs = await fetchUrl(`https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`);
        console.log("   Inbox Response:", msgs);
        console.log("   ✅ API seems compliant.");

    } catch (error) {
        console.error("❌ API Error:", error.message);
    }
}

testApi();

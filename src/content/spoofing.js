// spoofing.js - Fingerprint Defender

// We need to inject the actual code into the page's execution context
// because content scripts live in an isolated world and can't easily modify 
// native prototypes (like HTMLCanvasElement) visible to the page's JS.

const scriptContent = `
(function() {
    console.log("[NoiseMachine] Spoofing Protection Active");

    // --- Canvas Spoofing ---
    // The goal here is to return slightly different data every time 
    // or constant but unique data that differs from the real hardware.
    
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;

    // 1. Spoof toDataURL
    HTMLCanvasElement.prototype.toDataURL = function() {
        console.log("[NoiseMachine] Intercepted toDataURL");
        const ctx = this.getContext('2d');
        // If context isn't 2d (e.g. webgl), we might skip or handle differently.
        // For MVP, simplistic noise:
        
        // We only apply noise if it's likely a fingerprinting attempt.
        // But for MVP, we apply to everything to prove it works.
        
        // Strategy: We draw a tiny invisible pixel with random color before returning
        // This alters the hash of the image.
        if (ctx) {
             const shift = Math.floor(Math.random() * 10) - 5; // Random shift -5 to 5
             // Actually, modifying the canvas visible to user is bad UX.
             // A better way is to call the original, get the string, and modify it slightly?
             // No, that breaks the image format.
             
             // Better: Get the image data, add noise, put it back? No, slow.
             
             // "Fake" it by modifying the context fillStyle ever so slightly before they draw?
             // Hard to catch "when" they draw.
             
             // Standard approach: Overwrite getImageData to return noisy pixels.
        }
        
        // For toDataURL, it relies on the underlying buffer. 
        // We can't easily intercept the *generation* of the string without re-encoding.
        
        return originalToDataURL.apply(this, arguments);
    };

    // 2. Spoof getImageData (More effective for fingerprinting)
    CanvasRenderingContext2D.prototype.getImageData = function(x, y, w, h) {
        // console.log("[NoiseMachine] Intercepted getImageData");
        const imageData = originalGetImageData.apply(this, arguments);
        
        // Add subtle noise
        // We iterate through a few pixels and tweak the RGB values by +/- 1 or 2
        for (let i = 0; i < imageData.data.length; i += 4) {
             // Only tweak alpha or blue channel slightly randomly
             if (i % 50 === 0) { // Don't do every pixel, performance
                const noise = Math.floor(Math.random() * 4) - 2; // -2 to +2
                imageData.data[i+2] = Math.min(255, Math.max(0, imageData.data[i+2] + noise));
             }
        }
        return imageData;
    };
    
    // --- AudioContext Spoofing (Placeholder) ---
    // Similar logic can be applied to OfflineAudioContext
    
    // --- Screen Resolution Spoofing (Placeholder) ---
    // Object.defineProperty(window.screen, 'width', { get: () => 1920 });
    
})();
`;

// Inject the script
const script = document.createElement('script');
script.textContent = scriptContent;
(document.head || document.documentElement).appendChild(script);
script.remove();

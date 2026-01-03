# 📉 The Noise Machine (Beta 0.3.0)

> **"Data Poisoning for the Modern Web."**
> *Obfuscate your digital footprint by generating realistic background noise traffic and spoofing browser fingerprints.*

<p align="center">
  <img src="icons/readme.png" width="200" alt="Noise Machine Logo">
</p>

## 💀 What is this?
**The Noise Machine** is a privacy-focused Chrome Extension designed to combat surveillance capitalism and ad-tracking algorithms. Instead of just blocking trackers (which makes you unique), it **floods them with junk data**.

By mixing your real browsing habits with randomized, realistic "Noise" traffic (ranging from "Tractor Parts" to "Quantum Physics"), it renders your advertising profile useless.

## ⚡ Features

### 1. 📢 Noise Generator
- **Smart Traffic:** Visits random websites and performs search queries on Google/Bing/DDG in the background.
- **Categorized Keywords:** Uses terms from Finance, Tech, Medical, and Lifestyle to pollute your interests.
- **Stealth Mode:** Requests happen in the background (no open tabs).

### 2. 🔥 Burner Services (Client-Side)
- **Identity Gen:** Creates fake names and valid (Luhn check) credit card numbers for testing.
- **Burner Mail:** Integrated **Guerrilla Mail (SharkLasers)** client. Get a disposable inbox instantly without leaving the extension. Bypasses API blocks via header spoofing.

### 3. 🚇 Network Tunneling
- **Proxy Manager:** Route your traffic through SOCKS5 (Tor) or HTTP proxies.
- **Status Check:** Verifies if your proxy connection is active.

### 4. 🛡️ Privacy Shield
- **User-Agent Spoofing:** Pretend to be an iPhone, Linux Desktop, or Windows PC.
- **WebRTC Protection:** Blocks local IP leaks.
- **URL Cleaner:** Automatically strips `utm_`, `fbclid`, and other tracking parameters from links.

## 📦 Installation (Developer Mode)

Since this is a powerful privacy tool, it is not available on the Chrome Web Store.

1.  Download or Clone this repository.
2.  Open Chrome/Brave/Edge and go to `chrome://extensions`.
3.  Enable **Developer Mode** (top right toggle).
4.  Click **Load unpacked**.
5.  Select the `NoiseMachineExtension` folder.

## ⚠️ Disclaimer
**EDUCATIONAL USE ONLY.**
This tool is designed for privacy protection and research. The developer (**g4sk0**) is not responsible for any misuse.
- Do not use "Burner Services" for illegal activities.
- "Noise Generation" consumes bandwidth; use responsibly on metered connections.

---
**Dev by g4sk0** | *Stay hidden.* 🕵️‍♂️

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import path from 'path';
import { fileURLToPath } from 'url';

puppeteer.use(StealthPlugin());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define a persistent user data directory
const USER_DATA_DIR = path.join(__dirname, 'user_data');

async function setupAuth() {
    console.log('Launching browser for authentication setup...');
    console.log('Please log in to all services manually. The session will be saved.');
    console.log('Close the browser when you are done.');

    const browser = await puppeteer.launch({
        headless: false,
        userDataDir: USER_DATA_DIR,
        executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--start-maximized',
            '--disable-blink-features=AutomationControlled',
            '--use-fake-ui-for-media-stream',
            '--disable-infobars'
        ],
        ignoreDefaultArgs: ['--enable-automation'],
        defaultViewport: null
    });

    const urls = [
        'https://www.perplexity.ai/login',
        'https://chatgpt.com/auth/login',
        'https://gemini.google.com/',
        'https://claude.ai/login'
    ];

    for (const url of urls) {
        const page = await browser.newPage();
        try {
            await page.goto(url, { waitUntil: 'load', timeout: 60000 });
        } catch (e) {
            console.error(`Failed to load ${url}:`, e.message);
        }
    }

    // Close the initial blank page
    const pages = await browser.pages();
    if (pages.length > 0) {
        // Don't close the first one if it's one of the ones we just opened? 
        // Actually browser.newPage() opens new ones. page[0] is usually the blank one.
        // But let's just leave them all open.
    }

    // Keep the script running until the user closes the browser manually
    browser.on('disconnected', () => {
        console.log('Browser closed. Session saved.');
        process.exit(0);
    });
}

setupAuth();

import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import path from 'path';
import { fileURLToPath } from 'url';

chromium.use(StealthPlugin());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USER_DATA_DIR = path.join(__dirname, 'user_data_session');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Robust Loop-based Wait Function for Playwright
 */
async function waitForResponseStability(page, selectors, minLength = 20, stabilityDuration = 3000, maxWait = 90000) {
    let stableCount = 6; // 6 * 500ms = 3s
    let lastLength = 0;
    const startTime = Date.now();
    const selectorArr = Array.isArray(selectors) ? selectors : [selectors];

    while (Date.now() - startTime < maxWait) {
        const payload = await page.evaluate((sels) => {
            let bestText = "";
            let maxLength = 0;
            for (const sel of sels) {
                const els = document.querySelectorAll(sel);
                if (els.length > 0) {
                    const text = els[els.length - 1].innerText.trim();
                    if (text.length > maxLength) {
                        maxLength = text.length;
                        bestText = text;
                    }
                }
            }
            return { length: maxLength, text: bestText };
        }, selectorArr);

        if (payload.length > minLength) {
            if (payload.length === lastLength && payload.length > 0) {
                stableCount--;
            } else {
                stableCount = 6;
                lastLength = payload.length;
            }
        }

        if (stableCount <= 0) return payload.text;
        await delay(500);
    }

    console.log(`[Playwright Wait] Stability timeout for: ${selectorArr.join(', ')}`);
    return payload.text || "No response captured - Timeout";
}

export async function runExhaustiveAnalysis(prompt, onProgress) {
    let browserContext;
    try {
        // Use launchPersistentContext to maintain sessions
        browserContext = await chromium.launchPersistentContext(USER_DATA_DIR, {
            channel: 'msedge',
            headless: false,
            viewport: null,
            ignoreDefaultArgs: ['--enable-automation'],
            args: [
                '--start-maximized',
                '--no-sandbox',
                '--disable-gpu',
                '--disable-blink-features=AutomationControlled'
            ],
            slowMo: 50 // Slight delay for more human-like interaction
        });

        const page = browserContext.pages().length > 0 ? browserContext.pages()[0] : await browserContext.newPage();

        // Step 1: Initial Gathering
        onProgress({ status: 'step1_gathering', message: '각 AI로부터 초기 답변을 수집하고 있습니다...' });

        const initialResults = [];

        // We run them on the same page or different pages? 
        // Different pages are better for parallelism, but same context for session.

        initialResults.push({ name: 'Perplexity', text: await runPerplexity(browserContext, prompt).catch(e => `Error: ${e.message}`) });
        onProgress({ status: 'perplexity_done', message: 'Perplexity 답변 수집 완료' });

        initialResults.push({ name: 'ChatGPT', text: await runChatGPT(browserContext, prompt).catch(e => `Error: ${e.message}`) });
        onProgress({ status: 'chatgpt_done', message: 'ChatGPT 답변 수집 완료' });

        initialResults.push({ name: 'Gemini', text: await runGemini(browserContext, prompt).catch(e => `Error: ${e.message}`) });
        onProgress({ status: 'gemini_done', message: 'Gemini 답변 수집 완료' });

        initialResults.push({ name: 'Claude', text: await runClaude(browserContext, prompt).catch(e => `Error: ${e.message}`) });
        onProgress({ status: 'claude_done', message: 'Claude 답변 수집 완료' });

        // Step 2: Cross-Validation
        onProgress({ status: 'step2_validation', message: 'AI 에이전시 기반 상호 검증을 시작합니다...' });
        const combinedInitial = initialResults.map(r => `[${r.name}]: ${r.text}`).join('\n\n');
        const validationPrompt = `
        당신은 전문 분석가입니다. 아래는 동일한 질문("${prompt}")에 대해 4개의 AI가 내놓은 답변들입니다.
        각 답변의 정확성, 논리성, 최신성을 객관적으로 평가하고 서로 보완해야 할 점을 분석해주세요.
        
        ${combinedInitial}
        `.substring(0, 15000);

        onProgress({ status: 'validating', message: '답변들의 논리적 모순과 누락된 정보를 비교 분석 중...' });
        let validationReview = await runClaude(browserContext, validationPrompt).catch(() => null);

        if (!validationReview || validationReview.includes("Error") || validationReview.length < 100) {
            onProgress({ status: 'validating_fallback', message: 'Claude 검증 실패, Perplexity로 상호 검증을 시도합니다...' });
            validationReview = await runPerplexity(browserContext, validationPrompt).catch(() => "상호 검증 리포트를 생성할 수 없습니다.");
        }

        // Step 3: Synthesis
        onProgress({ status: 'step3_synthesis', message: '검증 결과를 바탕으로 최적의 최종 답변과 분석 리포트를 도출하고 있습니다...' });
        const synthesisPrompt = `
        질문: "${prompt}"
        당신은 4개의 AI의 답변을 분석하여 최고의 통찰을 제공하는 Senior AI Agent입니다.
        구조화된 마크다운으로 답변해주세요.
        
        초기 답변들:
        ${combinedInitial}
        
        상호 검증 내용:
        ${validationReview}
        `.substring(0, 15000);

        const optimalAnswer = await runPerplexity(browserContext, synthesisPrompt, 120000).catch(() => "최종 답변 도출 실패");

        return {
            results: {
                perplexity: initialResults[0].text,
                chatgpt: initialResults[1].text,
                gemini: initialResults[2].text,
                claude: initialResults[3].text
            },
            validationReport: validationReview,
            optimalAnswer: optimalAnswer,
            heroImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1000"
        };

    } finally {
        if (browserContext) await browserContext.close();
    }
}

async function runPerplexity(context, prompt, maxWait = 90000) {
    const page = await context.newPage();
    try {
        await page.goto('https://www.perplexity.ai/', { waitUntil: 'networkidle', timeout: 60000 });
        const inputSelector = 'textarea, [contenteditable="true"]';

        await page.waitForSelector(inputSelector, { timeout: 15000 });
        await page.fill(inputSelector, prompt);
        await delay(500);
        await page.keyboard.press('Enter');

        return await waitForResponseStability(page, ['.prose', '[class*="prose"]', '.default-article'], 50, 3000, maxWait);
    } finally { await page.close(); }
}

async function runChatGPT(context, prompt) {
    const page = await context.newPage();
    try {
        await page.goto('https://chatgpt.com/', { waitUntil: 'load', timeout: 60000 });
        const inputSelector = '#prompt-textarea';

        await page.waitForSelector(inputSelector, { timeout: 15000 });
        await page.fill(inputSelector, prompt);
        await delay(500);
        await page.keyboard.press('Enter');

        return await waitForResponseStability(page, ['.markdown', 'article', '.prose'], 50);
    } finally { await page.close(); }
}

async function runGemini(context, prompt) {
    const page = await context.newPage();
    try {
        await page.goto('https://gemini.google.com/app', { waitUntil: 'networkidle', timeout: 60000 });
        const inputSelector = 'div[contenteditable="true"], [aria-label="채팅 입력"], [aria-label="Prompt"], .input-area textarea';

        await page.waitForSelector(inputSelector, { timeout: 20000 });
        await page.click(inputSelector);

        // Using type with small delay for better human-like simulation
        await page.keyboard.type(prompt, { delay: 10 });
        await delay(500);
        await page.keyboard.press('Enter');

        // Wait for responding state to end
        await delay(3000);
        return await waitForResponseStability(page, ['model-response', '.message-content', '.chat-content', '.response-container-inner'], 50);
    } finally { await page.close(); }
}

async function runClaude(context, prompt) {
    const page = await context.newPage();
    try {
        await page.goto('https://claude.ai/new', { waitUntil: 'networkidle', timeout: 60000 });
        const inputSelector = 'div[contenteditable="true"], [aria-label="Write user message"], .ProseMirror, textarea';

        await page.waitForSelector(inputSelector, { timeout: 20000 });
        await page.click(inputSelector);
        await page.keyboard.type(prompt, { delay: 10 });
        await delay(500);

        const sendBtn = await page.$('button[aria-label="Send Message"], button[aria-label="Send message"], button:has-text("Send")');
        if (sendBtn && await sendBtn.isEnabled()) {
            await sendBtn.click();
        } else {
            await page.keyboard.press('Enter');
        }

        // Wait for response stability
        await delay(5000);
        return await waitForResponseStability(page, ['.font-claude-message', '[data-testid="message-content"]', '.grid-cols-1.gap-y-4', '.message-content'], 50);
    } finally { await page.close(); }
}

export async function saveToNotion(prompt, optimalAnswer, results) {
    let browserContext;
    try {
        browserContext = await chromium.launchPersistentContext(USER_DATA_DIR, { headless: false });
        const page = await browserContext.newPage();
        const notionUrl = process.env.NOTION_URL || "https://www.notion.so/";

        await page.goto(notionUrl, { waitUntil: 'networkidle' });
        await page.waitForSelector('.notion-sidebar-container', { timeout: 30000 });

        await page.keyboard.down('Control');
        await page.keyboard.press('n');
        await page.keyboard.up('Control');
        await delay(2000);

        await page.keyboard.type(`[AI분석] ${prompt.substring(0, 40)}...`);
        await page.keyboard.press('Enter');
        await delay(1000);

        let markdown = `# AI Search Analysis Report\n\n`;
        markdown += `## Original Prompt\n> ${prompt}\n\n---\n\n`;
        markdown += `## 🤖 AI Agency Synthesis Result\n\n${optimalAnswer}\n\n---\n\n`;
        markdown += `## 📊 Individual AI Responses\n\n`;
        for (const [ai, text] of Object.entries(results)) {
            markdown += `### ${ai.toUpperCase()}\n${text}\n\n`;
        }

        await page.evaluate((text) => {
            const el = document.createElement('textarea');
            el.value = text;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        }, markdown);

        await page.keyboard.down('Control');
        await page.keyboard.press('v');
        await page.keyboard.up('Control');

        await delay(3000);
        const finalUrl = page.url();
        return { success: true, url: finalUrl };
    } finally {
        if (browserContext) await browserContext.close();
    }
}

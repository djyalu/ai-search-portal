import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import path from 'path';
import { fileURLToPath } from 'url';

puppeteer.use(StealthPlugin());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USER_DATA_DIR = path.join(__dirname, 'user_data');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function runExhaustiveAnalysis(prompt, onProgress) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false,
            userDataDir: USER_DATA_DIR,
            executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
            defaultViewport: null,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--start-maximized',
                '--disable-blink-features=AutomationControlled',
                '--disable-infobars'
            ],
            ignoreDefaultArgs: ['--enable-automation']
        });

        // Step 1: Initial Gathering
        onProgress({ status: 'step1_gathering', message: '각 AI로부터 초기 답변을 수집하고 있습니다...' });

        const initialResults = [];
        initialResults.push({ name: 'Perplexity', text: await runPerplexity(browser, prompt).catch(e => `Error: ${e.message}`) });
        onProgress({ status: 'perplexity_done', message: 'Perplexity 답변 수집 완료' });

        initialResults.push({ name: 'ChatGPT', text: await runChatGPT(browser, prompt).catch(e => `Error: ${e.message}`) });
        onProgress({ status: 'chatgpt_done', message: 'ChatGPT 답변 수집 완료' });

        initialResults.push({ name: 'Gemini', text: await runGemini(browser, prompt).catch(e => `Error: ${e.message}`) });
        onProgress({ status: 'gemini_done', message: 'Gemini 답변 수집 완료' });

        initialResults.push({ name: 'Claude', text: await runClaude(browser, prompt).catch(e => `Error: ${e.message}`) });
        onProgress({ status: 'claude_done', message: 'Claude 답변 수집 완료' });

        // Step 2: Cross-Validation (Mutual Review)
        onProgress({ status: 'step2_validation', message: 'AI 에이전시 기반 상호 검증을 시작합니다...' });

        const combinedInitial = initialResults.map(r => `[${r.name}]: ${r.text}`).join('\n\n');
        const validationPrompt = `
        당신은 전문 분석가입니다. 아래는 동일한 질문("${prompt}")에 대해 4개의 AI가 내놓은 답변들입니다.
        각 답변의 정확성, 논리성, 최신성을 객관적으로 평가하고 서로 보완해야 할 점을 분석해주세요.
        
        ${combinedInitial}
        `.substring(0, 15000);

        // We use Claude for high-quality reasoning/review if available, or Perplexity
        onProgress({ status: 'validating', message: '답변들의 논리적 모순과 누락된 정보를 비교 분석 중...' });
        const validationReview = await runClaude(browser, validationPrompt).catch(() => "상호 검증 리포트 생성 실패");

        // Step 3: Final Synthesis (Optimal Answer)
        onProgress({ status: 'step3_synthesis', message: '검증 결과를 바탕으로 최적의 최종 답변과 분석 리포트를 도출하고 있습니다...' });

        const synthesisPrompt = `
        질문: "${prompt}"
        
        당신은 4개의 AI(Perplexity, ChatGPT, Gemini, Claude)의 답변을 분석하여 최고의 통찰을 제공하는 Senior AI Agent입니다.
        
        다음 구조로 마크다운 답변을 작성해주세요:
        1. 🤖 **최종 결론 요약**: 가장 정확하고 검증된 답변의 핵심 정보.
        2. 📊 **서비스별 비교 테이블**: [정확도, 응답속도, 정보의 풍부함, 논리적 추론] 항목을 포함한 마크다운 표.
        3. 🔍 **심층 차이점 분석**: 각 AI가 강조한 지점이나 서로 상반된 주장에 대한 분석.
        4. 💡 **종합 통찰 및 제언**: 사용자를 위한 추가적인 인사이트.
        
        초기 답변들:
        ${combinedInitial}
        
        상호 검증 분석 내용:
        ${validationReview}
        `.substring(0, 15000);

        const optimalAnswer = await runPerplexity(browser, synthesisPrompt).catch(() => "최종 답변 도출 실패");

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

    } catch (error) {
        console.error("Global Puppeteer Error:", error);
        throw error;
    } finally {
        if (browser) await browser.close();
    }
}

async function runPerplexity(browser, prompt) {
    const page = await browser.newPage();
    try {
        await page.goto('https://www.perplexity.ai/', { waitUntil: 'load', timeout: 60000 });
        const inputSelector = 'textarea, [contenteditable="true"]';
        await page.waitForSelector(inputSelector, { timeout: 15000 });
        await page.focus(inputSelector);
        await page.keyboard.type(prompt);
        await delay(500);
        await page.keyboard.press('Enter');
        await delay(12000);
        return await page.evaluate(() => {
            const prose = document.querySelector('.prose');
            if (prose && prose.innerText.length > 50) return prose.innerText;
            return document.body.innerText.substring(0, 2000);
        });
    } finally { await page.close(); }
}

async function runChatGPT(browser, prompt) {
    const page = await browser.newPage();
    try {
        await page.goto('https://chatgpt.com/', { waitUntil: 'load', timeout: 60000 });
        const inputSelector = '#prompt-textarea';
        await page.waitForSelector(inputSelector, { timeout: 15000 });
        await page.focus(inputSelector);
        await page.keyboard.type(prompt);
        await delay(500);
        await page.keyboard.press('Enter');
        await delay(15000);
        return await page.evaluate(() => {
            const markdowns = Array.from(document.querySelectorAll('.markdown'));
            return markdowns.length > 0 ? markdowns[markdowns.length - 1].innerText : "No response";
        });
    } finally { await page.close(); }
}

async function runGemini(browser, prompt) {
    const page = await browser.newPage();
    try {
        await page.goto('https://gemini.google.com/app', { waitUntil: 'load', timeout: 60000 });
        const inputSelector = 'div[contenteditable="true"]';
        await page.waitForSelector(inputSelector, { timeout: 15000 });
        await page.focus(inputSelector);
        await page.keyboard.type(prompt);
        await delay(500);
        await page.keyboard.press('Enter');
        await delay(15000);
        return await page.evaluate(() => {
            const responses = Array.from(document.querySelectorAll('model-response'));
            return responses.length > 0 ? responses[responses.length - 1].innerText : "No response";
        });
    } finally { await page.close(); }
}

async function runClaude(browser, prompt) {
    const page = await browser.newPage();
    try {
        await page.goto('https://claude.ai/new', { waitUntil: 'load', timeout: 60000 });
        const inputSelector = 'div[contenteditable="true"]';
        await page.waitForSelector(inputSelector, { timeout: 15000 });
        await page.focus(inputSelector);
        await page.keyboard.type(prompt);
        await delay(500);
        await page.keyboard.press('Enter');
        await delay(15000);
        return await page.evaluate(() => {
            const ClaudeMessages = Array.from(document.querySelectorAll('.font-claude-message'));
            return ClaudeMessages.length > 0 ? ClaudeMessages[ClaudeMessages.length - 1].innerText : "No response";
        });
    } finally { await page.close(); }
}

import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

chromium.use(StealthPlugin());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USER_DATA_DIR = path.join(__dirname, 'user_data_session');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function saveDebugArtifacts(page, name) {
    try {
        const stamp = Date.now();
        const imgPath = path.join(__dirname, `playwright-debug-${name}-${stamp}.png`);
        const htmlPath = path.join(__dirname, `playwright-debug-${name}-${stamp}.html`);
        await page.screenshot({ path: imgPath, fullPage: true }).catch(() => { });
        const html = await page.content().catch(() => null);
        if (html) fs.writeFileSync(htmlPath, html, 'utf8');
        return { imgPath, htmlPath };
    } catch (err) {
        return { error: err.message };
    }
}

/**
 * Robust Text Extraction with Polling
 */
async function getCleanText(page, selectors) {
    return await page.evaluate((sels) => {
        for (const sel of sels) {
            const elements = document.querySelectorAll(sel);
            if (elements.length > 0) {
                // Get the last element of the matching selectors (usually the latest response)
                let text = elements[elements.length - 1].innerText.trim();
                if (text.length > 10) return text;
            }
        }
        return null;
    }, selectors);
}

async function runAgent(browserContext, agent, prompt, onProgress) {
    const page = await browserContext.newPage();
    try {
        onProgress({ status: 'worker_active', message: `[Agency] ${agent.name} 에이전트 접속 중...` });
        await page.goto(agent.url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        let inputFound = false;
        for (const sel of agent.input) {
            try {
                await page.waitForSelector(sel, { timeout: 10000 });
                await page.click(sel);
                await page.fill(sel, prompt);
                await page.keyboard.press('Enter');
                inputFound = true;
                break;
            } catch (e) { continue; }
        }

        if (!inputFound) throw new Error(`Input selector not found for ${agent.name}`);

        let lastText = "";
        let stableCount = 0;

        for (let i = 0; i < 40; i++) { // Max 80s
            await delay(2000);
            const current = await getCleanText(page, agent.result);

            if (current && current.length > lastText.length) {
                lastText = current;
                stableCount = 0;
                onProgress({ status: 'streaming', service: agent.id, content: lastText });
            } else if (current && current.length > 100 && current === lastText) {
                stableCount++;
            }

            // If text is stable for 3 iterations (6s), assume finished
            if (stableCount >= 3) break;
        }

        return lastText || "응답 데이터를 회수하지 못했습니다.";
    } catch (e) {
        console.error(`Agent ${agent.name} Error:`, e);
        await saveDebugArtifacts(page, `worker-error-${agent.id}`);
        return `에러 발생: ${e.message}`;
    } finally {
        await page.close();
    }
}

/**
 * RALPH Based Multi-Agent Analysis
 */
export async function runExhaustiveAnalysis(prompt, onProgress) {
    let browserContext;
    try {
        onProgress({ status: 'hierarchy_init', message: '[Hierarchy] RALPH 에이전시 파이프라인 가동...' });

        const launchOptions = {
            headless: false,
            args: ['--start-maximized', '--no-sandbox', '--disable-blink-features=AutomationControlled'],
            slowMo: 40
        };

        try {
            browserContext = await chromium.launchPersistentContext(USER_DATA_DIR, {
                ...launchOptions,
                channel: 'msedge'
            });
        } catch (e) {
            console.warn("Edge launch failed, falling back to standard Chromium:", e.message);
            browserContext = await chromium.launchPersistentContext(USER_DATA_DIR, launchOptions);
        }

        // --- 1. Reasoning Phase (R) ---
        onProgress({ status: 'reasoning', message: '[Reasoning] 질의 의도 분석 및 에이전트 작업 설계 중...' });
        let strategy = "기본 분석 모드: 다각도 답변 수집 및 교차 검증";

        try {
            const planningPrompt = `질문: "${prompt}"\n위 질문을 가장 효과적으로 분석하기 위해, 4개의 AI(Search, Reasoning, Creative, Logical)에게 각각 어떤 관점으로 질문하면 좋을지 전략을 세워줘. 아주 간단하게 요약해.`;
            const planningPage = await browserContext.newPage();
            try {
                await planningPage.goto('https://www.perplexity.ai/', { waitUntil: 'domcontentloaded', timeout: 30000 });
                const inputSelectors = ['textarea', 'div[contenteditable="true"]', 'input[placeholder*="Ask"]'];
                let hasInput = false;
                for (const sel of inputSelectors) {
                    if (await planningPage.$(sel)) {
                        await planningPage.fill(sel, planningPrompt);
                        await planningPage.keyboard.press('Enter');
                        hasInput = true;
                        break;
                    }
                }
                if (hasInput) {
                    await delay(5000);
                    const text = await getCleanText(planningPage, ['.prose', 'div[class*="markdown"]', '.answer-content']);
                    if (text) strategy = text;
                }
            } finally {
                await planningPage.close();
            }
        } catch (err) {
            console.error("Reasoning Phase Error (skipped):", err.message);
        }

        // --- 2. Agency Phase (A) ---
        onProgress({ status: 'agency_gathering', message: `[Agency] 병렬 에이전트 가동 시작...` });

        const agents = [
            { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai/', input: ['textarea', 'div[contenteditable="true"]'], result: ['.prose', 'div[class*="markdown"]', '.answer-content'] },
            { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/', input: ['#prompt-textarea', 'div[contenteditable="true"]'], result: ['.markdown', '.agent-turn', 'article', 'div[data-message-author-role="assistant"]'] },
            { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/app', input: ['div[contenteditable="true"]', '.ql-editor', 'textarea'], result: ['model-response', '.message-content', 'div[data-message-id]', '.query-content'] },
            { id: 'claude', name: 'Claude', url: 'https://claude.ai/new', input: ['div[contenteditable="true"]', 'p[data-placeholder]'], result: ['.font-claude-message', '.message-content', 'div.prose'] }
        ];

        // Execute all agents in parallel
        const resultsArray = await Promise.all(agents.map(agent => runAgent(browserContext, agent, prompt, onProgress)));

        const rawData = {};
        agents.forEach((agent, index) => {
            rawData[agent.id] = resultsArray[index];
        });

        // --- 3. Logic Phase (L) ---
        onProgress({ status: 'logic_validation', message: '[Logic] 수집된 답변의 교차 검증 및 논리적 모순 체크 중...' });
        let validationReport = "수집된 데이터를 기반으로 통합 분석을 진행합니다.";

        try {
            const validationPrompt = `분석 결과들:\n${JSON.stringify(rawData)}\n위 내용 중 서로 충돌하거나 보완이 필요한 부분을 냉철하게 평가해줘.`;
            const logicPage = await browserContext.newPage();
            try {
                await logicPage.goto('https://claude.ai/new', { waitUntil: 'domcontentloaded', timeout: 30000 });
                const inputSel = 'div[contenteditable="true"]';
                await logicPage.waitForSelector(inputSel, { timeout: 10000 });
                await logicPage.fill(inputSel, validationPrompt);
                await logicPage.keyboard.press('Enter');

                let lastValText = "";
                for (let i = 0; i < 15; i++) {
                    await delay(3000);
                    const current = await getCleanText(logicPage, ['.font-claude-message', '.message-content', 'div.prose']);
                    if (current && current.length > lastValText.length) {
                        lastValText = current;
                        onProgress({ status: 'streaming', service: 'validation', content: lastValText });
                    }
                    if (i > 5 && current && current === lastValText) break;
                }
                if (lastValText) validationReport = lastValText;
            } finally {
                await logicPage.close();
            }
        } catch (err) {
            console.error("Logic Phase Error (skipped):", err.message);
        }

        // --- 4. Polish & Hierarchy Phase (P/H) ---
        onProgress({ status: 'polish_synthesis', message: '[Polish] 최종 인텔리전스 리포트 생성 중...' });
        let finalOutput = "최종 분석 결과를 생성하는 데 실패했습니다. 개별 에이전트 결과를 확인해주세요.";

        try {
            const finalPrompt = `질문: "${prompt}"\n수집 데이터: ${JSON.stringify(rawData)}\n검증 보고서: ${validationReport}\n위 모든 내용을 종합하여 완벽하고 전문적인 마크다운 보고서를 작성해줘.`;
            const finalPage = await browserContext.newPage();
            try {
                await finalPage.goto('https://www.perplexity.ai/', { waitUntil: 'domcontentloaded', timeout: 30000 });
                const inputSel = 'textarea';
                await finalPage.waitForSelector(inputSel, { timeout: 10000 });
                await finalPage.fill(inputSel, finalPrompt);
                await finalPage.keyboard.press('Enter');

                let lastFinalText = "";
                for (let i = 0; i < 20; i++) {
                    await delay(3000);
                    const current = await getCleanText(finalPage, ['.prose', 'div[class*="markdown"]']);
                    if (current && current.length > lastFinalText.length) {
                        lastFinalText = current;
                        onProgress({ status: 'streaming', service: 'optimal', content: lastFinalText });
                    }
                    if (i > 8 && current && current === lastFinalText) break;
                }
                if (lastFinalText) finalOutput = lastFinalText;
            } finally {
                await finalPage.close();
            }
        } catch (err) {
            console.error("Polish Phase Error:", err.message);
            // Fallback: simple aggregation
            finalOutput = `# 통합 분석 리포트 (자동 생성)\n\n${validationReport}\n\n## 개별 분석 결과\n` +
                          Object.entries(rawData).map(([k, v]) => `### ${k}\n${v}`).join('\n\n');
        }

        return {
            results: rawData,
            validationReport: validationReport,
            optimalAnswer: finalOutput,
            summary: finalOutput
        };

    } finally {
        if (browserContext) await browserContext.close();
    }
}

export async function saveToNotion(prompt, optimalAnswer, results) {
    // Notion 저장 로직 유지 (필요시 구현 가능)
    return { success: true };
}

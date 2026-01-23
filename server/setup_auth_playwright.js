import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import path from 'path';
import { fileURLToPath } from 'url';

chromium.use(StealthPlugin());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USER_DATA_DIR = path.join(__dirname, 'user_data_session');

async function setupAuth() {
    console.log('🚀 AI 서비스 통합 로그인을 시작합니다...');

    let context;
    try {
        context = await chromium.launchPersistentContext(USER_DATA_DIR, {
            channel: 'msedge',
            headless: false,
            viewport: null,
            ignoreDefaultArgs: ['--enable-automation'],
            args: [
                '--start-maximized',
                '--no-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled'
            ]
        });

        const pagesToOpen = [
            { name: 'Perplexity', url: 'https://www.perplexity.ai/' },
            { name: 'ChatGPT', url: 'https://chatgpt.com/' },
            { name: 'Gemini', url: 'https://gemini.google.com/app' },
            { name: 'Claude', url: 'https://claude.ai/new' }
        ];

        // 탭 열기
        for (let i = 0; i < pagesToOpen.length; i++) {
            const site = pagesToOpen[i];
            try {
                const page = (i === 0 && context.pages().length > 0)
                    ? context.pages()[0]
                    : await context.newPage();

                console.log(`[${site.name}] 오픈 중...`);
                await page.goto(site.url).catch(() => { });
            } catch (err) {
                console.log(`[${site.name}] 건너뜀 (이미 열려있거나 오류)`);
            }
        }

        console.log('\n--- 로그인 안내 ---');
        console.log('1. 각 탭에서 로그인을 완료하세요.');
        console.log('2. 완료 후 브라우저 창을 수동으로 닫으세요.');

        await new Promise((resolve) => {
            context.on('close', resolve);
        });

        console.log('✅ 세션 저장 완료!');

    } catch (error) {
        console.error('❌ 실행 에러:', error.message);
        console.log('팁: 수동으로 연 모든 Edge 브라우저를 닫고 다시 시도해 보세요.');
    }
}

setupAuth();

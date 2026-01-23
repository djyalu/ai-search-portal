import { runExhaustiveAnalysis } from './playwright_handler.js';
import dotenv from 'dotenv';
dotenv.config();

console.log("Starting Playwright-based Multi-Agent Functional Test...");

async function test() {
    try {
        const results = await runExhaustiveAnalysis(
            "Explain the difference between Llama 3.2 and GPT-4o in 2 bullet points.",
            (progress) => {
                console.log(`[PROGRESS] ${progress.status}: ${progress.message}`);
            }
        );

        console.log("\n--- PLAYWRIGHT TEST COMPLETED ---");
        console.log("Results Summary:", results.optimalAnswer.substring(0, 200) + "...");
        console.log("Individual AI Status:",
            Object.keys(results.results).map(key => `${key}: ${results.results[key] && !results.results[key].includes('Error') ? 'OK' : 'FAIL'}`).join(', ')
        );
        process.exit(0);
    } catch (error) {
        console.error("Playwright Test Failed:", error);
        process.exit(1);
    }
}

test();

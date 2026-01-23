import { runExhaustiveAnalysis } from './puppeteer_handler.js';
import dotenv from 'dotenv';
dotenv.config();

console.log("Starting Multi-Agent Functional Test...");

async function test() {
    try {
        const results = await runExhaustiveAnalysis(
            "Explain the difference between Llama 3.1 and Claude 3.5 Sonnet in 3 bullet points.",
            (progress) => {
                console.log(`[PROGRESS] ${progress.status}: ${progress.message}`);
            }
        );

        console.log("\n--- TEST COMPLETED ---");
        console.log("Results Summary:", results.optimalAnswer.substring(0, 200) + "...");
        console.log("Individual AI Status:",
            Object.keys(results.results).map(key => `${key}: ${results.results[key] ? 'OK' : 'FAIL'}`).join(', ')
        );
        process.exit(0);
    } catch (error) {
        console.error("Test Failed:", error);
        process.exit(1);
    }
}

test();

import HistoryDB from './history_db.js';

const all = HistoryDB.getAll();
console.log(`Total History Entries: ${all.length}`);
if (all.length > 0) {
    const latest = all[0];
    console.log('\n--- LATEST ENTRY ---');
    console.log(`Prompt: ${latest.prompt}`);
    console.log(`Created: ${latest.created_at}`);
    console.log(`Results: ${Object.keys(latest.results).join(', ')}`);
}
process.exit(0);

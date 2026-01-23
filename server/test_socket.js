import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

console.log('Testing Socket.io Integration...');

socket.on('connect', () => {
    console.log('Connected to server!');
    console.log('Sending start-analysis event...');
    socket.emit('start-analysis', 'Test prompt for final verification: What is the capital of France?');
});

socket.on('progress', (data) => {
    console.log(`[PROGRESS] ${data.status}: ${data.message}`);
});

socket.on('completed', (data) => {
    console.log('\n--- SUCCESS: Analysis Completed via Socket ---');
    console.log('Hero Image:', data.heroImage);
    console.log('Found results for:', Object.keys(data.results).join(', '));
    process.exit(0);
});

socket.on('error', (err) => {
    console.error('Socket Error:', err);
    process.exit(1);
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

// Timeout after 5 minutes
setTimeout(() => {
    console.error('Test timed out');
    process.exit(1);
}, 300000);

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { runExhaustiveAnalysis } from './puppeteer_handler.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('start-analysis', async (prompt) => {
        console.log(`Starting analysis for: ${prompt}`);
        try {
            const results = await runExhaustiveAnalysis(prompt, (step) => {
                socket.emit('progress', step);
            });
            socket.emit('completed', results);
        } catch (error) {
            console.error(error);
            socket.emit('error', 'Analysis failed');
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

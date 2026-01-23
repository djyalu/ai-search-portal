import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { runExhaustiveAnalysis, saveToNotion } from './playwright_handler.js';
import HistoryDB from './history_db.js';

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

// REST API Routes
app.get('/api/history', (req, res) => {
    try {
        const history = HistoryDB.getAll();
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

app.delete('/api/history/:id', (req, res) => {
    try {
        HistoryDB.delete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete history' });
    }
});

app.post('/api/notion/save', async (req, res) => {
    const { prompt, summary, results } = req.body;
    try {
        const response = await saveToNotion(prompt, summary, results);
        res.json({ success: true, url: response.url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message || 'Failed to save to Notion' });
    }
});

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('start-analysis', async (prompt) => {
        console.log(`Starting analysis for: ${prompt}`);
        try {
            const results = await runExhaustiveAnalysis(prompt, (step) => {
                socket.emit('progress', step);
            });

            // 히스토리 저장
            HistoryDB.save(prompt, results.results, results.summary);

            socket.emit('completed', results);
        } catch (error) {
            console.error(error);
            socket.emit('error', `Analysis failed: ${error.message}`);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

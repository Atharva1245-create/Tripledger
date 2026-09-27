import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import tripRoutes from './routes/tripRoutes';
import expenseRoutes from './routes/expenseRoutes';
import aiRoutes from './routes/aiRoutes';
import settlementRoutes from './routes/settlementRoutes';
import whatsappRoutes from './routes/whatsappRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'TripLedger Backend API', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/payments', settlementRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Something went wrong on the server. Please try again.' });
});

app.listen(PORT, () => {
  console.log(`🚀 TripLedger Backend running on http://localhost:${PORT}`);
});

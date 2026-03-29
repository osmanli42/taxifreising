import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './db';
import inquiriesRouter from './routes/inquiries';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4002;

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }
    const allowed = [
      'https://taxifreising.de',
      'https://www.taxifreising.de',
    ];
    if (allowed.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/admin/quote/:token', (req, res) => {
  const siteUrl = process.env.SITE_URL || 'http://localhost:4002';
  res.redirect(`${siteUrl}/admin-quote.html?token=${req.params.token}`);
});

app.use('/api/inquiries', inquiriesRouter);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Taxi Freising API running on port ${PORT}`);
  initializeDatabase()
    .then(() => console.log('Database ready.'))
    .catch((err) => console.error('Database init warning:', err.message));
});

export default app;

import * as dotenv from 'dotenv';
import path from 'path';
import express, { json } from 'express';
import cors from 'cors';
import notesRouter from './routes/notes';
import tasksRouter from './routes/tasks';
import settingsRouter from './routes/settings';
import aiRouter from './routes/ai';
import noteAssistantRouter from './routes/noteAssistant';
import authRouter from './routes/auth';
import executeRouter from './routes/execute';
import { SettingsService } from './services/settings';
import { DatabaseService } from './services/database';

// Load environment variables
const envPath = process.env.NODE_ENV === 'production' 
  ? path.resolve(process.cwd(), '.env.production')
  : path.resolve(process.cwd(), '.env.development.local');
dotenv.config({ path: envPath });

async function initializeServer() {
  const app = express();
  const port = process.env.PORT || 3001;

  // CORS configuration
  const allowedOrigins = [
    'http://localhost:3000',                // Local development
    'http://localhost:3001',                // Local backend
    'http://3.92.141.232',                    // EC2 instance
  ];

  // Configure middleware
  app.use(cors({
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Check if the origin is allowed
      const isAllowedOrigin = allowedOrigins.some(allowedOrigin => {
        if (allowedOrigin.includes('*')) {
          const pattern = new RegExp(allowedOrigin.replace('*', '.*'));
          return pattern.test(origin);
        }
        return allowedOrigin === origin;
      });

      if (isAllowedOrigin) {
        callback(null, true);
      } else {
        callback(new Error('CORS not allowed'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
  }));

  app.use(json({ limit: '50mb' }));

  // Middleware to log incoming requests
  app.use((req, res, next) => {
    console.log(`Received ${req.method} request for ${req.url}`);
    console.log('Request Body:', req.body);
    next(); // Pass control to the next middleware or route handler
  });

  // Handle preflight requests
  app.options('*', cors());

  // Initialize settings first
  try {
    await SettingsService.initialize();
    const settings = await SettingsService.getSettings();
    console.log('Settings initialized:', settings);

    // Set up routes under /api
    app.use('/api/settings', settingsRouter);
    app.use('/api/auth', authRouter);
    app.use('/api/notes', notesRouter);
    app.use('/api/tasks', tasksRouter);
    app.use('/api/ai', aiRouter);
    app.use('/api/note-assistant', noteAssistantRouter);
    app.use('/api/execute', executeRouter);

    // Health check endpoint with HTML response
    app.get('/api/health', (req, res) => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Wazo Notes Backend Health</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              .status { padding: 20px; border-radius: 5px; }
              .ok { background: #e7f5e7; color: #0a5d0a; }
              .error { background: #fee; color: #c00; }
            </style>
          </head>
          <body>
            <h1>Wazo Notes Backend Status</h1>
            <div class="status ok">
              <h2>✅ Backend is Running!</h2>
              <p>Server Time: ${new Date().toLocaleString()}</p>
              <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
              <p>Port: ${process.env.PORT || 8081}</p>
            </div>
            <h3>Available Endpoints:</h3>
            <ul>
              <li>/api/notes - Notes API</li>
              <li>/api/health - Health Check</li>
            </ul>
          </body>
        </html>
      `;
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    });

    // Add landing page route
    app.get('/', (req, res) => {
      res.json({
        status: 'ok',
        message: 'Wazo Notes Backend is running!',
        time: new Date().toISOString(),
        endpoints: {
          notes: '/api/notes',
          health: '/api/health'
        }
      });
    });

    const publicPath = path.join(__dirname, '../public');
    console.log('Public path:', publicPath);
    app.use(express.static(publicPath, {
      maxAge: '1y',
      etag: true,
      setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript');
        } else if (path.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css');
        }
      }
    }));
    console.log('Serving static files from:', publicPath);


    // Serve React app for any other routes (must be after API routes)
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });

    // Serve static files from the public directory
   
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Error during server initialization:', error);
    throw error;
  }
}

// Start server
initializeServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

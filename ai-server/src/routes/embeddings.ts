import { Router } from 'express';
import { generateEmbedding } from '../controllers/embeddings';
import { debounce } from '../middleware/rateLimit';

const router = Router();

router.post('/generate', debounce('generate-embedding', 1000), generateEmbedding);

export const embeddingsRouter = router;

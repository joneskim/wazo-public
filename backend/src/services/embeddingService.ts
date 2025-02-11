import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:3002';

export class EmbeddingService {
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/api/embeddings/generate`, {
        text
      });
      return response.data.embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  static async updateNoteEmbedding(noteId: string): Promise<void> {
    try {
      const note = await prisma.note.findUnique({
        where: { id: noteId }
      });

      if (!note) {
        throw new Error(`Note not found: ${noteId}`);
      }

      const embedding = await this.generateEmbedding(note.content);
      
      await prisma.$executeRaw`
        UPDATE "Note"
        SET content_vector = ${embedding}::vector
        WHERE id = ${noteId}
      `;
    } catch (error) {
      console.error(`Error updating embedding for note ${noteId}:`, error);
      throw error;
    }
  }

  static async findSimilarNotes(noteId: string, threshold: number = 0.7, limit: number = 5): Promise<Array<{ id: string; similarity: number }>> {
    try {
      const results = await prisma.$queryRaw`
        SELECT id, 1 - (content_vector <=> (
          SELECT content_vector 
          FROM "Note" 
          WHERE id = ${noteId}
        )) as similarity
        FROM "Note"
        WHERE id != ${noteId}
        AND 1 - (content_vector <=> (
          SELECT content_vector 
          FROM "Note" 
          WHERE id = ${noteId}
        )) > ${threshold}
        ORDER BY similarity DESC
        LIMIT ${limit}
      `;

      return results as Array<{ id: string; similarity: number }>;
    } catch (error) {
      console.error('Error finding similar notes:', error);
      throw error;
    }
  }
}

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import * as admin from 'firebase-admin';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

// Initialize Admin SDK
initializeApp({
  credential: applicationDefault(),
  storageBucket: 'gen-lang-client-0695399990-regalos'
});

const bucket = getStorage().bucket('gen-lang-client-0695399990-regalos');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Ensure local backend uploads directory exists (local cache)
const UPLOADS_ROOT = path.join(process.cwd(), 'uploads');
const LETTERS_DIR = path.join(UPLOADS_ROOT, 'letters');
if (!fs.existsSync(LETTERS_DIR)) {
  fs.mkdirSync(LETTERS_DIR, { recursive: true });
}

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static route to serve uploaded files directly
app.use('/uploads', express.static(UPLOADS_ROOT));

// Helper: Determine normalized file type
function getNormalizedFileType(filename: string, mimetype?: string): 'JPG' | 'GIF' | 'BMP' | 'PNG' | 'JPEG' {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.jpg') return 'JPG';
  if (ext === '.jpeg') return 'JPEG';
  if (ext === '.png') return 'PNG';
  if (ext === '.gif') return 'GIF';
  if (ext === '.bmp') return 'BMP';
  if (mimetype?.includes('png')) return 'PNG';
  if (mimetype?.includes('gif')) return 'GIF';
  if (mimetype?.includes('bmp')) return 'BMP';
  if (mimetype?.includes('jpeg')) return 'JPEG';
  return 'JPG';
}

// Helper: Delete old file from bucket and local storage
async function deleteOldFile(oldPicId: string, oldExt?: string) {
  if (!oldPicId) return;
  const sanitizedPicId = oldPicId.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!sanitizedPicId) return;

  console.log(`[Backend Storage] Removing old file with picId: ${sanitizedPicId}`);

  // 1. Remove from local disk
  try {
    const files = fs.readdirSync(LETTERS_DIR);
    for (const f of files) {
      if (f.startsWith(sanitizedPicId)) {
        fs.unlinkSync(path.join(LETTERS_DIR, f));
        console.log(`[Backend Storage] Deleted local cache: ${f}`);
      }
    }
  } catch (err) {
    console.warn('[Backend Storage] Error reading LETTERS_DIR:', err);
  }

  // 2. Remove from bucket
  const possibleExts = oldExt ? [oldExt] : ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
  for (const ext of possibleExts) {
    const cleanExt = ext.startsWith('.') ? ext : `.${ext}`;
    const storagePath = `letters/${sanitizedPicId}${cleanExt}`;
    try {
      await bucket.file(storagePath).delete();
      console.log(`[GCS] Successfully deleted: ${storagePath}`);
      break;
    } catch (e: any) {
      if (e.code !== 404) console.warn(`[GCS] Error deleting ${storagePath}:`, e.message);
    }
  }
}

const tempUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 },
});

// Photo Upload Handler
async function handlePhotoUpload(req: Request, res: Response, targetLetterId?: string) {
  try {
    const letterId = (targetLetterId || req.body?.letterId || 'unknown').toString();
    const oldPicId = (req.body?.oldPicId || '').toString();
    const oldExt = (req.body?.oldExt || '').toString();

    if (oldPicId) await deleteOldFile(oldPicId, oldExt);

    let fileBuffer: Buffer;
    let originalName = 'photo.jpg';
    let mimetype = 'image/jpeg';
    let size = 0;

    if (req.file) {
      fileBuffer = req.file.buffer;
      originalName = req.file.originalname;
      mimetype = req.file.mimetype;
      size = req.file.size;
    } else if (req.body?.photoBase64) {
      const base64Data = req.body.photoBase64.replace(/^data:image\/\w+;base64,/, '');
      fileBuffer = Buffer.from(base64Data, 'base64');
      originalName = req.body.originalName || 'photo.jpg';
      size = fileBuffer.length;
    } else {
      return res.status(400).json({ error: 'No photo provided' });
    }

    const picId = crypto.randomUUID();
    const rawExt = path.extname(originalName).toLowerCase() || '.jpg';
    const ext = rawExt.startsWith('.') ? rawExt : `.${rawExt}`;
    const finalFilename = `${picId}${ext}`;
    const storagePath = `letters/${finalFilename}`;
    const fileType = getNormalizedFileType(originalName, mimetype);

    // Store in local cache
    fs.writeFileSync(path.join(LETTERS_DIR, finalFilename), fileBuffer);

    // Store in GCS using Admin SDK
    const file = bucket.file(storagePath);
    await file.save(fileBuffer, {
      contentType: mimetype,
      metadata: {
        metadata: {
          picId,
          letterId,
          originalName,
          fileType,
          size: String(size),
        },
      },
    });

    return res.json({
      success: true,
      letterId,
      picId,
      photoUrl: `/api/photos/${picId}`,
      metadata: { picId, originalName, fileType, size, bucket: bucket.name, storagePath, uploadedAt: new Date().toISOString() },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: error.message });
  }
}

app.post('/api/upload-letter-photo', tempUpload.single('photo'), (req, res) => handlePhotoUpload(req, res));
app.post('/api/letters/:letterId/photo', tempUpload.single('photo'), (req, res) => handlePhotoUpload(req, res, req.params.letterId));

// Retrieve and dispatch
async function dispatchPhotoToUI(picId: string, req: Request, res: Response) {
  try {
    const sanitizedPicId = picId.replace(/[^a-zA-Z0-9_-]/g, '');
    const localFile = fs.readdirSync(LETTERS_DIR).find(f => f.startsWith(sanitizedPicId));
    if (localFile) return res.sendFile(path.join(LETTERS_DIR, localFile));

    // Fallback to GCS
    try {
      const file = bucket.file(`letters/${sanitizedPicId}.jpg`);
      const [exists] = await file.exists();
      if (exists) {
        const buffer = await file.download();
        res.setHeader('Content-Type', 'image/jpeg');
        return res.send(buffer[0]);
      }
      
      // If .jpg doesn't exist, try other common extensions
      const exts = ['.png', '.jpeg', '.gif', '.bmp'];
      for (const ext of exts) {
        const f = bucket.file(`letters/${sanitizedPicId}${ext}`);
        const [e] = await f.exists();
        if (e) {
          const buffer = await f.download();
          res.setHeader('Content-Type', `image/${ext.replace('.', '')}`);
          return res.send(buffer[0]);
        }
      }
    } catch (gcsErr) {
      console.warn('GCS download failed:', gcsErr);
    }
    res.status(404).json({ error: 'Not found' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

app.get('/api/photos/:picId', (req, res) => dispatchPhotoToUI(req.params.picId, req, res));
app.delete('/api/photos/:picId', async (req, res) => { await deleteOldFile(req.params.picId); res.json({ success: true }); });

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (_req, res) => res.sendFile(path.join(process.cwd(), 'dist', 'index.html')));
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }
  app.listen(3000, '0.0.0.0', () => console.log(`Server running on port 3000`));
}

startServer().catch(err => { console.error(err); process.exit(1); });

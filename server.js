import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { OpenAI } from 'openai';
import ytdl from 'ytdl-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

// Configurar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sua-chave-aqui'
});

// Configurar Multer para upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// =============================================
// ROTAS DA API
// =============================================

// Rota para transcrever YouTube
app.post('/api/transcribe-youtube', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ 
        error: 'URL do YouTube inválida' 
      });
    }

    console.log('Processando YouTube:', url);
    
    // Baixar áudio do YouTube
    const audioPath = `temp_youtube_${Date.now()}.mp3`;
    const audioStream = ytdl(url, {
      filter: 'audioonly',
      quality: 'highestaudio'
    });

    const writeStream = fs.createWriteStream(audioPath);
    audioStream.pipe(writeStream);

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Transcrever com OpenAI (ou simulação)
    let transcription;
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sua-chave-aqui') {
      const response = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: "whisper-1",
      });
      transcription = response.text;
    } else {
      // Simulação para demonstração
      transcription = `Transcrição simulada do vídeo YouTube: ${url}\n      \nEsta é uma demonstração. Para funcionar de verdade, você precisa:\n1. Configurar sua chave da OpenAI\n2. Adicionar OPENAI_API_KEY nas variáveis de ambiente\n\nO vídeo foi processado com sucesso e esta seria a transcrição real do áudio.`;
    }

    // Limpar arquivo temporário
    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }

    res.json({ transcription });

  } catch (error) {
    console.error('Erro YouTube:', error);
    res.status(500).json({ 
      error: 'Erro ao processar vídeo do YouTube: ' + error.message 
    });
  }
});

// Rota para transcrever Instagram
app.post('/api/transcribe-instagram', async (req, res) => {
  try {
    const { url } = req.body;
    
    console.log('Processando Instagram:', url);
    
    // Para Instagram, você precisaria usar bibliotecas específicas
    // Por enquanto, simulação
    const transcription = `Transcrição simulada do Instagram: ${url}\n    \nEsta é uma demonstração. Para Instagram funcionar de verdade, você precisa:\n1. Implementar downloader do Instagram (instaloader, etc.)\n2. Configurar autenticação se necessário\n3. Processar diferentes tipos de mídia (Reels, IGTV, Posts)\n\nO conteúdo seria baixado e transcrito automaticamente.`;

    res.json({ transcription });

  } catch (error) {
    console.error('Erro Instagram:', error);
    res.status(500).json({ 
      error: 'Erro ao processar vídeo do Instagram: ' + error.message 
    });
  }
});

// Rota para upload de arquivo
app.post('/api/transcribe-file', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    console.log('Processando arquivo:', req.file.filename);

    let transcription;
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sua-chave-aqui') {
      const response = await openai.audio.transcriptions.create({
        file: fs.createReadStream(req.file.path),
        model: "whisper-1",
      });
      transcription = response.text;
    } else {
      transcription = `Transcrição simulada do arquivo: ${req.file.originalname}\n      \nEsta é uma demonstração. O arquivo foi recebido com sucesso:\n- Nome: ${req.file.originalname}\n- Tamanho: ${(req.file.size / 1024 / 1024).toFixed(2)}MB\n- Tipo: ${req.file.mimetype}\n\nPara funcionar de verdade, configure sua chave da OpenAI.`;
    }

    // Limpar arquivo
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json({ transcription });

  } catch (error) {
    console.error('Erro arquivo:', error);
    res.status(500).json({ 
      error: 'Erro ao processar arquivo: ' + error.message 
    });
  }
});

// Servir frontend em produção
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Acesse: http://localhost:${PORT}`);
});


import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Rota para processar vídeos do YouTube
app.post('/api/transcribe/youtube', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL não fornecida' });
  }

  const outputDir = path.join(__dirname, 'downloads');
  const outputAudio = path.join(outputDir, 'audio.mp3');

  try {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    const ytDlpCmd = `yt-dlp -f bestaudio -o "${outputDir}/audio.%(ext)s" ${url}`;
    await execAsync(ytDlpCmd);

    const inputAudio = fs.readdirSync(outputDir).find(file => file.includes('audio.'));
    const inputPath = path.join(outputDir, inputAudio);

    const ffmpegCmd = `ffmpeg -i "${inputPath}" -vn -ar 44100 -ac 2 -b:a 128k "${outputAudio}" -y`;
    await execAsync(ffmpegCmd);

    res.json({ message: 'Download e conversão concluídos', path: outputAudio });
  } catch (err) {
    console.error('Erro:', err);
    res.status(500).json({ error: 'Falha ao processar vídeo do YouTube' });
  }
});

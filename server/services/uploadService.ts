import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configurar Multer para upload de arquivos na memória
const storage = multer.memoryStorage();
export const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos!'));
    }
  }
});

// Função para upload para Cloudinary
export const uploadToCloudinary = async (buffer: Buffer, filename: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: 'massagistas',
        public_id: `massagista_${Date.now()}`,
        transformation: [
          { width: 500, height: 500, crop: 'fill' }
        ]
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result!.secure_url);
        }
      }
    ).end(buffer);
  });
}; 
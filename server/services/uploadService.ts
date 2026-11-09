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
    if (["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(Object.assign(new Error('Envie uma imagem JPEG, PNG, WebP ou GIF.'), { status: 400 }));
    }
  }
});

// Função para upload para Cloudinary
export const uploadToCloudinary = async (buffer: Buffer, filename: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
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
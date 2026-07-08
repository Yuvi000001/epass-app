const multer = require('multer');

// In-memory storage — files are buffered then handed to firebaseStorageService,
// instead of being written to local disk (no Cloudinary needed either).
const storage = multer.memoryStorage();

const fileFilter = (allowedMimes) => (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) cb(null, true);
  else cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
};

const uploadAttachment = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter(['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']),
});

const uploadPhoto = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter: fileFilter(['image/jpeg', 'image/jpg', 'image/png']),
});

module.exports = { uploadAttachment, uploadPhoto };

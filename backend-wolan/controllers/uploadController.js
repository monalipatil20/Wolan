const path = require('path');

const Upload = require('../models/Upload');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/response');

const uploadSingleFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('File is required', 400);
  }

  const upload = await Upload.create({
    hub_id: req.body.hub_id || req.user.hub_id,
    uploaded_by: req.user.id,
    related_model: req.body.related_model,
    related_id: req.body.related_id,
    file_name: req.file.originalname,
    file_path: req.file.path,
    mime_type: req.file.mimetype,
    file_size: req.file.size,
  });

  return successResponse(res, 'File uploaded successfully', {
    upload: {
      ...upload.toObject(),
      public_path: path.basename(upload.file_path),
    },
  }, 201);
});

module.exports = {
  uploadSingleFile,
};
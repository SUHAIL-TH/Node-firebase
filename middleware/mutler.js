const multer = require("multer");

// Setup memory storage
let storage = multer.memoryStorage();

// File filter function to validate file types
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel' // .xls
    ];
    const allowedExtensions = ['.xlsx', '.xls'];

    // Validate MIME type
    const mimeTypeIsValid = allowedMimeTypes.includes(file.mimetype);
    // Validate file extension
    const extensionIsValid = allowedExtensions.some(extension => file.originalname.toLowerCase().endsWith(extension));

    // If both MIME type and extension are valid, accept the file
    if (mimeTypeIsValid && extensionIsValid) {
        cb(null, true);
    } else {
        // Otherwise, reject the file with an error
        cb(new Error('Invalid file type. Only Excel files are allowed.'), false);
    }
};

// Configure multer with storage and file filter
let upload = multer({
    storage: storage,
    fileFilter: fileFilter
});

// Export the configured multer instance
module.exports = {
    upload
};

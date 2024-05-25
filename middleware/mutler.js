const multer = require("multer");


let storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel' // .xls
    ];
    const allowedExtensions = ['.xlsx', '.xls'];

    const mimeTypeIsValid = allowedMimeTypes.includes(file.mimetype);
    const extensionIsValid = allowedExtensions.some(extension => file.originalname.endsWith(extension));

    if (mimeTypeIsValid && extensionIsValid) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only Excel files are allowed.'), false);
    }
};

let upload = multer({ storage: storage ,
    fileFilter:fileFilter
});

module.exports = {
    upload
};

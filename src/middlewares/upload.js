import multer from "multer";
import path from "path";
import fs from "fs";
import rootPath from "../helper/rootPath.js";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            let destPath;

            // If uploading profile picture, put it in uploads/profiles/<userId>
            if (req.originalUrl && req.originalUrl.includes("/upload-profile")) {
                // req.user must be populated by auth middleware before this
                if (!req.user || !req.user.id) {
                    return cb(new Error("Unauthorized for profile upload"));
                }
                destPath = path.join(rootPath, "uploads", "profiles", req.user.id.toString());
            } else {
                // Fallback for other uploads if needed later
                destPath = path.join(rootPath, "uploads", "misc");
            }

            if (!fs.existsSync(destPath)) {
                fs.mkdirSync(destPath, { recursive: true });
            }
            cb(null, destPath);
        } catch (err) {
            console.error("Error creating directory:", err);
            cb(err);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        // canvas.toBlob() uploads often have originalname="blob" with no extension,
        // so fall back to deriving the extension from the mime type.
        let ext = path.extname(file.originalname);
        if (!ext) {
            const mimeToExt = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif" };
            ext = mimeToExt[file.mimetype] || ".jpg";
        }
        cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed!"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

export default upload;

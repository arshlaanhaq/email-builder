const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const mongoose = require('mongoose');
const dotenv = require("dotenv");
const path = require('path');
const fs = require('fs');
const cors = require("cors");

const app = express();
dotenv.config();
const URI = process.env.MongoDBURI;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Unique filename
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
        }
    },
});

// Middleware
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors({
    origin: 'https://imaginative-conkies-36ddac.netlify.app/', // Replace with your actual Netlify URL
    methods: ['GET', 'POST'],
}));

// MongoDB connection
mongoose.connect(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB successfully!');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

const EmailConfigSchema = new mongoose.Schema({
    title: String,
    content: String,
    imageUrl: String,
});
const EmailConfig = mongoose.model('EmailConfig', EmailConfigSchema);

// API Endpoints
app.get('/getEmailLayout', async (req, res) => {
    try {
        const emailConfig = await EmailConfig.findOne().sort({ _id: -1 });

        if (!emailConfig) {
            return res.status(404).send('No email configuration found.');
        }

        const template = fs.readFileSync('./layout.html', 'utf8');
        const rendered = template
            .replace(/{{title}}/g, emailConfig.title)
            .replace(/{{content}}/g, emailConfig.content)
            .replace(/{{imageUrl}}/g, emailConfig.imageUrl);

        res.send(rendered);
    } catch (error) {
        console.error('Error fetching email layout:', error);
        res.status(500).send('An error occurred while fetching the layout.');
    }
});

app.post("/uploadImage", upload.single('image'), (req, res) => {
    if (!req.file) {
        console.error("No file uploaded");
        return res.status(400).json({ error: "No file uploaded" });
    }

    const imageUrl = `https://email-template-builder-7sb4.onrender.com/uploads/${req.file.filename}`;
    console.log('Image uploaded successfully:', imageUrl);
    res.json({ imageUrl });
});

app.post('/uploadEmailConfig', async (req, res) => {
    const { title, content, imageUrl } = req.body;
    await EmailConfig.create({ title, content, imageUrl });

    res.status(200).json({ message: "Email config saved successfully!" });
});

app.post('/renderAndDownloadTemplate', (req, res) => {
    const template = fs.readFileSync('./layout.html', 'utf8');
    let rendered = template
        .replace(/{{title}}/g, req.body.title)
        .replace(/{{content}}/g, req.body.content)
        .replace(/{{imageUrl}}/g, req.body.imageUrl);

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', 'attachment; filename=email-template.html');
    res.send(rendered);
});

// Uncomment below for production setup (if using React or any frontend in build folder)
// if (process.env.NODE_ENV === "production") {
//     const dirPath = path.resolve();
//     app.use(express.static("Frontend/build"));
//     app.get("*", (req, res) => {
//         res.sendFile(path.resolve(dirPath, "Frontend", "build", "index.html"));
//     })
// }

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log("Server is started on port " + PORT);
});

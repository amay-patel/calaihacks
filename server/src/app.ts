import express from "express";
import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import https from "https";
import { v4 as uuidv4 } from "uuid";

// Initialize Firebase
const serviceAccount = require("../serviceAccountKey.json");
initializeApp({
  credential: cert(serviceAccount),
  storageBucket: "calaihacks-47274.appspot.com",
});

const app = express();
const port = 3000;

app.use(express.json());

function fetchImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to fetch image: ${response.statusCode}`));
          return;
        }

        const data: any[] = [];
        response.on("data", (chunk) => {
          data.push(chunk);
        });
        response.on("end", () => {
          resolve(Buffer.concat(data));
        });
      })
      .on("error", reject);
  });
}

app.post("/upload", async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" });
    }

    // Fetch the image
    const buffer = await fetchImage(imageUrl);

    // Generate a unique filename
    const filename = `${uuidv4()}.jpg`;

    // Get a reference to the storage service
    const storage = getStorage();
    const bucket = storage.bucket();

    // Upload the image to Firebase Storage
    const file = bucket.file(filename);
    await file.save(buffer, {
      metadata: {
        contentType: "image/jpeg",
      },
      public: true,
    });

    // Get the public URL of the uploaded file
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    res.json({ message: "Image uploaded successfully", url: publicUrl });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

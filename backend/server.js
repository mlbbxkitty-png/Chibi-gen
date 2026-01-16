import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import fs from "fs";

const app = express();
const upload = multer({ dest: "uploads/" });

app.post("/api/generate-chibi", upload.single("image"), async (req, res) => {
  try {
    // 1️⃣ Create prediction
    const createResponse = await fetch(
      "https://api.replicate.com/v1/predictions",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "a9758cb5f9f32c5e7b7e3d77b6cce8b8b8a0c9b4b2f5a3cfa2a94b1f9bfa2c",
          input: {
            image: req.file.path,
            prompt:
              "cute chibi anime style, big eyes, pastel colors, soft shading, clean background",
          },
        }),
      }
    );

    let prediction = await createResponse.json();

    // 2️⃣ Poll until finished
    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed"
    ) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const pollResponse = await fetch(prediction.urls.get, {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
        },
      });

      prediction = await pollResponse.json();
    }

    if (prediction.status === "failed") {
      return res.status(500).json({ error: "Chibi generation failed" });
    }

    // 3️⃣ Send result image URL
    res.json({ image: prediction.output[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(3000, () => {
  console.log("✅ Chibi API running on port 3000");
});
        

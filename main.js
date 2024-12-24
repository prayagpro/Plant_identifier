import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import MarkdownIt from "markdown-it";
import "./style.css";

// 🔥 API Key 🔥
// Replace this with your Gemini API key
const API_KEY = "AIzaSyCfgAEabQlaTucD82d0AOYUeOR9qfq7Cts";

// DOM Elements
const form = document.querySelector("form");
const fileInput = document.getElementById("fileInput");
const promptInput = document.querySelector('input[name="prompt"]');
const output = document.querySelector(".output p");
const loader = document.getElementById("loader");
const progressBar = document.querySelector(".progress");
const themeToggle = document.getElementById("theme-toggle");
const imagePreview = document.getElementById("image-preview");
const speakButton = document.getElementById("speak-btn");

// Toggle Theme
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  document.querySelector("main").classList.toggle("dark-mode");
  themeToggle.textContent = document.body.classList.contains("dark-mode")
    ? "☀️ Light Mode"
    : "🌙 Dark Mode";
});

// Image Preview
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      imagePreview.innerHTML = `<img src="${reader.result}" alt="Plant Image Preview" style="max-width: 100%; border-radius: 8px;" />`;
    };
    reader.readAsDataURL(file);
  } else {
    imagePreview.innerHTML = "";
  }
});

// Start Progress Bar
function startProgress() {
  let width = 0;
  const interval = setInterval(() => {
    width += 10;
    progressBar.style.width = `${width}%`;
    if (width >= 100) clearInterval(interval);
  }, 200);
}

// Form Submission Handler
form.onsubmit = async (event) => {
  event.preventDefault();
  output.textContent = "Generating...";
  loader.style.display = "block";
  speakButton.style.display = "none";
  startProgress();

  try {
    // Ensure a file is uploaded
    if (!fileInput.files || fileInput.files.length === 0) {
      throw new Error("No file selected. Please upload an image.");
    }

    const file = fileInput.files[0];

    // Convert the image to Base64
    const imageBase64 = await convertFileToBase64(file);

    // Assemble the prompt and image data
    const contents = [
      {
        role: "user",
        parts: [
          { inline_data: { mime_type: file.type, data: imageBase64 } },
          { text: promptInput.value || "Analyze this plant image" },
        ],
      },
    ];

    // Initialize the Google Generative AI client
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });

    // Call the Gemini model and get a stream of results
    const result = await model.generateContentStream({ contents });

    // Render the response as markdown
    const buffer = [];
    const md = new MarkdownIt();
    for await (let response of result.stream) {
      buffer.push(response.text());
      output.innerHTML = md.render(buffer.join(""));
    }

    // Show the speech button
    speakButton.style.display = "inline-block";
  } catch (error) {
    // Handle errors and display them in the output area
    output.innerHTML = `<div class="error">Error: ${error.message || error}</div>`;
  } finally {
    loader.style.display = "none"; // Hide loader
    progressBar.style.width = "0%"; // Reset progress bar
  }
};

// Function to Convert File to Base64
async function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result.split(",")[1]; // Extract the Base64 part
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
}

// Speech Output
speakButton.addEventListener("click", () => {
  const utterance = new SpeechSynthesisUtterance(output.textContent);
  utterance.lang = "en-US";
  speechSynthesis.speak(utterance);
});

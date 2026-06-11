# Anticipate 🚀

**Financial Literacy, Gamified.**

Anticipate is a Duolingo-style financial literacy app designed to help young adults navigate the complexities of personal finance in the UK. From decoding your first payslip to saving for a mortgage, Anticipate provides bite-sized, personalized lessons tailored to your life stage and goals.

[![Build Android APK](https://github.com/Kush-06/Anticipate/actions/workflows/android-build.yml/badge.svg)](https://github.com/Kush-06/Anticipate/actions/workflows/android-build.yml)

---

## 📥 Download the Latest Version

You can download the latest development build of the Android APK directly from GitHub Actions:

👉 **[Download Latest Android APK](https://nightly.link/Kush-06/Anticipate/workflows/android-build/main/my-app-apk.zip)**

*(Note: This link always points to the latest build on the `main` branch. The APK is provided in a ZIP file.)*

---

## ✨ Key Features

- **🎓 Personalized Learning Path:** A custom curriculum generated based on your goals—whether you're a student, starting your first job, or planning to buy a home.
- **🧠 Sage AI Assistant:** Powered by Google Gemini, Sage provides personalized financial advice and helps you "decode" complex documents like payslips and mortgage offers.
- **📅 Financial Timeline:** A visual roadmap that anticipates your upcoming financial milestones (e.g., "Your first payslip lands in 3 days").
- **🎮 Gamified Lessons:** Bite-sized modules with interactive quizzes to test your knowledge and track your progress.
- **🔍 Jargon Decoder:** An interactive tool to help you understand the fine print in financial documents (ESIS, Payslips, etc.).
- **💬 Community Hub:** Join discussions with other users to share tips and ask questions.

---

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Mobile Wrapper:** Ionic Capacitor
- **Backend/Database:** Supabase (Auth, Postgres, Realtime)
- **AI Integration:** Google Gemini API
- **Styling:** Vanilla CSS (Custom UI/UX)
- **CI/CD:** GitHub Actions (Android builds)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Kush-06/Anticipate.git
   cd Anticipate
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and add your Supabase and Gemini credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_AI_PROVIDER=gemini
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

### Building for Android

To build the Android project locally, you need Android Studio and the Android SDK installed.

```bash
# Build the web assets
npm run build

# Sync with Capacitor
npx cap sync android

# Open in Android Studio
npx cap open android
```

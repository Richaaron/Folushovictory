# AI Assistant Setup Guide

Your application now includes **Google Gemini AI Assistant** - a free, powerful AI assistant integrated across all platforms (web, mobile, desktop).

## 🚀 Quick Setup

### 1. Get Your Free Google Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com)
2. Click **"Get API Key"** button
3. Select "Create API key in new project" or use existing project
4. Copy the generated API key
5. Keep this safe - it's your secret key!

### 2. Add Environment Variables

#### Backend (.env file)

Create or update your `.env` file in the `backend/` directory:

```env
GOOGLE_GEMINI_API_KEY=your_api_key_here
```

#### Frontend (frontend-vue/.env.local)

Create `.env.local` in `frontend-vue/` directory:

```env
VITE_API_URL=http://localhost:3000/api
```

For production, update to your deployed backend URL:
```env
VITE_API_URL=https://your-backend-domain.com/api
```

### 3. Install Dependencies

#### Backend

```bash
cd backend
npm install
```

The `@google/generative-ai` package has been added to `package.json`.

#### Frontend

No new frontend packages needed! We're using Axios which is already installed.

## 📱 Features

The AI Assistant provides:

### ✨ Core Features
- **Sidebar Chat Panel** - Always accessible from any page
- **Persistent Conversation** - Maintains context across messages
- **Real-time Responses** - Streams responses from Gemini AI
- **Message History** - See all past messages in current session
- **Error Handling** - Graceful error messages and recovery

### 🎯 Use Cases
- **Study Help** - Ask questions about subjects, assignments
- **Homework Assistance** - Get explanations and guidance
- **General Questions** - Information lookup and learning
- **Teaching Support** - Help for educators planning lessons
- **Administrative Help** - School operation questions

### 📲 Platform Support
- **Web** (Vue.js) - Full functionality
- **Mobile** (Android/Capacitor) - Native-like experience
- **Desktop** (Electron) - Standalone app support

## 🔧 Technical Details

### Architecture

```
Frontend (Vue.js) 
    ↓ axios
Backend (Express) 
    ↓ @google/generative-ai
Google Gemini API
```

### File Structure

**Backend:**
```
backend/
├── src/
│   └── routes/
│       └── ai.js              # AI endpoint handler
└── package.json               # Updated with Google AI SDK
```

**Frontend:**
```
frontend-vue/
├── src/
│   ├── components/
│   │   └── common/
│   │       └── AiAssistant.vue  # Sidebar chat UI
│   ├── stores/
│   │   └── aiStore.ts          # State management
│   ├── App.vue                 # Updated with AI component
│   └── main.ts                 # Already has Pinia
└── package.json                # No changes needed
```

## 🔐 Security Notes

- API key is stored on **backend only** (never exposed to frontend)
- All requests require authentication (JWT token)
- Messages are not stored permanently (unless you add a database)
- Each API request uses conversation history from current session
- Free tier has rate limits (consult Google documentation)

## 🚀 Running the Application

### Development

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend-vue
npm run dev
```

Visit `http://localhost:5173`

### Production

See existing deployment guides:
- `MULTI_PLATFORM_BUILD_GUIDE.md` - Full platform builds
- `build-and-release.bat` / `build-and-release.sh` - Release builds

## 💬 Using the AI Assistant

1. **Open Chat** - Click the purple chat button (bottom right)
2. **Type Message** - Enter your question or prompt
3. **Send** - Click send button or press `Ctrl+Enter`
4. **Get Response** - AI responds in real-time
5. **Continue Conversation** - Context is maintained

### Keyboard Shortcuts
- `Ctrl+Enter` - Send message (also `Cmd+Enter` on Mac)
- Click message button - Toggle sidebar open/closed

## 🎨 Customization

### Change Gemini Model

In `backend/src/routes/ai.js`, change:
```javascript
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
```

Available models:
- `gemini-2.0-flash` - Fastest, free tier friendly
- `gemini-1.5-pro` - More powerful
- `gemini-1.5-flash` - Balanced

### Customize Sidebar Appearance

Edit `frontend-vue/src/components/common/AiAssistant.vue`:
- Colors: Update gradient colors in `<style scoped>` section
- Size: Change `width: 380px` and `height: 600px`
- Position: Adjust `bottom` and `right` values

### Add System Prompt

Update the chat endpoint to add system context:

```javascript
// In backend/src/routes/ai.js
const systemPrompt = "You are a helpful educational assistant for a school management system...";
const formattedHistory = [
  { role: "user", parts: [{ text: systemPrompt }] },
  { role: "model", parts: [{ text: "Understood!" }] },
  ...conversationHistory
];
```

## 📊 Cost Management

**Google Gemini Free Tier:**
- Free usage within limits
- Typically sufficient for small to medium deployments
- Monitor usage in [Google AI Studio Dashboard](https://aistudio.google.com)

**Rate Limiting:**
- Add rate limiting to backend to control costs
- Consider caching common responses
- Implement conversation limits per user

## 🐛 Troubleshooting

### "AI service is not configured"
- ✅ Check `GOOGLE_GEMINI_API_KEY` in backend `.env`
- ✅ Verify API key is valid at Google AI Studio
- ✅ Restart backend server after adding API key

### Chat not sending messages
- ✅ Ensure you're logged in (AI requires authentication)
- ✅ Check network tab in browser DevTools
- ✅ Verify backend is running on correct port
- ✅ Check CORS settings if on different domain

### Error: "Please log in to use the AI assistant"
- ✅ The AI requires user authentication
- ✅ Complete login before using chat
- ✅ Token should auto-attach from auth store

### Slow responses
- ✅ First request may be slower (model loading)
- ✅ Check internet connection
- ✅ Verify Google API status at [status.cloud.google.com](https://status.cloud.google.com)

## 📚 Resources

- [Google Gemini API Docs](https://ai.google.dev/docs)
- [JavaScript SDK Guide](https://ai.google.dev/docs?lang=node)
- [AI Studio](https://aistudio.google.com) - Test API with UI
- [Pricing & Quotas](https://ai.google.dev/pricing)

## 🔄 Next Steps

### Enhancement Ideas
1. **Save Conversations** - Add database storage for chat history
2. **Multi-turn Context** - Better handling of long conversations
3. **Content Filtering** - Add custom guidelines for educational context
4. **Analytics** - Track usage patterns
5. **Mobile Optimization** - Touch-friendly improvements
6. **Offline Mode** - Cache common responses

### Integration Points
- Use AI for auto-grading essays
- Generate quiz questions
- Provide homework explanations
- Support teacher lesson planning
- Help with student inquiries

## ✅ Verification

Test your setup:

1. **Backend Test:**
   ```bash
   curl http://localhost:3000/api/ai/health
   ```
   
   Should return:
   ```json
   {
     "success": true,
     "configured": true,
     "service": "Google Gemini",
     "model": "gemini-2.0-flash"
   }
   ```

2. **Frontend Test:**
   - Login to application
   - Click chat button
   - Send test message
   - Should receive AI response

---

## 📞 Support

If you encounter issues:
1. Check troubleshooting section above
2. Review console logs in browser
3. Check backend logs
4. Verify API key validity
5. Test API directly at [Google AI Studio](https://aistudio.google.com)

---

**Congratulations! Your AI Assistant is ready to use! 🎉**

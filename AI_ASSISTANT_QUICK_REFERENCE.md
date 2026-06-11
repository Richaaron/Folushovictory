# AI Assistant Quick Reference

## 🎯 What's Been Added

Your Build IT software now has a **free Google Gemini AI Assistant** integrated across all platforms!

### Components Added:

✅ **Backend**
- `/api/ai/chat` - Endpoint to send messages to AI
- `/api/ai/health` - Endpoint to check AI service status
- Auto-routes requests through Google Gemini API

✅ **Frontend**
- `AiAssistant.vue` - Beautiful sidebar chat component
- `aiStore.ts` - Pinia store for chat state management
- Integrated into `App.vue` - Available on every page

## 🚀 Quick Start (5 minutes)

### Step 1: Get Free API Key
1. Go to https://aistudio.google.com
2. Click "Get API Key" → "Create API key in new project"
3. Copy the key

### Step 2: Add API Key to Backend
1. Edit `backend/.env` (create if missing)
2. Add: `GOOGLE_GEMINI_API_KEY=your_key_here`
3. Save

### Step 3: Install Dependencies
```bash
cd backend
npm install
```

### Step 4: Start Services
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend-vue && npm run dev
```

### Step 5: Test It!
- Open http://localhost:5173
- Login if needed
- Click purple chat button (bottom right)
- Type a question
- Get instant AI responses!

## 📋 Files Changed

### Created:
- `backend/src/routes/ai.js` - AI API endpoint
- `frontend-vue/src/stores/aiStore.ts` - Chat state
- `frontend-vue/src/components/common/AiAssistant.vue` - Chat UI
- `AI_ASSISTANT_SETUP.md` - Full setup guide
- `AI_ASSISTANT_QUICK_REFERENCE.md` - This file

### Modified:
- `backend/package.json` - Added @google/generative-ai
- `backend/src/index.js` - Imported AI router
- `frontend-vue/src/App.vue` - Added AI component
- `backend/.env.example` - Added GOOGLE_GEMINI_API_KEY

## ✨ Features

| Feature | Details |
|---------|---------|
| 💬 **Chat Interface** | Beautiful sidebar panel |
| 🧠 **AI Model** | Google Gemini 2.0 Flash |
| 🔐 **Authentication** | Requires login (JWT token) |
| 📱 **Multi-Platform** | Web, Mobile, Desktop |
| 💾 **Context Memory** | Maintains conversation history |
| ⚡ **Real-time** | Instant AI responses |
| 🎨 **Modern UI** | Gradient design, smooth animations |
| 📲 **Responsive** | Works on all screen sizes |

## 🎮 Using the AI Assistant

### Open Chat
- Click purple circle button (bottom right)

### Send Message
- Type your question
- Click send button or press `Ctrl+Enter`

### Keyboard Shortcuts
- `Ctrl+Enter` - Send (works on web)
- `Cmd+Enter` - Send (works on Mac)

### Clear History
- Click "Clear history" button (bottom of chat)

## 🔧 Configuration

### Change API Model
Edit `backend/src/routes/ai.js` line with:
```javascript
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
```

Options: `gemini-2.0-flash`, `gemini-1.5-pro`, `gemini-1.5-flash`

### Change Appearance
Edit colors in `AiAssistant.vue`:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Change Position
Adjust in `AiAssistant.vue`:
```css
bottom: 20px;  /* Distance from bottom */
right: 20px;   /* Distance from right */
```

## 🐛 Common Issues

| Issue | Fix |
|-------|-----|
| **"Not configured"** | Check GOOGLE_GEMINI_API_KEY in .env |
| **Can't send messages** | Login required - use the login page first |
| **No response** | Check internet, verify API key works |
| **Chat not visible** | Scroll to bottom right, check z-index |
| **CORS error** | Verify API_URL in frontend .env.local |

## 💰 Cost

**100% FREE**
- Google Gemini free tier has generous limits
- Monitor usage at https://aistudio.google.com
- No credit card needed to start

## 📚 Full Documentation

See `AI_ASSISTANT_SETUP.md` for:
- Detailed setup instructions
- Architecture explanation
- Security notes
- Customization guide
- Troubleshooting guide
- Enhancement ideas

## 🎓 Use Cases

### For Students:
- ✅ Ask homework questions
- ✅ Get study help
- ✅ Learn concepts
- ✅ Check understanding

### For Teachers:
- ✅ Generate lesson ideas
- ✅ Create quiz questions
- ✅ Get teaching strategies
- ✅ Answer student queries

### For Administrators:
- ✅ Get system help
- ✅ Answer operational questions
- ✅ Get school management tips
- ✅ Problem solving

## ✅ Verify Setup

1. **Check Backend Health:**
   ```bash
   curl http://localhost:3000/api/ai/health
   ```
   Expected response:
   ```json
   {
     "success": true,
     "configured": true,
     "service": "Google Gemini",
     "model": "gemini-2.0-flash"
   }
   ```

2. **Test in Frontend:**
   - Login
   - Click chat button
   - Send "Hello"
   - Should get AI response

## 🚀 Deploy to Production

The AI assistant works on all platforms:

1. **Web (Netlify/Render)**
   - Set `GOOGLE_GEMINI_API_KEY` in environment
   - Set `VITE_API_URL` to production backend URL

2. **Mobile (Android)**
   - Same backend endpoint
   - Component works via Capacitor

3. **Desktop (Electron)**
   - Same backend endpoint
   - Native desktop experience

## 📞 Support Resources

- [Google Gemini API Docs](https://ai.google.dev/docs)
- [Get API Key](https://aistudio.google.com)
- [Vue.js Docs](https://vuejs.org)
- [Pinia State Management](https://pinia.vuejs.org)

---

**Next**: Read `AI_ASSISTANT_SETUP.md` for complete setup instructions!

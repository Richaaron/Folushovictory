# Fly.io deployment guide

## 1. Install Fly CLI

On Windows PowerShell:

```powershell
winget install -e --id Fly-io.flyctl
```

## 2. Authenticate

```powershell
flyctl auth login
```

## 3. Deploy from the repo root

```powershell
flyctl launch --no-deploy
```

If the app name already exists, run:

```powershell
flyctl deploy
```

## 4. Set secrets

```powershell
flyctl secrets set JWT_SECRET=your_jwt_secret
flyctl secrets set SUPABASE_URL=your_supabase_url
flyctl secrets set SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
flyctl secrets set FRONTEND_ORIGIN=https://your-frontend-domain
```

## 5. Check deployment

```powershell
flyctl status
flyctl logs
```

## 6. Open the app

```powershell
flyctl open
```

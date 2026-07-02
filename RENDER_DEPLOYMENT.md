# Render deployment guide

## 1. Create the Render web service

1. Sign in to Render and create a new Web Service.
2. Connect this repository.
3. Choose the root directory as the repo root so Render can detect [render.yaml](render.yaml).
4. Render should pick up the backend service from the existing blueprint.

## 2. Configure environment variables

Set these values in the Render service environment section:

- `JWT_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FRONTEND_ORIGIN` (for example, your frontend domain)

## 3. Deploy

Render will build and deploy the backend from the `backend` folder using the existing blueprint.

## 4. Verify

After deployment, check:

- `https://<your-render-service>.onrender.com/health`
- `https://<your-render-service>.onrender.com/`

If the backend starts correctly, the health endpoint should return a JSON payload with `ok: true`.

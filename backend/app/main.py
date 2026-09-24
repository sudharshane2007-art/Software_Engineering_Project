from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .api.routes import router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS for local development with Vite React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(router)


@app.get("/")
def root():
    return {
        "message": "PII Sentinel Autonomous Detection & Redaction Engine is Running",
        "version": settings.VERSION,
        "docs": "/docs",
        "endpoints": {
            "health": "/api/health",
            "scan": "POST /api/scan",
            "redact": "POST /api/redact",
            "audit_logs": "GET /api/audit-logs",
            "audit_metrics": "GET /api/audit-metrics",
        },
    }

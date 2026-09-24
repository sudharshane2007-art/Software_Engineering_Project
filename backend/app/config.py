import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "PII Sentinel Backend"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "Autonomous Government PII Detection and Redaction API"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]
    
    # File limits
    MAX_FILE_SIZE_BYTES: int = 20 * 1024 * 1024  # 20 MB (SRS Section 2.6)
    SUPPORTED_EXTENSIONS: list[str] = [".pdf", ".png", ".jpg", ".jpeg", ".txt", ".csv", ".docx"]
    
    # Data governance retention
    RETENTION_HOURS: int = 24  # SRS Section 5.2

settings = Settings()


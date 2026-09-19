import os

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "AI Work OS")
    VERSION: str = os.getenv("VERSION", "1.0.0")
    API_V1_STR: str = os.getenv("API_V1_STR", "/api/v1")
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "ai_work_os_super_secret_jwt_key_2026_change_in_prod")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24 * 7)))
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/ai_work_os")
    USE_SQLITE_FALLBACK: bool = os.getenv("USE_SQLITE_FALLBACK", "true").lower() == "true"
    SQLITE_URL: str = os.getenv("SQLITE_URL", "sqlite+aiosqlite:///./ai_work_os.db")
    
    OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen2.5")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")
    MOCK_LLM_FALLBACK: bool = os.getenv("MOCK_LLM_FALLBACK", "true").lower() == "true"
    
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")

settings = Settings()

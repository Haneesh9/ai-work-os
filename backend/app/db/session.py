from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Determine active DB URL
db_url = settings.DATABASE_URL
use_sqlite = False

# Fallback check or configuration
if "sqlite" in db_url or settings.USE_SQLITE_FALLBACK:
    # Use SQLite for local development when Postgres is not up
    db_url = settings.SQLITE_URL
    use_sqlite = True

engine = create_async_engine(
    db_url,
    echo=False,
    connect_args={"check_same_thread": False} if use_sqlite else {}
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    async with engine.begin() as conn:
        # Import models so Base metadata is populated
        import app.models  # noqa
        
        # If Postgres, enable vector extension
        if not use_sqlite:
            try:
                from sqlalchemy import text
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            except Exception as e:
                logger.warning(f"Could not enable pgvector extension: {e}")
        
        await conn.run_sync(Base.metadata.create_all)

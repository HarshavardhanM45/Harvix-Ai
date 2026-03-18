import os
import psycopg2
from psycopg2.extras import RealDictCursor

# ---------------------------------------------------------------------------
# Load .env file written by setup_db.py (if it exists)
# ---------------------------------------------------------------------------
_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(_env_path):
    with open(_env_path) as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and "=" in _line and not _line.startswith("#"):
                _k, _v = _line.split("=", 1)
                # Strip spaces and quotes from the value so int() doesn't crash
                os.environ.setdefault(_k.strip(), _v.strip().strip('"').strip("'"))

# ---------------------------------------------------------------------------
# Connection config — values come from .env or env vars (set before import)
# ---------------------------------------------------------------------------
DB_CONFIG = {
    "host":     os.getenv("PG_HOST",     "localhost"),
    "port":     int(os.getenv("PG_PORT", "5432")),
    "dbname":   os.getenv("PG_DB",       "harvix_db"),
    "user":     os.getenv("PG_USER",     "postgres"),
    "password": os.getenv("PG_PASSWORD", "postgres"),
    "sslmode":  "require" if "supabase.co" in os.getenv("PG_HOST", "") else "prefer"
}


def get_connection():
    """Return a new psycopg2 connection using DB_CONFIG."""
    return psycopg2.connect(**DB_CONFIG)



def init_db():
    """Create tables if they don't already exist."""
    conn = get_connection()
    cur = conn.cursor()

    # --- Users ---
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id           SERIAL PRIMARY KEY,
            username     VARCHAR(100) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at   TIMESTAMPTZ DEFAULT NOW()
        );
    """)

    # --- Module progress ---
    # completed_tasks: JSONB array of booleans, one per homework item
    cur.execute("""
        CREATE TABLE IF NOT EXISTS module_progress (
            id              SERIAL PRIMARY KEY,
            user_id         INT REFERENCES users(id) ON DELETE CASCADE,
            topic_id        VARCHAR(100) NOT NULL,
            completed_tasks JSONB    DEFAULT '[]',
            is_completed    BOOLEAN  DEFAULT FALSE,
            updated_at      TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id, topic_id)
        );
    """)

    conn.commit()
    cur.close()
    conn.close()
    print("[DB] Tables initialized (users, module_progress)")

"""
Run this ONCE to create the harvix_db database and tables.
Usage: python setup_db.py
You'll need to know your postgres superuser password.
"""
import sys
import getpass

try:
    import psycopg2
except ImportError:
    print("ERROR: psycopg2 not installed. Run: pip install psycopg2-binary")
    sys.exit(1)

print("=" * 50)
print("  HARVIX AI — PostgreSQL Setup")
print("=" * 50)

pg_host     = input("Postgres host [localhost]: ").strip() or "localhost"
pg_port     = input("Postgres port [5432]: ").strip() or "5432"
pg_user     = input("Postgres superuser [postgres]: ").strip() or "postgres"
pg_password = getpass.getpass("Postgres password: ")
db_name     = input("Database name to create [harvix_db]: ").strip() or "harvix_db"

# 1. Connect to 'postgres' default db as superuser
print(f"\nConnecting as {pg_user}@{pg_host}:{pg_port}...")
try:
    conn = psycopg2.connect(
        host=pg_host, port=int(pg_port),
        dbname="postgres",  # connect to default db first
        user=pg_user, password=pg_password
    )
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(f"SELECT 1 FROM pg_database WHERE datname = '{db_name}'")
    exists = cur.fetchone()
    if not exists:
        cur.execute(f'CREATE DATABASE "{db_name}"')
        print(f"✓ Database '{db_name}' created.")
    else:
        print(f"✓ Database '{db_name}' already exists.")
    cur.close()
    conn.close()
except Exception as e:
    print(f"\nERROR connecting: {e}")
    print("Make sure PostgreSQL is running and credentials are correct.")
    sys.exit(1)

# 2. Connect to new DB and create tables
print(f"Creating tables in '{db_name}'...")
try:
    conn = psycopg2.connect(
        host=pg_host, port=int(pg_port),
        dbname=db_name, user=pg_user, password=pg_password
    )
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id           SERIAL PRIMARY KEY,
            username     VARCHAR(100) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at   TIMESTAMPTZ DEFAULT NOW()
        );
    """)
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
    print("✓ Tables created (users, module_progress).")
except Exception as e:
    print(f"\nERROR creating tables: {e}")
    sys.exit(1)

# 3. Write .env file so the backend knows the connection details
env_path = ".env"
with open(env_path, "w") as f:
    f.write(f"PG_HOST={pg_host}\n")
    f.write(f"PG_PORT={pg_port}\n")
    f.write(f"PG_DB={db_name}\n")
    f.write(f"PG_USER={pg_user}\n")
    f.write(f"PG_PASSWORD={pg_password}\n")

print(f"\n✓ Connection details saved to backend/{env_path}")
print("\n" + "=" * 50)
print("  Setup complete! You can now start the backend:")
print("  python main.py")
print("=" * 50)

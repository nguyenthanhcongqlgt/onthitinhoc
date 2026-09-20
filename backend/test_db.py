import psycopg2
import sys

db_url = "postgresql://neondb_owner:npg_sXxH5Nbjmnf3@ep-polished-mud-b3parsfs-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

try:
    print("Connecting to database...")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    print("Connected successfully.")
    
    # Check if tables exist
    cur.execute("SELECT tablename FROM pg_tables WHERE schemaname='public';")
    tables = cur.fetchall()
    print(f"Tables in public schema: {len(tables)}")
    
    # Check if users exist
    cur.execute("SELECT count(*) FROM authentication_user;")
    user_count = cur.fetchone()[0]
    print(f"Users in authentication_user: {user_count}")
    
    if user_count > 0:
        cur.execute("SELECT username, role, status FROM authentication_user LIMIT 5;")
        users = cur.fetchall()
        print("First 5 users:")
        for u in users:
            print(f"- {u}")
            
    conn.close()
except Exception as e:
    print(f"Error: {e}")

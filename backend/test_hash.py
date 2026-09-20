import psycopg2

db_url = "postgresql://neondb_owner:npg_sXxH5Nbjmnf3@ep-polished-mud-b3parsfs-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
conn = psycopg2.connect(db_url)
cur = conn.cursor()
cur.execute("SELECT username, password FROM authentication_user LIMIT 5;")
for row in cur.fetchall():
    print(f"User: {row[0]}, Hash: {row[1][:30]}...")
conn.close()

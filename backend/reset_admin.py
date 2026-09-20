import psycopg2
from django.contrib.auth.hashers import make_password

db_url = "postgresql://neondb_owner:npg_sXxH5Nbjmnf3@ep-polished-mud-b3parsfs-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
conn = psycopg2.connect(db_url)
cur = conn.cursor()

# Set admin password to '123456'
new_hash = make_password('123456')
cur.execute("UPDATE authentication_user SET password = %s WHERE username = 'admin'", (new_hash,))
conn.commit()
print("Updated admin password to 123456.")
conn.close()

import sqlite3
import os

db_path = r"d:\Kiểm tra trực tuyến\backend\db.sqlite3"
if not os.path.exists(db_path):
    print("Local db.sqlite3 does not exist.")
else:
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM authentication_user;")
        user_count = cur.fetchone()[0]
        print(f"Users in local SQLite: {user_count}")
        if user_count > 0:
            cur.execute("SELECT username, role, status FROM authentication_user LIMIT 20;")
            users = cur.fetchall()
            for u in users:
                print(f"- {u}")
        conn.close()
    except Exception as e:
        print(f"Error reading local SQLite: {e}")

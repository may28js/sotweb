import sqlite3
import os

db_path = r'F:\工作区\模块开发\StoryOfTimeLauncher\WebBackend\Server\storyoftime.db'
if not os.path.exists(db_path):
    print(f"Error: Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check users
print("Checking users...")
cursor.execute("SELECT Id, Username, AccessLevel FROM Users")
users = cursor.fetchall()

if not users:
    print("No users found in database.")
else:
    print(f"Found {len(users)} users:")
    for u in users:
        print(f"ID: {u[0]}, Username: {u[1]}, Level: {u[2]}")
        # If user is not level 3, promote them
        if u[2] < 3:
             print(f"Promoting user {u[1]} (ID: {u[0]}) to AccessLevel 3...")
             cursor.execute("UPDATE Users SET AccessLevel = 3 WHERE Id = ?", (u[0],))

conn.commit()
conn.close()
print("Admin promotion check complete.")
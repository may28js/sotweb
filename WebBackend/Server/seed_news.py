import sqlite3
import os

db_path = r'F:\工作区\模块开发\StoryOfTimeLauncher\WebBackend\Server\storyoftime.db'
if not os.path.exists(db_path):
    print(f"Error: Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Update all users to AccessLevel 3 (Owner) for dev purposes
cursor.execute("UPDATE Users SET AccessLevel = 3 WHERE Id = 1")
print(f"Updated {cursor.rowcount} users to AccessLevel 3")

# Check if News table is empty
cursor.execute("SELECT Count(*) FROM News")
count = cursor.fetchone()[0]

if count == 0:
    print("Seeding News...")
    news_items = [
        ('欢迎来到时光之语', '我们很高兴地宣布，时光之语官方网站现已上线！在这里您可以注册账号、查看最新资讯。', 'Admin', '2025-12-25 10:00:00', 'News'),
        ('服务器维护公告', '服务器将于本周五凌晨 3:00 进行例行维护，预计耗时 2 小时。', 'Admin', '2025-12-26 14:00:00', 'Maintenance'),
        ('双倍经验活动开启', '为了庆祝新站上线，本周末将开启双倍经验活动！快来加入冒险吧。', 'GM_Alex', '2025-12-27 09:00:00', 'Event')
    ]
    cursor.executemany("INSERT INTO News (Title, Content, Author, CreatedAt, Type) VALUES (?, ?, ?, ?, ?)", news_items)
    print(f"Inserted {cursor.rowcount} news items")
else:
    print(f"News table already has {count} items")

conn.commit()
conn.close()
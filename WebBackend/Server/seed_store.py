import sqlite3
import os

db_path = r'F:\工作区\模块开发\StoryOfTimeLauncher\WebBackend\Server\storyoftime.db'
if not os.path.exists(db_path):
    print(f"Error: Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check if Products table is empty
cursor.execute("SELECT Count(*) FROM Products")
count = cursor.fetchone()[0]

if count == 0:
    print("Seeding Products...")
    products = [
        ('霜之哀伤 (模型)', '巫妖王的传奇武器模型，仅供收藏展示。', 500, '', 'Item', 1001, -1),
        ('无敌的缰绳', '阿尔萨斯的战马，极其稀有。', 2000, '', 'Mount', 1002, -1),
        ('角色改名服务', '允许您更改一个角色的名称。', 100, '', 'Service', 0, -1),
        ('阵营转换服务', '将您的角色转换为对立阵营（联盟/部落）。', 300, '', 'Service', 0, -1),
        ('1000 金币', '游戏内金币包。', 50, '', 'Gold', 0, -1)
    ]
    cursor.executemany("INSERT INTO Products (Name, Description, Price, ImageUrl, Category, GameItemId, Stock) VALUES (?, ?, ?, ?, ?, ?, ?)", products)
    print(f"Inserted {cursor.rowcount} products")
else:
    print(f"Products table already has {count} items")

conn.commit()
conn.close()
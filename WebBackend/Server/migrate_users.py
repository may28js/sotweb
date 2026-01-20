import mysql.connector
import bcrypt
import datetime
import time

# Configurations
source_config = {
    'user': 'acore',
    'password': 'acore',
    'host': '38.55.125.89',
    'port': 3306,
    'database': 'acore_auth'
}

target_config = {
    'user': 'sotwow',
    'password': 'sot123852',
    'host': '38.55.125.89',
    'port': 3306,
    'database': 'storyoftime_community'
}

def get_password_hash(password):
    # Generate BCrypt hash (using $2a$ prefix as seen in existing data)
    salt = bcrypt.gensalt(rounds=11)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def migrate():
    print("Starting migration...")
    
    # 1. Fetch Legacy Users
    print("Connecting to Source (acore_auth)...")
    try:
        src_conn = mysql.connector.connect(**source_config)
        src_cursor = src_conn.cursor(dictionary=True)
        src_cursor.execute("SELECT id, username, email, joindate FROM account")
        legacy_users = src_cursor.fetchall()
        src_conn.close()
        print(f"Fetched {len(legacy_users)} users from source.")
    except Exception as e:
        print(f"Failed to connect to source: {e}")
        return

    # 2. Prepare Target
    print("Connecting to Target (storyoftime_community)...")
    try:
        tgt_conn = mysql.connector.connect(**target_config)
        tgt_cursor = tgt_conn.cursor()
    except Exception as e:
        print(f"Failed to connect to target: {e}")
        return

    default_password = "123456"
    print(f"Generating hash for default password: {default_password}")
    password_hash = get_password_hash(default_password)
    
    migrated_count = 0
    skipped_count = 0
    error_count = 0
    
    for user in legacy_users:
        username = user['username']
        email = user['email']
        joindate = user['joindate']
        
        # Normalize email
        if not email:
            email = f"{username}@placeholder.com"
        
        # Normalize username (ensure not empty)
        if not username:
            print(f"Skipping user with empty username (ID: {user['id']})")
            error_count += 1
            continue

        try:
            # Check if exists
            tgt_cursor.execute("SELECT Id FROM Users WHERE Username = %s OR Email = %s", (username, email))
            existing = tgt_cursor.fetchone()
            
            if existing:
                print(f"Skipping {username} (already exists)")
                skipped_count += 1
                continue
            
            # Insert
            sql = """
                INSERT INTO Users 
                (Username, Email, PasswordHash, CreatedAt, Points, Nickname, PreferredStatus, LastActiveAt, AccessLevel, LastReadGlobalNotifyAt)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            # Ensure joindate is valid
            created_at = joindate if joindate else datetime.datetime.now()
            
            tgt_cursor.execute(sql, (
                username, 
                email, 
                password_hash, 
                created_at, 
                0, # Points
                username, # Nickname
                0, # PreferredStatus
                created_at, # LastActiveAt
                0, # AccessLevel
                created_at # LastReadGlobalNotifyAt
            ))
            
            tgt_conn.commit()
            print(f"Migrated: {username}")
            migrated_count += 1
            
        except mysql.connector.Error as err:
            print(f"Error migrating {username}: {err}")
            tgt_conn.rollback()
            error_count += 1
            
    print("-" * 30)
    print(f"Migration Complete.")
    print(f"Total: {len(legacy_users)}")
    print(f"Migrated: {migrated_count}")
    print(f"Skipped: {skipped_count}")
    print(f"Errors: {error_count}")
    
    tgt_conn.close()

if __name__ == "__main__":
    migrate()

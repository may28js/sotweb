import mysql.connector
from mysql.connector import Error

# Configuration
config = {
    'host': '38.55.125.89',
    'user': 'sotwow',
    'password': 'sot123852',
    'port': 3306
}

def inspect_db():
    credentials_to_try = [
        ('acore', 'acore'),
        ('sotwow', 'sot123852'),
    ]
    
    for user, pwd in credentials_to_try:
        print(f"\nTrying user: {user}, password: {pwd}")
        try:
            config['user'] = user
            config['password'] = pwd
            conn = mysql.connector.connect(**config)
            if conn.is_connected():
                print(f"SUCCESS! Connected with {user}:{pwd}")
                cursor = conn.cursor()

                # 1. Show Databases
                cursor.execute("SHOW DATABASES")
                databases = [db[0] for db in cursor.fetchall()]
                print(f"Databases found: {databases}")

                # 2. Inspect acore_auth if exists
                if 'acore_auth' in databases:
                    print("\n--- Inspecting acore_auth ---")
                    try:
                        conn.database = 'acore_auth'
                        cursor.execute("SHOW TABLES")
                        tables = [t[0] for t in cursor.fetchall()]
                        # print(f"Tables in acore_auth: {tables}")
                        
                        if 'account' in tables:
                            print("Found 'account' table.")
                            cursor.execute("SELECT count(*) FROM account")
                            count = cursor.fetchone()[0]
                            print(f"Total accounts: {count}")
                    except Exception as e:
                        print(f"Error inspecting acore_auth: {e}")

                # 3. Inspect storyoftime_community if exists
                if 'storyoftime_community' in databases:
                    print("\n--- Inspecting storyoftime_community ---")
                    try:
                        conn.database = 'storyoftime_community'
                        cursor.execute("SHOW TABLES")
                        tables = [t[0] for t in cursor.fetchall()]
                        print(f"Tables in storyoftime_community: {tables}")
                        
                        if 'Users' in tables:
                            print("Found 'Users' table. Inspecting schema...")
                            cursor.execute("DESCRIBE Users")
                            for col in cursor.fetchall():
                                print(f"  {col[0]} ({col[1]})")
                            
                            cursor.execute("SELECT Id, Username, Email, CreatedAt FROM Users LIMIT 50")
                            print("Sample Users data:")
                            for row in cursor.fetchall():
                                print(f"  {row}")
                    except Exception as e:
                        print(f"Error inspecting storyoftime_community: {e}")

                cursor.close()
                conn.close()
                # Continue to next credential to test both
        except Error as e:
            print(f"Failed: {e}")

if __name__ == "__main__":
    inspect_db()

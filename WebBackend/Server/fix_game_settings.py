import mysql.connector

# Configuration
config = {
    'user': 'sotwow',
    'password': 'sot123852',
    'host': '38.55.125.89',
    'port': 3306,
    'database': 'storyoftime_community'
}

def fix_settings():
    print("Connecting to database...")
    try:
        conn = mysql.connector.connect(**config)
        cursor = conn.cursor(dictionary=True) # Use dictionary cursor
        print("Connecting to database...")

        # 1. Fetch current settings
        cursor.execute("SELECT * FROM GameServerSettings LIMIT 1")
        settings = cursor.fetchone()
        
        public_ip = '38.55.125.89'
        
        if not settings:
            # ... (omitted for brevity, handled in previous turn logic but using dictionary now is safer)
            print("No settings found. Please run the insert logic if needed.")
            return

        print("Current Settings:")
        # print(settings) # Debug
        
        current_world = settings.get('WorldServiceName')
        current_auth = settings.get('AuthServiceName')
        print(f"  WorldServiceName: {current_world}")
        print(f"  AuthServiceName: {current_auth}")
        
        # Correct Service Names based on VPS inspection
        correct_world_service = 'ac-w1.service'
        correct_auth_service = 'ac-a1.service'
        
        if current_world != correct_world_service or current_auth != correct_auth_service:
             print(f"\nMismatch detected! \n  DB: {current_world}/{current_auth} \n  VPS: {correct_world_service}/{correct_auth_service}")
             print("Updating database to match VPS service names...")
             update_sql = "UPDATE GameServerSettings SET WorldServiceName = %s, AuthServiceName = %s WHERE Id = %s"
             cursor.execute(update_sql, (correct_world_service, correct_auth_service, settings['Id']))
             conn.commit()
             print("Database updated successfully.")
        else:
             print("Service names match VPS configuration.")

        print(f"  Host: {settings['Host']}")
        print(f"  SoapHost: {settings['SoapHost']}")
        print(f"  SshHost: {settings['SshHost']}")
        
        # 2. Update to Public IP
        public_ip = '38.55.125.89'
        
        print(f"\nUpdating Hosts to {public_ip}...")
        
        sql = """
            UPDATE GameServerSettings 
            SET Host = %s, SoapHost = %s, SshHost = %s
            WHERE Id = %s
        """
        
        cursor.execute(sql, (public_ip, public_ip, public_ip, settings['Id']))
        conn.commit()
        
        print(f"Updated {cursor.rowcount} row(s).")
        
        cursor.close()
        conn.close()
        print("Success.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_settings()

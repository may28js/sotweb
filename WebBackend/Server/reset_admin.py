import mysql.connector
import bcrypt
import time

# Configuration
hostname = '38.55.125.89'
port = 3306
username = 'sotwow'
password = 'sot123852'
database = 'storyoftime_community'

def get_password_hash(password):
    # Generate BCrypt hash (using $2a$ prefix as seen in existing data)
    salt = bcrypt.gensalt(rounds=11)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def main():
    try:
        print("Connecting to database...")
        conn = mysql.connector.connect(
            host=hostname,
            port=port,
            user=username,
            password=password,
            database=database
        )
        cursor = conn.cursor()

        new_password = "123456"
        print(f"Generating hash for password: {new_password}")
        password_hash = get_password_hash(new_password)
        print(f"Hash: {password_hash}")

        print("Updating admin password...")
        cursor.execute("UPDATE Users SET PasswordHash = %s WHERE Username = 'admin' OR Username = 'Admin'", (password_hash,))
        conn.commit()
        
        print(f"Updated {cursor.rowcount} row(s).")

        conn.close()
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    main()

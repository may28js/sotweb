import paramiko
import time

# Configuration
hostname = '38.55.125.89'
port = 22
username = 'root'
password = 'ylykFZBW8281'

def run_command(client, command):
    print(f"Executing: {command}")
    stdin, stdout, stderr = client.exec_command(command)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    
    if out:
        print(f"[STDOUT]\n{out}")
    if err:
        print(f"[STDERR]\n{err}")
    
    return out

def main():
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(hostname, port=port, username=username, password=password)

        print("--- 1. Checking Docker Containers ---")
        run_command(client, "docker ps --format '{{.Names}} - {{.Status}}'")

        print("\n--- 2. Checking Backend Logs (Last 100 lines) ---")
        # Check for any exceptions or requests
        run_command(client, "docker logs --tail 100 storyoftime-community-backend")

        print("\n--- 3. Checking Admin User in Database ---")
        # Check if admin user exists and print basic info (excluding sensitive hash if possible, or just checking existence)
        run_command(client, 'mysql -u sotwow -psot123852 storyoftime_community -e "SELECT Id, Username, Email, CreatedAt FROM Users WHERE Username=\'admin\' OR Username=\'Admin\';"')
        
        print("\n--- 4. Checking Nginx Access Logs (Last 20 lines) ---")
        # See if requests are hitting Nginx
        run_command(client, "docker logs --tail 20 sot_nginx")

        client.close()
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    main()

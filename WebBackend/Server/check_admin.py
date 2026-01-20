import paramiko

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

        print("\n--- Checking Admin User in Database ---")
        # Check if admin user exists
        run_command(client, 'mysql -u sotwow -psot123852 storyoftime_community -e "SELECT Id, Username, Email, CreatedAt FROM Users WHERE Username=\'admin\' OR Username=\'Admin\';"')
        
        client.close()
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    main()

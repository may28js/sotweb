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

        print("--- Checking Docker Containers ---")
        containers = run_command(client, "docker ps --format '{{.Names}}'")
        print(f"Containers found:\n{containers}")

        db_container = "ac-database"
        if "ac-database" not in containers:
             # Try to find a container with 'db' or 'mysql' in the name
             for c in containers.split('\n'):
                 if 'db' in c or 'mysql' in c:
                     db_container = c
                     break
        
        print("--- Checking Open Ports on Host ---")
        run_command(client, "netstat -tulpn | grep LISTEN")
        
        client.close()
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    main()

import paramiko
import sys

hostname = '38.55.125.89'
username = 'root'
password = 'ylykFZBW8281'
port = 22

def run_command(ssh, command):
    print(f"\n>>> Executing: {command}")
    stdin, stdout, stderr = ssh.exec_command(command)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    print(f"Exit Code: {exit_status}")
    if out: print(f"Output:\n{out}")
    if err: print(f"Error:\n{err}")
    return out

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname, port=port, username=username, password=password)
    
    # 1. Check Docker Containers
    print("--- 1. Checking Docker Containers ---")
    run_command(client, "docker ps")
    
    # 2. Check sotweb directory content to find nginx config
    print("\n--- 2. Checking /root/sotweb directory ---")
    run_command(client, "ls -F /root/sotweb/")
    
    # 3. Read nginx.conf if exists
    print("\n--- 3. Reading Nginx Config ---")
    run_command(client, "cat /root/sotweb/nginx.conf")

    # 4. Check docker-compose.yml in sotweb to see how nginx is running
    print("\n--- 4. Reading Website Docker Compose ---")
    run_command(client, "cat /root/sotweb/docker-compose.yml")
    
    # 5. Check Community Backend Logs (latest 50 lines)
    print("\n--- 5. Community Backend Logs ---")
    run_command(client, "docker logs storyoftime-community-backend --tail 50")
    
    client.close()
except Exception as e:
    print(f"Connection Failed: {e}")

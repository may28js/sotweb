import paramiko
import time

# Configuration
hostname = '38.55.125.89'
port = 22
username = 'root'
password = 'ylykFZBW8281'  # Correct password from deploy_vps.py
# 从之前的 deploy_vps.py 可以看到密码是 Password123

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

        print("--- Checking Running Containers ---")
        run_command(client, "docker ps --format '{{.Names}}'")

        print("\n--- Fetching Logs for storyoftime-community-backend (Latest Errors) ---")
        run_command(client, "docker logs storyoftime-community-backend 2>&1 | grep -iE 'exception|error|fail' | tail -n 50")

        client.close()
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    main()

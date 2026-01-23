import paramiko
import sys

hostname = "38.55.125.89"
username = "root"
password = "ylykFZBW8281"
port = 22

def run_command(ssh, command):
    print(f"Running: {command}")
    stdin, stdout, stderr = ssh.exec_command(command)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(f"Output:\n{out}")
    if err: print(f"Error:\n{err}")
    return out

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname, port, username, password)
    
    print("--- Listing Directory ---")
    run_command(ssh, "ls -F /root/sotweb/")
    
    print("\n--- Docker Processes ---")
    run_command(ssh, "docker ps")
    
    print("\n--- Check sotcommunity directory ---")
    run_command(ssh, "ls -F /root/sotcommunity/")
    
    print("\n--- Check sotcommunity docker-compose ---")
    files = run_command(ssh, "ls /root/sotcommunity/docker-compose.yml")
    if "No such file" not in files:
        run_command(ssh, "cat /root/sotcommunity/docker-compose.yml")
    else:
        print("docker-compose.yml not found in sotcommunity")

    ssh.close()
except Exception as e:
    print(f"An error occurred: {e}")

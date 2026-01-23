import paramiko
import os


local_path = r"F:\工作区\模块开发\StoryOfTimeLauncher\webbackend\server\Program.cs"
remote_path = "/root/sotcommunity/Program.cs"

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname, port, username, password)
    
    sftp = ssh.open_sftp()
    print(f"Uploading {local_path} to {remote_path}...")
    sftp.put(local_path, remote_path)
    print("Upload successful.")
    sftp.close()
    
    print("Restarting Backend Container to apply changes...")
    # Build and restart backend
    stdin, stdout, stderr = ssh.exec_command("cd /root/sotcommunity && docker compose up --build -d backend")
    
    # Wait for completion
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    
    if out: print(f"Output:\n{out}")
    if err: print(f"Error:\n{err}")
    
    ssh.close()
except Exception as e:
    print(f"An error occurred: {e}")

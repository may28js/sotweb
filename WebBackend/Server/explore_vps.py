import paramiko
import sys

hostname = '38.55.125.89'
username = 'root'
password = 'ylykFZBW8281'
port = 22

def run_command(ssh, command):
    print(f"Executing: {command}")
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
    
    print("--- Docker Logs sot_server (Last 200 lines) ---")
    run_command(client, "docker logs sot_server --tail 200")
    
    client.close()
except Exception as e:
    print(f"Connection Failed: {e}")

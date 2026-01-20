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
    
    print("--- 1. Curl localhost:8080 ---")
    run_command(client, "curl -v --max-time 5 http://localhost:8080")
    
    print("\n--- 2. Curl 172.17.0.1:8080 ---")
    run_command(client, "curl -v --max-time 5 http://172.17.0.1:8080")
    
    print("\n--- 3. Curl Public IP:8080 ---")
    run_command(client, "curl -v --max-time 5 http://38.55.125.89:8080")
    
    print("\n--- 4. Check iptables (optional) ---")
    # run_command(client, "iptables -L -n | grep 8080")

    client.close()
except Exception as e:
    print(f"Connection Failed: {e}")

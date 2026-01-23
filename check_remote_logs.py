import paramiko

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
    
    print("--- Checking Backend Logs ---")
    run_command(ssh, "docker logs storyoftime-community-backend --tail 50")
    
    ssh.close()
except Exception as e:
    print(f"An error occurred: {e}")

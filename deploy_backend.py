import paramiko
import os
import tarfile
import sys

# Configuration
hostname = "38.55.125.89"
username = "root"
password = "ylykFZBW8281"
port = 22
local_path = r"F:\工作区\模块开发\StoryOfTimeLauncher\webbackend\server"
remote_path = "/root/sotcommunity"
archive_name = "backend_deploy.tar.gz"

def create_archive(source_dir, output_filename):
    print(f"Creating archive {output_filename} from {source_dir}...")
    with tarfile.open(output_filename, "w:gz") as tar:
        for root, dirs, files in os.walk(source_dir):
            # Exclude directories
            dirs[:] = [d for d in dirs if d not in ["bin", "obj", ".vs", ".git", "uploads"]]
            
            for file in files:
                if file.endswith(".zip") or file.endswith(".tar.gz") or file.endswith(".py"):
                    continue
                
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, source_dir)
                
                # Exclude specific files/paths
                if "wwwroot\\uploads" in file_path or "wwwroot/uploads" in file_path:
                    continue
                    
                tar.add(file_path, arcname=arcname)
    print("Archive created.")

def run_command(ssh, command):
    print(f"Remote Exec: {command}")
    stdin, stdout, stderr = ssh.exec_command(command)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(f"[OUT]\n{out}")
    if err: print(f"[ERR]\n{err}")
    if exit_status != 0:
        raise Exception(f"Command failed with exit code {exit_status}")

try:
    # 1. Create Archive
    create_archive(local_path, archive_name)
    
    # 2. Connect
    print("Connecting to VPS...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname, port, username, password)
    sftp = ssh.open_sftp()
    
    # 3. Upload
    print(f"Uploading {archive_name} to {remote_path}...")
    sftp.put(archive_name, f"{remote_path}/{archive_name}")
    sftp.close()
    
    # 4. Deploy
    print("Deploying...")
    
    # Combine commands to ensure state persistence (directory change)
    deployment_cmd = (
        f"cd {remote_path} && "
        f"tar -xzf {archive_name} && "
        f"rm {archive_name} && "
        f"docker compose down && "
        f"docker compose up -d --build"
    )
    
    run_command(ssh, deployment_cmd)
        
    print("Deployment completed successfully!")
    ssh.close()
    
    # Cleanup local archive
    if os.path.exists(archive_name):
        os.remove(archive_name)
        
except Exception as e:
    print(f"Deployment failed: {e}")
    sys.exit(1)

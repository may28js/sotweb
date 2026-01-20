import paramiko
import tarfile
import os
import time

# Configuration
HOSTNAME = '38.55.125.89'
USERNAME = 'root'
PASSWORD = 'ylykFZBW8281'
PORT = 22

LOCAL_SOURCE_DIR = r'F:\工作区\模块开发\StoryOfTimeLauncher\WebBackend\Server'
REMOTE_UPLOAD_PATH = '/root/backend_update.tar.gz'

WEBSITE_DIR = '/root/sotweb'
COMMUNITY_DIR = '/root/sotcommunity'

MYSQL_CONN_STRING = "Server=38.55.125.89;Port=3306;Database=storyoftime_community;Uid=sotwow;Pwd=sot123852;SslMode=None;"

def create_tar_archive(output_filename, source_dir):
    print(f"Creating archive {output_filename} from {source_dir}...")
    with tarfile.open(output_filename, "w:gz") as tar:
        for root, dirs, files in os.walk(source_dir):
            # Exclude build artifacts and hidden files
            dirs[:] = [d for d in dirs if d not in ['bin', 'obj', '.vs', '.git', '.idea']]
            
            for file in files:
                if file.endswith('.tar.gz') or file.endswith('.py'): continue
                
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, source_dir)
                # print(f"Adding {rel_path}")
                tar.add(full_path, arcname=rel_path)
    print("Archive created.")

def update_docker_compose_file(ssh, remote_file_path):
    print(f"Updating {remote_file_path} with MySQL connection string...")
    # Read file
    cmd = f"cat {remote_file_path}"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    content = stdout.read().decode()
    
    # Replace connection string line (simple string replacement for robustness)
    # Finding the line with ConnectionStrings__DefaultConnection
    lines = content.split('\n')
    new_lines = []
    for line in lines:
        if 'ConnectionStrings__DefaultConnection=' in line:
            # Preserve indentation
            indent = line.split('ConnectionStrings__DefaultConnection=')[0]
            new_lines.append(f"{indent}ConnectionStrings__DefaultConnection={MYSQL_CONN_STRING}")
        elif 'ASPNETCORE_ENVIRONMENT=' in line:
             indent = line.split('ASPNETCORE_ENVIRONMENT=')[0]
             new_lines.append(f"{indent}ASPNETCORE_ENVIRONMENT=Production")
        else:
            new_lines.append(line)
    
    new_content = '\n'.join(new_lines)
    
    # Write back
    # Use a temporary file and mv to avoid corruption
    temp_file = remote_file_path + ".tmp"
    sftp = ssh.open_sftp()
    with sftp.file(temp_file, 'w') as f:
        f.write(new_content)
    sftp.close()
    
    ssh.exec_command(f"mv {temp_file} {remote_file_path}")
    print("Docker compose updated.")

def update_nginx_conf(ssh, remote_file_path):
    print(f"Updating {remote_file_path}...")
    cmd = f"cat {remote_file_path}"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    content = stdout.read().decode()
    
    if '/community-api/' in content:
        print("Nginx already configured for community-api.")
        return

    # Add location block before the last '}' of the server block
    # This is tricky with regex, let's look for 'location /api/ {' and insert before it? 
    # Or just append inside server block.
    # The 'server' block ends with '}'. The 'http' block ends with '}'.
    # Let's find "location /api/" and insert before it.
    
    proxy_block = """
        location /community-api/ {
            proxy_pass http://38.55.125.89:8080/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    """
    
    if 'location /api/' in content:
        new_content = content.replace('location /api/', f"{proxy_block}\n        location /api/")
    else:
        print("Could not find anchor 'location /api/' in nginx.conf. Appending manually not safe.")
        return

    temp_file = remote_file_path + ".tmp"
    sftp = ssh.open_sftp()
    with sftp.file(temp_file, 'w') as f:
        f.write(new_content)
    sftp.close()
    
    ssh.exec_command(f"mv {temp_file} {remote_file_path}")
    print("Nginx config updated.")

def main():
    # 1. Create Archive
    create_tar_archive('backend.tar.gz', LOCAL_SOURCE_DIR)
    
    # 2. Connect
    print("Connecting to VPS...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOSTNAME, port=PORT, username=USERNAME, password=PASSWORD)
    sftp = client.open_sftp()
    
    # 3. Upload Archive
    print("Uploading archive...")
    sftp.put('backend.tar.gz', REMOTE_UPLOAD_PATH)
    
    # 4. Upload Prod Compose for Community
    print("Uploading docker-compose.prod.yml...")
    sftp.put('docker-compose.prod.yml', '/root/docker-compose.prod.yml')
    
    # 5. Execute Remote Commands
    print("Executing remote commands...")
    
    commands = [
        # Prepare Community Directory
        f"mkdir -p {COMMUNITY_DIR}",
        f"mv /root/docker-compose.prod.yml {COMMUNITY_DIR}/docker-compose.yml",
        f"tar -xzf {REMOTE_UPLOAD_PATH} -C {COMMUNITY_DIR}",
        
        # Prepare Website Directory (Update Code)
        # Note: Website expects code in {WEBSITE_DIR}/WebBackend/Server
        f"rm -rf {WEBSITE_DIR}/WebBackend/Server/*",
        f"tar -xzf {REMOTE_UPLOAD_PATH} -C {WEBSITE_DIR}/WebBackend/Server"
    ]
    
    for cmd in commands:
        print(f"Running: {cmd}")
        client.exec_command(cmd)
        # Wait a bit for IO
        time.sleep(1)

    # 6. Update Configurations
    update_docker_compose_file(client, f"{WEBSITE_DIR}/docker-compose.yml")
    update_nginx_conf(client, f"{WEBSITE_DIR}/nginx.conf")
    
    # 7. Restart Services
    # Website
    print("Restarting Website Server...")
    stdin, stdout, stderr = client.exec_command(f"cd {WEBSITE_DIR} && docker compose up -d --build server")
    print(stdout.read().decode())
    print(stderr.read().decode())
    
    # Community
    print("Starting Community Server...")
    # Force remove old container to avoid name conflict
    print("Removing old container...")
    stdin, stdout, stderr = client.exec_command("docker rm -f storyoftime-community-backend")
    print(stdout.read().decode())
    print(stderr.read().decode())
    
    stdin, stdout, stderr = client.exec_command(f"cd {COMMUNITY_DIR} && docker compose up -d --build")
    print(stdout.read().decode())
    print(stderr.read().decode())
    
    # Nginx
    print("Reloading Nginx...")
    stdin, stdout, stderr = client.exec_command(f"cd {WEBSITE_DIR} && docker compose restart nginx")
    print(stdout.read().decode())
    print(stderr.read().decode())

    print("Deployment Complete!")
    client.close()

if __name__ == "__main__":
    main()

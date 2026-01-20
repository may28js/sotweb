import paramiko
import sys

hostname = '38.55.125.89'
username = 'root'
password = 'ylykFZBW8281'
port = 22

nginx_conf = """worker_processes 1;

events { worker_connections 1024; }

http {
    sendfile on;

    server {
        listen 80;
        server_name localhost;

        location / {
            proxy_pass http://client:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Static Patch Files
        location /patch/ {
            root /usr/share/nginx/html;
            autoindex off;
            add_header Access-Control-Allow-Origin *;
        }


        location /community-api/ {
            # Use Docker Gateway IP to access host port 8080
            proxy_pass http://172.17.0.1:8080/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        location /api/ {
            proxy_pass http://server:8080;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /uploads/ {
            proxy_pass http://server:8080;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
"""

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
    
    # 1. Update nginx.conf
    print("--- 1. Updating nginx.conf ---")
    sftp = client.open_sftp()
    with sftp.file('/root/sotweb/nginx.conf', 'w') as f:
        f.write(nginx_conf)
    sftp.close()
    print("nginx.conf updated successfully.")
    
    # 2. Restart Nginx Container
    print("\n--- 2. Restarting Nginx Container ---")
    run_command(client, "docker restart sot_nginx")
    
    client.close()
except Exception as e:
    print(f"Operation Failed: {e}")

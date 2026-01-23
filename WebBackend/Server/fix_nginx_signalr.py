import paramiko
import time

hostname = '38.55.125.89'
username = 'root'
password = 'ylykFZBW8281'
port = 22

nginx_conf = """worker_processes 1;

events { worker_connections 1024; }

http {
    client_max_body_size 20M;
    sendfile on;

    map $http_upgrade $connection_upgrade {
        default upgrade;
        ''      close;
    }

    server {
        listen 80;
        server_name localhost;

        location / {
            proxy_pass http://client:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Static Patch Files
        location /patch/ {
            root /usr/share/nginx/html;
            autoindex off;
            add_header Access-Control-Allow-Origin *;
        }

        # SignalR Hubs - MUST be separate from /community-api/ to avoid /api/ prefix addition
        location /community-api/hubs/ {
            # Forward to /hubs/ on backend (remove /community-api prefix)
            rewrite ^/community-api/hubs/(.*) /hubs/$1 break;
            proxy_pass http://storyoftime-community-backend:8080;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # API Endpoints
        location /community-api/ {
            # Forward to /api/ on backend
            proxy_pass http://storyoftime-community-backend:8080/api/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        location /api/ {
            proxy_pass http://server:8080;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
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
            proxy_set_header Connection $connection_upgrade;
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
    return exit_status

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname, port=port, username=username, password=password)
    
    # 1. Write nginx.conf
    print("--- 1. Updating nginx.conf for SignalR ---")
    sftp = client.open_sftp()
    with sftp.file('/root/sotweb/nginx.conf', 'w') as f:
        f.write(nginx_conf)
    sftp.close()
    print("nginx.conf updated.")
    
    # 2. Reload Nginx
    print("\n--- 2. Reloading Nginx ---")
    run_command(client, "docker exec sot_nginx nginx -s reload")
    
    client.close()
    print("\nDone. Nginx updated.")
    
except Exception as e:
    print(f"Failed: {e}")

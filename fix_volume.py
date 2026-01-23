import paramiko

hostname = "38.55.125.89"
username = "root"
password = "ylykFZBW8281"
port = 22

# We need to modify sotcommunity/docker-compose.yml to mount /root/sotweb/uploads
# instead of ./uploads

new_docker_compose = """version: '3.8'

services:
  backend:
    build: .
    image: sotcommunity-backend
    container_name: storyoftime-community-backend
    restart: always
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=Server=38.55.125.89;Port=3306;Database=storyoftime_community;Uid=sotwow;Pwd=sot123852;SslMode=None;
      - Jwt__Key=this_is_a_very_secure_key_for_story_of_time_project_12345_and_it_is_now_long_enough_for_hmac_sha512
      - Jwt__Issuer=StoryOfTimeServer
      - Jwt__Audience=StoryOfTimeClient
    ports:
      - "8080:8080"
    volumes:
      # Fix: Mount the shared uploads directory from sotweb
      - /root/sotweb/uploads:/app/wwwroot/uploads
    networks:
      - sotweb_default

networks:
  sotweb_default:
    external: true
"""

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname, port, username, password)
    
    print("Updating sotcommunity/docker-compose.yml...")
    
    # Write the new content to a temporary file locally
    with open("docker-compose.yml.new", "w", encoding='utf-8') as f:
        f.write(new_docker_compose)
        
    # Upload
    sftp = ssh.open_sftp()
    sftp.put("docker-compose.yml.new", "/root/sotcommunity/docker-compose.yml")
    sftp.close()
    
    print("Restarting sotcommunity-backend...")
    stdin, stdout, stderr = ssh.exec_command("cd /root/sotcommunity && docker compose up -d backend")
    
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(f"Output:\n{out}")
    if err: print(f"Error:\n{err}")

    ssh.close()
    print("Done.")

except Exception as e:
    print(f"An error occurred: {e}")

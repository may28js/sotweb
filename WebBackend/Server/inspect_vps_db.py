import paramiko

# Configuration
hostname = '38.55.125.89'
port = 22
username = 'root'
password = 'ylykFZBW8281'

def run_command(client, command):
    print(f"Executing: {command}")
    stdin, stdout, stderr = client.exec_command(command)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    
    if out:
        print(f"[STDOUT]\n{out}")
    if err:
        print(f"[STDERR]\n{err}")
    
    return out

def main():
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(hostname, port=port, username=username, password=password)

        print("--- Checking Docker Containers for Database ---")
        run_command(client, "docker ps")

        print("\n--- Searching for AzerothCore Configs ---")
        # Look for .conf files in likely directories
        run_command(client, "find /root -name 'authserver.conf' -o -name 'worldserver.conf' | head -n 10")
        
        # Read authserver.conf or similar to get DB credentials
        print("\n--- Grepping for Database Info in found configs ---")
        # Find the files first, then grep
        files = run_command(client, "find /root -name 'authserver.conf'").split('\n')
        for f in files:
            if f.strip():
                print(f"Checking {f}...")
                run_command(client, f"grep -i 'LoginDatabaseInfo' {f}")
        
        # Also check docker-compose.yml for environment variables
        print("\n--- Checking Docker Compose Files ---")
        run_command(client, "find /root -name 'docker-compose.yml' -o -name 'docker-compose.yaml'")
        
        # Check for .env files
        print("\n--- Checking .env files ---")
        run_command(client, "find /root/azerothcore -name '.env' -o -name 'env.ac'")
        
        # Inspect sot_server container network
        print("\n--- Inspecting sot_server Network ---")
        run_command(client, "docker inspect sot_server --format '{{json .HostConfig.NetworkMode}}'")
        run_command(client, "docker inspect sot_server --format '{{json .NetworkSettings.Networks}}'")
        run_command(client, "docker inspect sot_server --format '{{json .HostConfig.ExtraHosts}}'")
        
        # Check hosts file inside container
        print("\n--- Checking /etc/hosts in sot_server ---")
        run_command(client, "docker exec sot_server cat /etc/hosts")

        # Check nginx.conf
        print("\n--- Checking Nginx Conf ---")
        run_command(client, "cat /root/sotweb/nginx.conf")
        run_command(client, "docker exec sot_nginx cat /etc/nginx/nginx.conf")

        client.close()
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    main()

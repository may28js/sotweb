
import paramiko

def inspect_overlay_usage():
    host = '38.55.125.89'
    port = 22
    username = 'root'
    password = 'ylykFZBW8281'

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        print(f"Connecting to {host}...")
        client.connect(host, port, username, password)
        
        print("\n--- Filesystem Disk Usage (df -h) ---")
        stdin, stdout, stderr = client.exec_command("df -h | grep overlay")
        print(stdout.read().decode())
        
        print("\n--- Docker Directory Size (/var/lib/docker) ---")
        stdin, stdout, stderr = client.exec_command("du -sh /var/lib/docker/*")
        print(stdout.read().decode())

        print("\n--- Top 10 Largest Docker Overlay Directories ---")
        # Find largest directories in overlay2 to identify which container/image ID owns them
        cmd = "du -sh /var/lib/docker/overlay2/* | sort -hr | head -n 10"
        stdin, stdout, stderr = client.exec_command(cmd)
        top_overlays = stdout.read().decode().strip().splitlines()
        print("\n".join(top_overlays))
        
        print("\n--- Correlating Overlay IDs to Images/Containers ---")
        # We need to map these long hashes back to images/containers if possible
        # This is complex via shell, but we can list image sizes directly
        stdin, stdout, stderr = client.exec_command("docker images --format 'table {{.Repository}}\\t{{.Tag}}\\t{{.Size}}\\t{{.ID}}'")
        print(stdout.read().decode())

        print("\n--- Inspecting Container Sizes (writable layers) ---")
        stdin, stdout, stderr = client.exec_command("docker ps -s --format 'table {{.Names}}\\t{{.Size}}\\t{{.Image}}'")
        print(stdout.read().decode())

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    inspect_overlay_usage()

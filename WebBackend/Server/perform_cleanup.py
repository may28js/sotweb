
import paramiko

def run_cleanup():
    host = '38.55.125.89'
    port = 22
    username = 'root'
    password = 'ylykFZBW8281'

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        print(f"Connecting to {host}...")
        client.connect(host, port, username, password)
        print("Connected.\n")

        cleaned_stats = []

        # 1. Clean System Journal
        print("Cleaning System Journal...")
        stdin, stdout, stderr = client.exec_command("journalctl --disk-usage")
        before = stdout.read().decode().strip()
        
        client.exec_command("journalctl --vacuum-size=100M")
        
        stdin, stdout, stderr = client.exec_command("journalctl --disk-usage")
        after = stdout.read().decode().strip()
        cleaned_stats.append(f"System Journal: {before} -> {after}")

        # 2. Clean APT Cache
        print("Cleaning APT Cache...")
        stdin, stdout, stderr = client.exec_command("du -sh /var/cache/apt")
        before = stdout.read().decode().split()[0]
        
        client.exec_command("apt-get clean")
        
        stdin, stdout, stderr = client.exec_command("du -sh /var/cache/apt")
        after = stdout.read().decode().split()[0]
        cleaned_stats.append(f"APT Cache: {before} -> {after}")

        # 3. Clean Docker
        print("Cleaning Docker (Build Cache & Unused)...")
        # Measure before
        stdin, stdout, stderr = client.exec_command("docker system df")
        # Just capturing output for reference isn't easy to parse for "total freed", 
        # so we rely on the prune command output.
        
        stdin, stdout, stderr = client.exec_command("docker system prune -f")
        prune_out = stdout.read().decode()
        
        # Extract "Total reclaimed" space if possible, usually at the end
        for line in prune_out.splitlines():
            if "Total reclaimed space:" in line:
                cleaned_stats.append(f"Docker Prune: {line.strip()}")

        # 4. Check for any large log files in /root/azerothcore/ and delete if they end in .log and are > 100M
        print("Checking for large rogue log files...")
        cmd = "find /root/azerothcore -name '*.log' -type f -size +100M"
        stdin, stdout, stderr = client.exec_command(cmd)
        large_logs = stdout.read().decode().splitlines()
        
        if large_logs:
            for log in large_logs:
                # Double check it's a log file
                if log.endswith(".log"):
                    # Get size
                    stdin, stdout, stderr = client.exec_command(f"du -h {log}")
                    size = stdout.read().decode().split()[0]
                    # Delete
                    client.exec_command(f"rm {log}")
                    cleaned_stats.append(f"Deleted Large Log: {log} ({size})")
        else:
            cleaned_stats.append("Large Game Logs: None found")

        print("\n--- Cleanup Report ---")
        for item in cleaned_stats:
            print(item)

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    run_cleanup()

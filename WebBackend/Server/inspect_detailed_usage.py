
import paramiko

def inspect_disk_usage_details():
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

        # 1. Check Root Directory Top Usage
        print("--- Top 20 Largest Directories/Files in / (excluding /proc, /sys, /dev) ---")
        # Find files larger than 50M
        cmd = "find / -type f -size +50M -not -path '/proc/*' -not -path '/sys/*' -not -path '/dev/*' -not -path '/run/*' -exec du -h {} + | sort -hr | head -n 20"
        stdin, stdout, stderr = client.exec_command(cmd)
        print(stdout.read().decode())

        # 2. Check /root specifically (often contains build artifacts)
        print("\n--- Detailed Usage in /root ---")
        stdin, stdout, stderr = client.exec_command("du -h --max-depth=2 /root | sort -hr | head -n 20")
        print(stdout.read().decode())

        # 3. Check /home
        print("\n--- Detailed Usage in /home ---")
        stdin, stdout, stderr = client.exec_command("du -h --max-depth=2 /home | sort -hr | head -n 10")
        print(stdout.read().decode())
        
        # 4. Check /usr/src (Kernel headers)
        print("\n--- Kernel Headers in /usr/src ---")
        stdin, stdout, stderr = client.exec_command("du -sh /usr/src/* 2>/dev/null")
        print(stdout.read().decode())

        # 5. Check old Snap versions (if snap is used)
        print("\n--- Snap Usage (if any) ---")
        stdin, stdout, stderr = client.exec_command("du -sh /var/lib/snapd/snaps 2>/dev/null")
        print(stdout.read().decode())

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    inspect_disk_usage_details()

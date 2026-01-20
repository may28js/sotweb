
import paramiko
import time

def run_command(client, command):
    print(f"Running: {command}")
    stdin, stdout, stderr = client.exec_command(command)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode(errors='replace').strip()
    err = stderr.read().decode(errors='replace').strip()
    if out:
        print(f"Output:\n{out}")
    if err:
        print(f"Error:\n{err}")
    return out

def perform_deep_cleanup():
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

        # 1. Remove specific large files
        print("--- 1. Removing Old Backups & Logs ---")
        files_to_remove = [
            "/root/backend_update.tar.gz",
            "/var/log/btmp.1",
            "/var/log/syslog.1",
            "/var/log/kern.log.1",
            "/var/log/auth.log.1"
        ]
        for f in files_to_remove:
            run_command(client, f"rm -f {f}")

        # 2. Remove Build Artifacts
        print("\n--- 2. Removing AzerothCore Build Artifacts ---")
        # Removing build directory (safe, just intermediate files)
        run_command(client, "rm -rf /root/azerothcore/build")
        
        # Removing .git directory (as requested, frees 1.1GB)
        run_command(client, "rm -rf /root/azerothcore/.git")

        # 3. Clean Snap Cache (Old Versions)
        print("\n--- 3. Cleaning Old Snap Versions ---")
        # Script to find disabled snaps and remove them
        snap_clean_script = """
        snap list --all | awk '/disabled/{print $1, $3}' |
        while read snapname revision; do
            snap remove "$snapname" --revision="$revision"
        done
        """
        run_command(client, snap_clean_script)
        
        # 4. System Autoremove (Old Kernels & Dependencies)
        print("\n--- 4. Running apt-get autoremove ---")
        # Non-interactive
        run_command(client, "DEBIAN_FRONTEND=noninteractive apt-get autoremove -y")
        run_command(client, "apt-get clean")

        # 5. Final Disk Check
        print("\n--- Final Disk Usage ---")
        run_command(client, "df -h /")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    perform_deep_cleanup()

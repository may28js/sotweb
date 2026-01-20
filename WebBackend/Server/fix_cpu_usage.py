
import paramiko
import time

def fix_cpu_usage():
    host = '38.55.125.89'
    port = 22
    username = 'root'
    password = 'ylykFZBW8281'

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        print(f"Connecting to {host}...")
        client.connect(host, port, username, password)
        print("Connected.")

        conf_file = "/root/azerothcore/env/dist/etc/worldserver.conf"
        
        # 1. Backup config
        print("Backing up config...")
        client.exec_command(f"cp {conf_file} {conf_file}.bak")

        # 2. Disable Console using sed
        print("Disabling Console.Enable...")
        # Use sed to replace Console.Enable = 1 with Console.Enable = 0
        cmd = f"sed -i 's/^Console.Enable = 1/Console.Enable = 0/' {conf_file}"
        run_command(client, cmd)

        # 3. Verify change
        print("Verifying change...")
        run_command(client, f"grep 'Console.Enable' {conf_file}")

        # 4. Restart Service
        print("Restarting ac-w1.service...")
        run_command(client, "systemctl restart ac-w1")

        # 5. Wait a moment and check CPU
        print("Waiting 5 seconds for stabilization...")
        time.sleep(5)
        
        print("\n--- Checking CPU Usage Again ---")
        run_command(client, "top -b -n 1 | head -n 10")
        
        # 6. Check Journal for spam
        print("\n--- Checking Journal (should be clean now) ---")
        run_command(client, "journalctl -u ac-w1.service -n 10 --no-pager")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        client.close()

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

if __name__ == "__main__":
    fix_cpu_usage()

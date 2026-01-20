
import paramiko
import time

def run_command(client, command, print_output=True):
    print(f"Running: {command}")
    stdin, stdout, stderr = client.exec_command(command)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode(errors='replace').strip()
    err = stderr.read().decode(errors='replace').strip()
    if print_output:
        if out:
            print(f"Output:\n{out}")
        if err:
            print(f"Error:\n{err}")
    return out

def inspect_cpu_issue():
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

        # 1. Check Top Processes
        print("\n--- Top CPU Processes ---")
        run_command(client, "top -b -n 1 | head -n 15")

        # 2. Find WorldServer PID
        pid_out = run_command(client, "pgrep -f worldserver", print_output=False)
        if not pid_out:
            print("WorldServer process not found!")
            return
        
        pid = pid_out.splitlines()[0]
        print(f"\nWorldServer PID: {pid}")

        # 3. Check Open Files / Network Connections for the process
        print(f"\n--- Network Connections for PID {pid} ---")
        run_command(client, f"lsof -p {pid} | grep TCP")

        # 4. Locate and Read Logs
        # Standard AC logs path
        log_dir = "/root/azerothcore/env/dist/var/log"
        print(f"\n--- Checking Logs in {log_dir} ---")
        
        # List log files
        run_command(client, f"ls -lt {log_dir}")
        
        # Read server.log (tail)
        print("\n--- Tailing server.log ---")
        # Try to find the most recent log file
        log_file = f"{log_dir}/server.log"
        run_command(client, f"tail -n 50 {log_file}")
        
        # Read DB errors log if exists
        print("\n--- Tailing DB errors log ---")
        run_command(client, f"tail -n 20 {log_dir}/DBErrors.log")

        # 5. Check configuration (MapUpdateInterval)
        conf_file = "/root/azerothcore/env/dist/etc/worldserver.conf"
        print(f"\n--- Checking relevant config in {conf_file} ---")
        run_command(client, f"grep -E 'MapUpdateInterval|GridUnload|LogLevel' {conf_file}")

        # 6. Attempt strace summary if installed
        print("\n--- Attempting strace summary (5 seconds) ---")
        # Check if strace exists
        check_strace = run_command(client, "which strace", print_output=False)
        if check_strace:
             run_command(client, f"strace -c -p {pid} -S time -w -U name,max-time,total-time,calls,errors,time-percent -n 5 2>&1") # capture stderr
        else:
             print("strace not found.")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    inspect_cpu_issue()

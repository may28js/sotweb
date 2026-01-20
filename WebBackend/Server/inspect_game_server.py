
import paramiko
import time

def run_command(client, command):
    print(f"Running: {command}")
    stdin, stdout, stderr = client.exec_command(command)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out:
        print(f"Output:\n{out}")
    if err:
        print(f"Error:\n{err}")
    return out

def inspect_game_server():
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

        # 1. Check for Docker containers
        print("\n--- Docker Containers ---")
        run_command(client, "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'")

        # 2. Check for Systemd services
        print("\n--- Systemd Services (ac-*) ---")
        run_command(client, "systemctl list-units --type=service --all | grep -i 'ac-'")

        # 3. Check for Screen sessions
        print("\n--- Screen Sessions ---")
        run_command(client, "screen -ls")

        # 4. Check for running processes
        print("\n--- Processes (worldserver/authserver) ---")
        run_command(client, "ps aux | grep -E 'worldserver|authserver' | grep -v grep")
        
        # 5. Check acore-docker directory if it exists
        print("\n--- Check acore-docker directory ---")
        run_command(client, "ls -la /root/azerothcore")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    inspect_game_server()


import paramiko

def get_size(client, path):
    stdin, stdout, stderr = client.exec_command(f"du -sh {path} 2>/dev/null | cut -f1")
    return stdout.read().decode().strip()

def inspect_cleanup_targets():
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

        print("--- Disk Usage Analysis ---")
        
        # 1. System Logs
        print(f"System Journal (/var/log/journal): {get_size(client, '/var/log/journal')}")
        print(f"Syslog (/var/log/syslog): {get_size(client, '/var/log/syslog')}")
        
        # 2. Game Logs
        game_log_path = "/root/azerothcore/env/dist/var/log"
        print(f"Game Logs ({game_log_path}): {get_size(client, game_log_path)}")
        
        # List large files in game log dir
        stdin, stdout, stderr = client.exec_command(f"ls -lhS {game_log_path} | head -n 5")
        print("  Top 5 Game Logs:")
        print(stdout.read().decode())

        # 3. APT Cache
        print(f"APT Cache (/var/cache/apt): {get_size(client, '/var/cache/apt')}")

        # 4. Docker
        stdin, stdout, stderr = client.exec_command("docker system df")
        print("Docker Usage:")
        print(stdout.read().decode())
        
        # 5. Tmp
        print(f"Temp (/tmp): {get_size(client, '/tmp')}")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    inspect_cleanup_targets()

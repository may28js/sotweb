
import paramiko

def check_console_config():
    host = '38.55.125.89'
    port = 22
    username = 'root'
    password = 'ylykFZBW8281'

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        print(f"Connecting to {host}...")
        client.connect(host, port, username, password)
        
        conf_file = "/root/azerothcore/env/dist/etc/worldserver.conf"
        print(f"\n--- Checking Console.Enable in {conf_file} ---")
        stdin, stdout, stderr = client.exec_command(f"grep 'Console.Enable' {conf_file}")
        print(stdout.read().decode(errors='replace'))

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    check_console_config()

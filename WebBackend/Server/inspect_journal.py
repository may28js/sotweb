
import paramiko

def check_journal_spam():
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

        # 1. Check Journal for the service
        print("\n--- Journal Logs for ac-w1.service (Last 20 lines) ---")
        # Using --no-pager to get raw output
        stdin, stdout, stderr = client.exec_command("journalctl -u ac-w1.service -n 20 --no-pager")
        print(stdout.read().decode(errors='replace'))

        # 2. Check disk usage of log files
        print("\n--- Log File Sizes ---")
        stdin, stdout, stderr = client.exec_command("ls -lh /var/log/syslog /var/log/messages /var/log/journal 2>/dev/null")
        print(stdout.read().decode(errors='replace'))

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    check_journal_spam()

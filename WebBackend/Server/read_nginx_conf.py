import paramiko

hostname = '38.55.125.89'
username = 'root'
password = 'ylykFZBW8281'
port = 22

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname, port=port, username=username, password=password)
    
    stdin, stdout, stderr = client.exec_command("cat /root/sotweb/nginx.conf")
    print(stdout.read().decode())
    
    client.close()
except Exception as e:
    print(f"Error: {e}")

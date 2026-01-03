
file_path = r'F:\工作区\模块开发\StoryOfTimeLauncher\WebBackend\demo页面源代码\Home _ Next Vision CMS_buy.html'

with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    f.seek(485400)
    content = f.read(5000)
    print(content)

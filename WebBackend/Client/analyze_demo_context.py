
import re

file_path = r'F:\工作区\模块开发\StoryOfTimeLauncher\WebBackend\demo页面源代码\Home _ Next Vision CMS_buy.html'

try:
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        
    print(f'Total length: {len(content)}')
    
    keywords = ['Price', 'Description', 'Gold', 'Buy Now', 'Purchase']
    
    for kw in keywords:
        indices = [m.start() for m in re.finditer(re.escape(kw), content, re.IGNORECASE)]
        print(f'\n--- Matches for "{kw}" ({len(indices)}) ---')
        for i in indices[:3]: # Show first 3 matches
            start = max(0, i - 200)
            end = min(len(content), i + 200)
            context = content[start:end]
            print(f'Position {i}:\n{context}\n')

except Exception as e:
    print(f"Error: {e}")

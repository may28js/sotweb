
import re

file_path = r'F:\工作区\模块开发\StoryOfTimeLauncher\WebBackend\demo页面源代码\Home _ Next Vision CMS_buy.html'

try:
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        
    print(f'Total length: {len(content)}')
    
    keywords = ['Price', 'Description', 'Cart', 'Buy', 'Shop', 'Crate', 'Gold']
    for kw in keywords:
        print(f'Contains "{kw}": {kw in content or kw.lower() in content}')

    # Find text in RSC payload (simple pattern)
    # Looking for "children":"Some Text"
    rsc_matches = re.findall(r'"children":"([^"]*)"', content)
    print(f'RSC text matches: {len(rsc_matches)}')
    
    shop_terms = [m for m in rsc_matches if any(term in m.lower() for term in ['price', 'buy', 'cart', 'shop', 'item', 'found'])]
    print('Potential content matches:', shop_terms[:20])

except Exception as e:
    print(f"Error: {e}")

from bs4 import BeautifulSoup

with open(r'F:\工作区\模块开发\StoryOfTimeLauncher\WebBackend\demo页面源代码\div.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

soup = BeautifulSoup(html_content, 'html.parser')
right_column = soup.find('div', class_='lg:col-span-2')

if right_column:
    print("Right column found.")
    # Print direct children
    for child in right_column.find_all(recursive=False):
        print(f"Child tag: {child.name}, classes: {child.get('class')}")
        # If it's the tab content, look inside
        if 'animate__fadeIn' in str(child.get('class', [])) or 'space-y-6' in str(child.get('class', [])):
             print("  --> Inside content wrapper:")
             for grand_child in child.find_all(recursive=False):
                 print(f"    Grandchild tag: {grand_child.name}, classes: {grand_child.get('class')}")
else:
    print("Right column NOT found.")

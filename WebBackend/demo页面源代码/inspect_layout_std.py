from html.parser import HTMLParser

class LayoutParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_right_col = False
        self.depth_in_right_col = 0
        self.right_col_children = []
        self.current_tag_info = None

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        classes = attrs_dict.get('class', '').split()
        
        if 'lg:col-span-2' in classes:
            self.in_right_col = True
            self.depth_in_right_col = 0
            return

        if self.in_right_col:
            self.depth_in_right_col += 1
            if self.depth_in_right_col == 1:
                # Direct child of right column
                self.current_tag_info = {'tag': tag, 'class': attrs_dict.get('class', '')}
                self.right_col_children.append(self.current_tag_info)
            elif self.depth_in_right_col == 2:
                 # Grandchild
                 if 'children' not in self.current_tag_info:
                     self.current_tag_info['children'] = []
                 self.current_tag_info['children'].append({'tag': tag, 'class': attrs_dict.get('class', '')})

    def handle_endtag(self, tag):
        if self.in_right_col:
            self.depth_in_right_col -= 1
            if self.depth_in_right_col < 0:
                self.in_right_col = False

with open(r'F:\工作区\模块开发\StoryOfTimeLauncher\WebBackend\demo页面源代码\div.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

parser = LayoutParser()
parser.feed(html_content)

print("Right Column Children:")
for child in parser.right_col_children:
    print(f"Child: <{child['tag']} class='{child['class']}'>")
    if 'children' in child:
        for grand in child['children']:
             print(f"  Grandchild: <{grand['tag']} class='{grand['class']}'>")


import os

input_file = r"F:\工作区\模块开发\StoryOfTimeLauncher\WebBackend\demo页面源代码\div.html"
output_file = r"F:\工作区\模块开发\StoryOfTimeLauncher\WebBackend\demo页面源代码\div_formatted.html"

try:
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Simple formatting: replace >< with >\n< to break lines
    formatted_content = content.replace('><', '>\n<')

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(formatted_content)
    
    print(f"Formatted file saved to {output_file}")

except Exception as e:
    print(f"Error: {e}")

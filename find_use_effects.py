import os
import re

def find_use_effects(directory):
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                path = os.path.join(root, file)
                with open(path, 'r') as f:
                    content = f.read()
                    # Find useEffect calls
                    # This regex is a bit simplistic but should catch most cases
                    matches = re.finditer(r'useEffect\(\s*\(\s*\)\s*=>\s*\{', content)
                    for match in matches:
                        start = match.start()
                        # Find the closing brace of the effect function
                        brace_count = 0
                        i = content.find('{', start)
                        while i < len(content):
                            if content[i] == '{':
                                brace_count += 1
                            elif content[i] == '}':
                                brace_count -= 1
                                if brace_count == 0:
                                    # Found the end of the arrow function
                                    # Now check if there's a comma after it
                                    after = content[i+1:].strip()
                                    if not after.startswith(','):
                                        line_no = content.count('\n', 0, start) + 1
                                        print(f"{path}:{line_no}: useEffect missing dependency array")
                                    break
                            i += 1

find_use_effects('.')

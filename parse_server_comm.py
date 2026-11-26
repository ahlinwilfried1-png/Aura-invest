with open('server.ts') as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r'0\.20|0\.40|0\.02|commission', text, re.IGNORECASE)]
print('server.ts commission matches:', len(matches))
for m in re.finditer(r'.{0,40}(?:0\.20|0\.40|0\.02|commL1).{0,40}', text):
    print(m.group(0))

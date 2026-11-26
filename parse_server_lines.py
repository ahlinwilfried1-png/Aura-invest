with open('server.ts') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if 'commL1' in l or 'commL2' in l:
        for k in range(max(0, i-4), min(len(lines), i+25)):
            print(f"{k+1:4d}: {lines[k]}", end='')
        break

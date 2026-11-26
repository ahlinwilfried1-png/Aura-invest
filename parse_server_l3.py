with open('server.ts') as f:
    lines = f.readlines()

for k in range(1995, 2035):
    if k < len(lines):
        print(f"{k+1:4d}: {lines[k]}", end='')

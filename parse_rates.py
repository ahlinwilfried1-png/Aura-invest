with open('src/context/AppContext.tsx') as f:
    lines = f.readlines()

for idx in [1580, 1581, 1582, 1583, 1615, 1616, 1617, 1618, 1638, 1639, 1640, 1641]:
    if idx < len(lines):
        print(f"{idx+1}: {lines[idx]}", end='')

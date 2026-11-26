with open('src/context/AppContext.tsx') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if 'buyInvestment' in l or 'processDeposit' in l or 'level 1' in l.lower() or 'level 2' in l.lower() or 'commissions' in l:
        for k in range(max(0, i-2), min(len(lines), i+25)):
            if any(term in lines[k] for term in ['rate', '0.2', '0.4', '0.02', '0.01', 'percent', 'level1', 'Level 1']):
                print(f"{k+1:4d}: {lines[k]}", end='')
                break

with open(r'jurisai/frontend/src/api/client.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'apiGetBareActDetail' in line:
        lines[i] = "export const apiGetBareActDetail = (actId) => client.get(`/legal/acts/${encodeURIComponent(actId)}`)\n"

with open(r'jurisai/frontend/src/api/client.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Updated client.js correctly!")

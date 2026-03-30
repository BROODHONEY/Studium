with open('frontend/src/pages/DashboardPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove placeholder
content = content.replace('\n// placeholder\n', '')

start = content.find('      {/* \u2500\u2500 Mobile: settings/search shown in content layer \u2500\u2500 */')
end = content.find('      {showModal', start)

assert start != -1, "start marker not found"
assert end != -1, "end marker not found"

drawer = (
    "      {/* \u2500\u2500 Mobile: settings/search full-screen overlay \u2500\u
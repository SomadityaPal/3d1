import re

with open("src/App.jsx", "r") as f:
    content = f.read()

# Find all "text-*" classes
classes = re.findall(r'text-[a-zA-Z0-9/\-\[\]\.]+', content)
counts = {}
for c in classes:
    counts[c] = counts.get(c, 0) + 1

# Sort and print most common ones
for c in sorted(counts.keys(), key=lambda x: counts[x], reverse=True):
    print(f"{counts[c]}: {c}")

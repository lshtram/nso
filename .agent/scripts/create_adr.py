#!/usr/bin/env python3
import sys
import os
import datetime
import glob

TEMPLATE_PATH = ".agent/templates/ADR.md"
ADR_DIR = "docs/adr"

def get_next_adr_number():
    if not os.path.exists(ADR_DIR):
        os.makedirs(ADR_DIR)
    
    files = glob.glob(os.path.join(ADR_DIR, "*.md"))
    if not files:
        return 1
    
    existing_numbers = []
    for f in files:
        try:
            name = os.path.basename(f)
            num = int(name.split('-')[0])
            existing_numbers.append(num)
        except ValueError:
            continue
    
    return max(existing_numbers, default=0) + 1

def create_adr(title):
    num = get_next_adr_number()
    filename = f"{num:04d}-{title.lower().replace(' ', '-')}.md"
    filepath = os.path.join(ADR_DIR, filename)
    
    with open(TEMPLATE_PATH, 'r') as t:
        content = t.read()
    
    content = content.replace("[Number]", f"{num:04d}")
    content = content.replace("[Title]", title)
    content = content.replace("[YYYY-MM-DD]", datetime.date.today().isoformat())
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"ADR created: {filepath}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: create_adr.py <Title>")
        sys.exit(1)
    
    create_adr(sys.argv[1])

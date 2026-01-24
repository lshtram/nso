import os
import re
import sys

# Constants
SCRATCHPAD_DIR = '.agent/scratchpad'
SRC_DIR = 'src'

def find_modular_docs(suffix):
    """Finds all markdown files with a specific suffix in the scratchpad (e.g., _prd.md)"""
    docs = []
    if not os.path.exists(SCRATCHPAD_DIR):
        return docs
    for f in os.listdir(SCRATCHPAD_DIR):
        if f.endswith(suffix):
            docs.append(os.path.join(SCRATCHPAD_DIR, f))
    return docs

def extract_ids(file_path, pattern_str):
    """Extracts unique IDs from a file using a regex pattern"""
    if not os.path.exists(file_path):
        return []
    with open(file_path, 'r') as f:
        content = f.read()
    return sorted(list(set(re.findall(pattern_str, content))))

def scan_code_for_traceability():
    """Scans code files for @verifies and @test tags"""
    mapping = {} # REQ_ID -> { 'tests': [TST_ID], 'files': [FILE_PATH] }
    
    # Pattern to find @verifies REQ-XXX and @test TST-YYY in the same file or block
    v_pattern = re.compile(r'@verifies\s+(REQ-\d{3})')
    t_pattern = re.compile(r'@test\s+(TST-\d{3})')
    
    for root, _, files in os.walk(SRC_DIR):
        for file in files:
            if file.endswith(('.tsx', '.ts', '.js')):
                path = os.path.join(root, file)
                with open(path, 'r') as f:
                    content = f.read()
                    reqs = v_pattern.findall(content)
                    tests = t_pattern.findall(content)
                    
                    for req in reqs:
                        if req not in mapping:
                            mapping[req] = { 'tests': set(), 'files': set() }
                        mapping[req]['files'].add(os.path.basename(path))
                        for t in tests:
                            mapping[req]['tests'].add(t)
    return mapping

def main():
    print("### 🔍 Advanced Traceability Matrix (Modular Edition)")
    
    prd_files = find_modular_docs('_prd.md')
    if not prd_files:
        # Fallback to single PRD for legacy support
        legacy_prd = os.path.join(SCRATCHPAD_DIR, 'PRD_current.md')
        if os.path.exists(legacy_prd):
            prd_files = [legacy_prd]

    if not prd_files:
        print("No requirement documents found (*_prd.md).")
        return

    code_map = scan_code_for_traceability()

    print("| Component | Req ID | Verification Tests | Files | Status |")
    print("| :--- | :--- | :--- | :--- | :--- |")
    
    for prd in prd_files:
        component_name = os.path.basename(prd).replace('_prd.md', '').upper()
        reqs = extract_ids(prd, r'(REQ-\d{3})')
        
        for req in reqs:
            data = code_map.get(req, { 'tests': [], 'files': [] })
            test_ids = ", ".join(sorted(list(data['tests']))) or "---"
            file_names = ", ".join(sorted(list(data['files']))) or "---"
            status = "✅ VERIFIED" if data['tests'] else "❌ UNVERIFIED"
            
            print(f"| {component_name} | {req} | {test_ids} | {file_names} | {status} |")

if __name__ == "__main__":
    main()

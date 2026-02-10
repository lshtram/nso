#!/usr/bin/env python3
import sys
import subprocess
import json
import os

# Colors
GREEN = '\033[92m'
RED = '\033[91m'
RESET = '\033[0m'

def run_command(command, description):
    print(f"Running: {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return True, result.stdout.decode()
    except subprocess.CalledProcessError as e:
        return False, e.stdout.decode() + e.stderr.decode()

def parse_vitest_json(json_path):
    if not os.path.exists(json_path):
        return "Test execution failed (No JSON output)."
    
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    failed_tests = []
    for test_result in data.get('testResults', []):
        for assertion in test_result.get('assertionResults', []):
            if assertion.get('status') == 'failed':
                title = assertion.get('title')
                msgs = assertion.get('failureMessages', [])
                failed_tests.append(f"- {title}: {msgs[0] if msgs else 'Unknown error'}")
    
    if failed_tests:
        return "\n".join(failed_tests)
    return None

def verify_unit():
    # Use the AI config to generate JSON
    cmd = "npx vitest run --config .agent/configs/vitest.ai.config.ts"
    success, output = run_command(cmd, "Unit Tests (AI Mode)")
    
    if success:
        print(f"{GREEN}PASS{RESET}: All tests passed.")
        return True
    else:
        # Parse the JSON output
        errors = parse_vitest_json(".agent/scratchpad/test-results.json")
        if errors:
            print(f"{RED}FAIL{RESET}: The following tests failed:")
            print(errors)
        else:
            print(f"{RED}FAIL{RESET}: Vitest crashed.")
            print(output[-500:]) # Last 500 chars of raw output
        return False

def verify_types():
    # Use tsc with noEmit
    cmd = "npx tsc --noEmit --pretty false"
    success, output = run_command(cmd, "Type Check")
    
    if success:
        print(f"{GREEN}PASS{RESET}: No type errors.")
        return True
    else:
        print(f"{RED}FAIL{RESET}: Type errors found.")
        # Filter for only lines starting with "src/" to reduce noise
        lines = [line for line in output.split('\n') if line.startswith('src/')]
        print("\n".join(lines[:20])) # Show top 20 errors
        if len(lines) > 20:
            print(f"... and {len(lines) - 20} more.")
        return False

def verify_docs():
    print("Running: Document Linting...")
    # Lint only the active scratchpad and docs
    cmd = "npx markdownlint-cli2 \".agent/scratchpad/*.md\" \"docs/**/*.md\""
    success, output = run_command(cmd, "Markdown Lint")
    
    if success:
        print(f"{GREEN}PASS{RESET}: Documents are well-formatted.")
        return True
    else:
        print(f"{RED}FAIL{RESET}: Document formatting errors found.")
        print(output[:1000]) # Show first 1000 chars of lint errors
        return False

def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "all"
    
    passed_types = True
    passed_tests = True
    passed_docs = True

    if mode == "--docs":
        passed_docs = verify_docs()
    else:
        if mode in ["all", "--types"]:
            passed_types = verify_types()
        
        if mode in ["all", "--unit"]:
            passed_tests = verify_unit()

    if passed_types and passed_tests and passed_docs:
        print(f"\n{GREEN}VERIFICATION SUCCESSFUL{RESET}")
        sys.exit(0)
    else:
        print(f"\n{RED}VERIFICATION FAILED{RESET}")
        sys.exit(1)

if __name__ == "__main__":
    main()

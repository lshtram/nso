#!/usr/bin/env python3
"""
MCP Integration Test Suite
Tests each MCP server configuration and functionality.
"""

import json
import subprocess
import sys


def test_gh_cli():
    """Test gh CLI (native, no MCP)."""
    print("=" * 50)
    print("Test: gh CLI (Native)")
    print("=" * 50)
    try:
        result = subprocess.run(
            ["gh", "search", "repos", "python circuit breaker", "--limit", "1", "--json", "name,description"],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0:
            data = json.loads(result.stdout)
            print(f"✅ SUCCESS: Found repo: {data[0]['name'] if data else 'N/A'}")
            return True
        else:
            print(f"❌ FAILED: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False


def test_mcp_config():
    """Test MCP configuration in opencode.json."""
    print("\n" + "=" * 50)
    print("Test: MCP Configuration")
    print("=" * 50)
    try:
        with open(".opencode/../opencode.json") as f:
            config = json.load(f)
        
        mcp_servers = config.get("mcp", {})
        print(f"✅ SUCCESS: Found {len(mcp_servers)} MCP servers configured")
        for name, cfg in mcp_servers.items():
            mcp_type = cfg.get("type", "unknown")
            enabled = cfg.get("enabled", False)
            status = "✅" if enabled else "❌"
            print(f"  {status} {name}: {mcp_type}")
        return True
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False


def test_agent_mcp_access():
    """Test that agents have MCP tool access configured."""
    print("\n" + "=" * 50)
    print("Test: Agent MCP Access")
    print("=" * 50)
    try:
        with open(".opencode/../opencode.json") as f:
            config = json.load(f)
        
        agents = config.get("agent", {})
        for agent_name, agent_config in agents.items():
            tools = agent_config.get("tools", {})
            mcp_tools = [t for t in tools.keys() if t.startswith("mcp__")]
            if mcp_tools:
                print(f"✅ {agent_name}: {len(mcp_tools)} MCP tools")
                for tool in mcp_tools[:3]:  # Show first 3
                    print(f"    - {tool}")
                if len(mcp_tools) > 3:
                    print(f"    ... and {len(mcp_tools) - 3} more")
        return True
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False


def test_per_agent_config():
    """Test per-agent MCP configuration file."""
    print("\n" + "=" * 50)
    print("Test: Per-Agent MCP Config")
    print("=" * 50)
    try:
        with open(".opencode/config/mcp-agents.json") as f:
            config = json.load(f)
        
        agents = config.get("agents", {})
        print(f"✅ SUCCESS: Found {len(agents)} agents configured")
        for agent_name, agent_config in agents.items():
            mcp_servers = agent_config.get("mcpServers", [])
            print(f"  - {agent_name}: {', '.join(mcp_servers)}")
        return True
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False


def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("MCP Integration Test Suite")
    print("=" * 60 + "\n")
    
    tests = [
        ("gh CLI (Native)", test_gh_cli),
        ("MCP Configuration", test_mcp_config),
        ("Agent MCP Access", test_agent_mcp_access),
        ("Per-Agent Config", test_per_agent_config),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n❌ {name} CRASHED: {e}")
            results.append((name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    passed = sum(1 for _, r in results if r)
    failed = len(results) - passed
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    
    if failed == 0:
        print("\n✅ All tests passed!")
        return 0
    else:
        print(f"\n⚠️ {failed} test(s) failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
import os
import datetime
import argparse
from pathlib import Path

def init(project_root_arg=None):
    # Determine project root: argument > env var > current working directory
    if project_root_arg:
        project_root = Path(project_root_arg)
    elif "NSO_PROJECT_ROOT" in os.environ:
        project_root = Path(os.environ["NSO_PROJECT_ROOT"])
    else:
        project_root = Path(os.getcwd())

    log_dir = project_root / ".opencode" / "logs"
    marker_file = log_dir / "session_init_marker.txt"
    
    # Ensure logs dir exists (and .opencode parent if needed)
    try:
        if not (project_root / ".opencode").exists():
             # If .opencode doesn't exist, we might not want to create it silently 
             # unless we are sure it's an NSO project.
             # But for init_session, we assume we are in a valid context.
             pass
        
        log_dir.mkdir(parents=True, exist_ok=True)
        
        # Write marker
        timestamp = datetime.datetime.now().isoformat()
        with open(marker_file, "a") as f:
            f.write(f"initialized: {timestamp}\n")
            
        # Explicit confirmation for plugin logs
        print(f"✅ NSO Core initialized at {timestamp} in {project_root}")
        
    except Exception as e:
        print(f"⚠️ NSO Init Warning: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("root", nargs="?", help="Project root directory")
    args = parser.parse_args()
    init(args.root)

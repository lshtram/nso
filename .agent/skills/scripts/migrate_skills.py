import os
import re

SKILLS_DIR = ".agent/skills"

def get_description(content):
    # Try to find "> **Goal**:" or "> **System**:"
    match = re.search(r'> \*\*Goal\*\*: (.*)', content)
    if match:
        return match.group(1).strip()
    match = re.search(r'> \*\*System\*\*: (.*)', content)
    if match:
        return match.group(1).strip()
    # Fallback to first paragraph
    lines = content.split('\n')
    for line in lines:
        if line.strip() and not line.startswith('#') and not line.startswith('>'):
            return line.strip()[:100]
    return "Agent Skill"

def migrate():
    files = os.listdir(SKILLS_DIR)
    for filename in files:
        if not filename.endswith(".md") or filename == "README.md":
            continue
        
        # Skip if it's already a folder (although listdir returns logic...)
        # listdir returns filenames.
        
        file_path = os.path.join(SKILLS_DIR, filename)
        if not os.path.isfile(file_path):
            continue

        skill_name = filename.replace(".md", "").replace("_", "-") # Normalize to kebab-case
        
        # Special check for already migrated
        if skill_name in ["start-task", "finish-task"]:
            # Delete the old file if it still exists (e.g. start_task.md)
            print(f"Skipping {filename} (migrated manually), but checking redundancy...")
            continue
            
        print(f"Migrating {filename} -> {skill_name}/SKILL.md")
        
        with open(file_path, 'r') as f:
            content = f.read()
            
        description = get_description(content)
        
        # Prepare new content with YAML
        new_content = f"---\nname: {skill_name}\ndescription: {description}\n---\n\n{content}"
        
        # Create dir
        new_dir = os.path.join(SKILLS_DIR, skill_name)
        os.makedirs(new_dir, exist_ok=True)
        
        # Write new file
        with open(os.path.join(new_dir, "SKILL.md"), 'w') as f:
            f.write(new_content)
            
        # Delete old file
        os.remove(file_path)
        print("Done.")

if __name__ == "__main__":
    migrate()

import sys, re

# NSO Intelligent Router - Minimal Deterministic Logic
INTENTS = {
    "DEBUG": [r"debug", r"fix", r"error", r"bug", r"broken", r"troubleshoot", r"issue", r"problem", r"failure"],
    "REVIEW": [r"review", r"audit", r"check", r"analyze", r"assess", r"evaluate"],
    "PLAN": [r"plan", r"design", r"architect", r"roadmap", r"strategy", r"spec"]
}

def route(query):
    query = query.lower()
    for workflow, keywords in INTENTS.items():
        if any(re.search(k, query) for k in keywords):
            return workflow
    return "BUILD"

if __name__ == "__main__":
    request = " ".join(sys.argv[1:])
    print(route(request))

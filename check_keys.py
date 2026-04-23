import os
import google.generativeai as genai

# ==========================================
# CONFIGURATION
# ==========================================
# Look in your .env file and paste your shiny new API key here:
NEW_API_KEY = "YOUR_NEW_KEY_PASTED_HERE"

# This is the exposed key we want to purge from the codebase
OLD_API_KEY = "AIzaSyAdBTG84yE_PX3N8j6x7S4lucIhk9EqfbE"

# Configure the Gemini SDK
genai.configure(api_key=NEW_API_KEY)
# We specifically use gemini-2.5-flash as requested
model = genai.GenerativeModel('gemini-2.5-flash')

def scan_project_for_leaks():
    print("Starting ultra-fast local scan... (0 tokens used for this part)")
    
    suspicious_files = []
    
    # 1. We use pure Python to scan the codebase instead of the LLM.
    # Why? Scanning an entire codebase with an LLM would cost millions of tokens.
    # Local text searching is instant, 100% free, and highly accurate.
    for root, dirs, files in os.walk('.'):
        # Exclude massive/compiled directories to speed up the search
        excluded_dirs = {'node_modules', '.git', 'android', 'ios', 'dataset', '.bundle'}
        dirs[:] = [d for d in dirs if d not in excluded_dirs]
        
        for file in files:
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if OLD_API_KEY in content:
                        suspicious_files.append(path)
            except Exception:
                # Ignore files that aren't plain text (like images, compiled binaries)
                pass 
                
    if not suspicious_files:
        print("\n[SECURE] The old API key was NOT found anywhere in your project files.")
        return

    print(f"\n[WARNING] The old key was found in {len(suspicious_files)} file(s).")
    for sec_file in suspicious_files:
        print(f" - {sec_file}")
        
    print("\nAsking Gemini 2.5 Flash for a security assessment...")
    
    # 2. Now we use the LLM! We only send a tiny prompt with the file names.
    # This guarantees we use the LEAST amount of tokens possible.
    prompt = (
        f"I accidentally committed my old Google API key to my codebase. "
        f"A local script found the leaked key remaining in these specific files: {', '.join(suspicious_files)}. "
        f"Provide a highly concise, 2-sentence security recommendation on what I need to do to permanently purge this from Git history."
    )
    
    # Call Gemini 2.5 Flash
    response = model.generate_content(prompt)
    
    print("\n=== Gemini 2.5 Flash Security Report ===")
    print(response.text)
    print("========================================\n")

if __name__ == "__main__":
    scan_project_for_leaks()

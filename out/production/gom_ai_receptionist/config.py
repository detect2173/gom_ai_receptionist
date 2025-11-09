from dotenv import load_dotenv
import os

# Load the .env file
load_dotenv()

# Fetch the key from the environment
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise ValueError("❌ OPENAI_API_KEY not found. Check your .env file.")

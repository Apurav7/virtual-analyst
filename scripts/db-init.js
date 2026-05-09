"""
Virtual Analyst - Database Migration Script
Run schema initialization and migrations
"""

import os
import sys
from pathlib import Path

# Add lib to path
sys.path.insert(0, str(Path(__file__).parent))

def init_database():
    """Initialize database schema"""
    from lib.db.schema import SCHEMA
    from lib.db.client import initDB, query
    
    print("Initializing database schema...")
    
    try:
        db = initDB()
        
        # Execute schema
        for statement in SCHEMA.split(';'):
            statement = statement.strip()
            if statement:
                query(statement)
        
        print("✅ Database schema initialized successfully")
        return True
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False

if __name__ == "__main__":
    init_database()

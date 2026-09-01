import sqlite3
import os

db_path = r'D:\AI\work_flow_tracker\Team work\teamtrack.db'

conn = sqlite3.connect(db_path)
c = conn.cursor()

try:
    # Add new columns to tasks table
    c.execute('ALTER TABLE tasks ADD COLUMN task_type VARCHAR DEFAULT "STANDARD"')
    c.execute('ALTER TABLE tasks ADD COLUMN dev_status VARCHAR DEFAULT "PENDING"')
    c.execute('ALTER TABLE tasks ADD COLUMN qa_status VARCHAR DEFAULT "PENDING"')
    c.execute('ALTER TABLE tasks ADD COLUMN support_status VARCHAR DEFAULT "PENDING"')
    
    print("Added columns to tasks table.")
except sqlite3.OperationalError as e:
    print(f"Columns might already exist: {e}")

try:
    # Create task_comments table
    c.execute('''
        CREATE TABLE task_comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER,
            user_id INTEGER,
            content TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(task_id) REFERENCES tasks(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')
    print("Created task_comments table.")
except sqlite3.OperationalError as e:
    print(f"Table might already exist: {e}")

conn.commit()
conn.close()

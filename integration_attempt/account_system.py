# account_system.py

# ============================================
# 1. IMPORTS & INITIAL SETUP
# ============================================
from pymongo.mongo_client import MongoClient
from bson.objectid import ObjectId
import certifi
import bcrypt
from datetime import datetime

# ============================================
# 2. DATABASE CONNECTION
# ============================================
ca = certifi.where()
# IMPORTANT: Replace <db_password> with your actual password.
# THE FIX IS HERE: "v8hr_1d9" was changed to "v8hr1d9"
uri = "mongodb+srv://garyguo_db_user:Afe33MxMOb19Q6we@cluster0.v8hr1d9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(uri, tlsCAFile=ca)

# --- Collections ---
db = client['account_db']
users_collection = db['users']
tasks_collection = db['tasks'] # New collection for tasks

# ============================================
# 3. ACCOUNT FUNCTIONS
# ============================================
def register_user(username, email, password):
    """Hashes a password and creates a new user if not a duplicate."""
    if users_collection.find_one({"$or": [{"username": username}, {"email": email}]}):
        print("❌ Error: Username or email already exists.")
        return False

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    user_document = {
        "username": username,
        "email": email,
        "password": hashed_password,
        "created_at": datetime.now()
    }

    users_collection.insert_one(user_document)
    print(f"✅ User '{username}' registered successfully!")
    return True

def login_user(username, password):
    """Checks credentials and returns the user's ID on success."""
    user_document = users_collection.find_one({"username": username})

    if not user_document:
        return None # Return None if user not found

    if bcrypt.checkpw(password.encode('utf-8'), user_document['password']):
        print(f"✅ Welcome back, {username}!")
        return str(user_document['_id']) # Return the user's ID as a string on success
    else:
        return None # Return None if password is an incorrect

# ============================================
# 4. TODO LIST FUNCTIONS
# ============================================
def add_task(description, user_id):
    """Adds a new task linked to a user_id."""
    task_document = {
        "user_id": ObjectId(user_id), # Store user ID as ObjectId for proper linking
        "description": description,
        "status": "pending",
        "created_at": datetime.now()
    }
    tasks_collection.insert_one(task_document)
    return True

def get_user_tasks(user_id):
    """Retrieves all tasks for a specific user."""
    # Find all tasks that match the user's ObjectId
    tasks_cursor = tasks_collection.find({"user_id": ObjectId(user_id)})
    
    # Convert tasks to a list of dictionaries, making sure the ID is a string
    tasks = []
    for task in tasks_cursor:
        task['_id'] = str(task['_id'])
        task['user_id'] = str(task['user_id']) # Also convert user_id for consistency
        tasks.append(task)
        
    return tasks

# account_system.py

# (Rest of the code remains the same)

# ============================================
# 5. FRIENDSHIP FUNCTIONS
# ============================================
from bson.objectid import ObjectId

def send_friend_request(from_user_id, to_username):
    """Sends a friend request by adding to_username to a 'pending_friends' list."""
    from_user_id_obj = ObjectId(from_user_id)
    to_user = users_collection.find_one({"username": to_username})
    
    if not to_user:
        print(f"❌ Error: User '{to_username}' not found.")
        return False

    # Prevent self-requests and duplicate requests
    if from_user_id_obj == to_user["_id"] or to_user["_id"] in users_collection.find_one({"_id": from_user_id_obj}).get("friends", []):
        print("❌ Error: Cannot send request to self or an existing friend.")
        return False
        
    try:
        users_collection.update_one(
            {"_id": to_user["_id"]},
            {"$addToSet": {"pending_friends": from_user_id_obj}}
        )
        print(f"✅ Friend request sent to {to_username}.")
        return True
    except Exception as e:
        print(f"An error occurred: {e}")
        return False

def accept_friend_request(user_id, friend_id):
    """Accepts a friend request, creating a two-way friendship."""
    user_id_obj = ObjectId(user_id)
    friend_id_obj = ObjectId(friend_id)

    try:
        # Check if the friend request exists in the user's pending list
        user_doc = users_collection.find_one({"_id": user_id_obj, "pending_friends": friend_id_obj})
        if not user_doc:
            print("❌ Error: Friend request not found.")
            return False

        # Atomically move the friend from pending to the main friends list for both users
        users_collection.update_one(
            {"_id": user_id_obj},
            {"$addToSet": {"friends": friend_id_obj}, "$pull": {"pending_friends": friend_id_obj}}
        )
        users_collection.update_one(
            {"_id": friend_id_obj},
            {"$addToSet": {"friends": user_id_obj}}
        )
        print("✅ Friend request accepted.")
        return True
    except Exception as e:
        print(f"An error occurred: {e}")
        return False

def get_user_friends(user_id):
    """Retrieves the list of friends for a given user."""
    user_doc = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user_doc:
        return []

    friend_ids = user_doc.get("friends", [])
    friends_list = []
    if friend_ids:
        # Fetch friend details using a single query
        friends_cursor = users_collection.find({"_id": {"$in": friend_ids}}, {"username": 1})
        friends_list = [f["username"] for f in friends_cursor]

    return friends_list

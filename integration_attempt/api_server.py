from flask import Flask, request, jsonify
from flask_cors import CORS
from database_connection import get_database_connection
from bomb_operations_old import add_bomb_to_db, make_wire, verify_wire_task, listen_for_new_bombs
from account_system import register_user, login_user, send_friend_request, accept_friend_request, get_user_friends, users_collection
import threading
from datetime import datetime, timedelta
from bson.objectid import ObjectId
import jwt
import hashlib

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
app.config['SECRET_KEY'] = 'your-secret-key-here'  # Change this in production

# Global variables for database connections
bomb_client = None
bomb_db = None
bombs_collection = None

@app.route('/api/bombs/all', methods=['GET'])
def get_all_bombs():
    """Return all bombs for friends verification (for Verify tab)"""
    print("[DEBUG] /api/bombs/all endpoint called")
    user_id = get_current_user()
    if not user_id:
        return jsonify([])

    # Get all users (for mapping id to name)
    all_users = {str(u['_id']): u for u in users_collection.find({}, {"username": 1, "friends": 1})}

    bombs = list(bombs_collection.find({}))
    result = []
    debug_dump = []
    for bomb in bombs:
        owner_id = str(bomb.get('user_id'))
        owner_doc = all_users.get(owner_id)
        owner_name = owner_doc.get('username') if owner_doc else 'Unknown'
        friends_ids = owner_doc.get('friends', []) if owner_doc else []
        # Convert ObjectId to string for comparison
        friends_names = [all_users.get(str(fid), {}).get('username', '') for fid in friends_ids]
        wires = bomb.get('wires', [])
        result.append({
            '_id': str(bomb.get('_id')),
            'name': bomb.get('name', ''),
            'ownerUserId': owner_id,
            'ownerName': owner_name,
            'friends': friends_names,
            'wires': [
                {
                    'name': w.get('name', ''),
                    'complete': w.get('complete', False),
                    'verified_by': w.get('verified_by', None)
                } for w in wires
            ]
        })
        debug_dump.append({
            'bomb_raw': bomb,
            'owner_doc': owner_doc,
            'friends_names': friends_names,
            'user_id': user_id
        })
    print("[DEBUG /api/bombs/all]", debug_dump)
    return jsonify(result)


@app.route('/api/bombs/verify-wire', methods=['POST'])
def verify_wire():
    """Verify a wire for a bomb (by a friend/verifier)"""
    user_id = get_current_user()  # verifier
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    bomb_name = data.get('bombName')
    wire_name = data.get('wireName')
    owner_user_id = data.get('ownerUserId')

    if not bomb_name or not wire_name or not owner_user_id:
        return jsonify({'error': 'Missing required fields'}), 400

    from bomb_operations import verify_wire_task
    success = verify_wire_task(bombs_collection, bomb_name, wire_name, owner_user_id, user_id, users_collection)
    return jsonify({'success': success})

def init_database():
    """Initialize database connections and start listeners"""
    global bomb_client, bomb_db, bombs_collection
    bomb_client = get_database_connection()
    if bomb_client:
        bomb_db = bomb_client['bomb_database']
        bombs_collection = bomb_db['bombs']
        # Start the bomb listener in a separate thread
        return True
    else:
        return False

# ...existing code...

# ...existing imports...
# ...existing Flask app setup...
# ...existing code...

# Remove friend endpoint (move below all imports and app setup)
@app.route('/api/friends/<email>', methods=['DELETE'])
def remove_friend(email):
    """Remove a friend by email"""
    user_id = get_current_user()
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    # Find user by email
    friend_doc = users_collection.find_one({"email": email})
    if not friend_doc:
        return jsonify({'error': 'User not found'}), 404
    friend_id = friend_doc['_id']
    # Remove friend relationship using ObjectId
    users_collection.update_one({"_id": ObjectId(user_id)}, {"$pull": {"friends": friend_id}})
    users_collection.update_one({"_id": friend_id}, {"$pull": {"friends": ObjectId(user_id)}})
    # Return updated friends list
    from account_system import get_user_friends
    friends_usernames = get_user_friends(user_id)
    friends_list = []
    for username in friends_usernames:
        user_doc = users_collection.find_one({"username": username})
        if user_doc:
            friends_list.append({
                'name': username,
                'email': user_doc.get('email', f'{username}@example.com')
            })
    return jsonify({'success': True, 'friends': friends_list})

def generate_jwt_token(user_id):
    """Generate JWT token for user authentication"""
    payload = {
        'user_id': str(user_id),
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def verify_jwt_token(token):
    """Verify JWT token and return user_id"""
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_current_user():
    """Get current user from JWT token in request headers"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    return verify_jwt_token(token)

# Authentication endpoints
@app.route('/api/auth/register', methods=['POST'])
def api_register():
    """Register a new user"""
    data = request.get_json()
    username = data.get('name', '')
    email = data.get('email', '')
    password = data.get('password', '')

    if not all([username, email, password]):
        return jsonify({'error': 'Missing required fields'}), 400

    success = register_user(username, email, password)
    if success:
        user_id = login_user(username, password)
        if user_id:
            token = generate_jwt_token(user_id)
            return jsonify({
                'success': True,
                'token': token,
                'user': {'name': username, 'email': email}
            })
        else:
            return jsonify({'error': 'Login failed after registration'}), 400

    return jsonify({'error': 'Registration failed'}), 400

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    """Login user"""
    data = request.get_json()
    email = data.get('email', '')
    password = data.get('password', '')
    
    if not all([email, password]):
        return jsonify({'error': 'Missing email or password'}), 400
    
    # Find user by email (since frontend sends email, but our backend expects username)
    user_doc = users_collection.find_one({"email": email})
    if not user_doc:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    username = user_doc.get('username')
    user_id = login_user(username, password)
    
    if user_id:
        token = generate_jwt_token(user_id)
        return jsonify({
            'success': True,
            'token': token,
            'user': {'name': username, 'email': email}
        })
    
    return jsonify({'error': 'Invalid credentials'}), 401

# Bomb/Tasks endpoints
@app.route('/api/bombs/current', methods=['GET'])
def get_current_bomb():
    """Get current active bomb for user"""
    user_id = get_current_user()
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    # Find the most recent bomb for this user
    bomb = bombs_collection.find_one(
        {"user_id": user_id, "exploding": False},
        sort=[("start_time", -1)]
    )
    
    if not bomb:
        # Return default bomb structure if none exists
        deadline = int((datetime.utcnow() + timedelta(hours=6)).timestamp() * 1000)
        return jsonify({
            'deadline': deadline,
            'wires': []
        })
    
    # Convert bomb data to frontend format
    deadline = int((bomb['start_time'] + timedelta(seconds=bomb['timer_set'])).timestamp() * 1000)
    wires = []
    
    # Define wire colors to cycle through
    wire_colors = ["#ef4444", "#22c55e", "#3b82f6", "#eab308", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"]
    
    for i, wire in enumerate(bomb.get('wires', [])):
        wires.append({
            'id': str(wire.get('_id', i)),  # Use MongoDB ObjectId or index as fallback
            'task': wire.get('name', f'Task {i+1}'),
            'color': wire_colors[i % len(wire_colors)],
            'cut': wire.get('complete', False)
        })
    
    return jsonify({
        'deadline': deadline,
        'wires': wires
    })

@app.route('/api/bombs/cut-wire', methods=['POST'])
def cut_wire():
    """Cut a wire (complete a task)"""
    user_id = get_current_user()
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    wire_id = data.get('wireId')
    
    # For now, we'll just mark it as cut in the database
    # In a real implementation, you'd need verification from friends
    bomb = bombs_collection.find_one(
        {"user_id": user_id, "exploding": False},
        sort=[("start_time", -1)]
    )
    
    if bomb and bomb.get('wires'):
        # Find wire by task name (since frontend sends task as identifier)
        for i, wire in enumerate(bomb['wires']):
            if str(i) == wire_id or wire.get('name') == wire_id:
                # Update wire completion status
                update_query = {"_id": bomb['_id']}
                update_operation = {"$set": {f"wires.{i}.complete": True}}
                bombs_collection.update_one(update_query, update_operation)
                break
    
    return jsonify({'success': True})

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """Get all tasks for user"""
    user_id = get_current_user()
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    # Find current bomb and extract tasks from wires
    bomb = bombs_collection.find_one(
        {"user_id": user_id, "exploding": False},
        sort=[("start_time", -1)]
    )
    
    tasks = []
    if bomb and bomb.get('wires'):
        for i, wire in enumerate(bomb['wires']):
            tasks.append({
                'id': f"task_{i}",
                'title': wire.get('name', f'Task {i+1}'),
                'done': wire.get('complete', False),
                'due': None  # You can add due dates if needed
            })
    
    return jsonify(tasks)

@app.route('/api/tasks', methods=['POST'])
def add_task():
    """Add a new task"""
    user_id = get_current_user()
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    task_title = data.get('title', '')
    due_date = data.get('due')

    if not task_title:
        return jsonify({'error': 'Task title required'}), 400

    bomb = bombs_collection.find_one(
        {"user_id": user_id, "exploding": False},
        sort=[("start_time", -1)]
    )

    if bomb:
        new_wire = make_wire(task_title, timer_set=300)
        bombs_collection.update_one(
            {"_id": bomb['_id']},
            {"$push": {"wires": new_wire}}
        )
    else:
        new_wire = make_wire(task_title, timer_set=300)
        user_doc = users_collection.find_one({"_id": ObjectId(user_id)})
        username = user_doc.get('username', 'Unknown User')
        add_bomb_to_db(
            bombs_collection,
            "Personal Tasks",
            False,
            [new_wire],
            3600,
            user_id,
            username
        )

    return jsonify({'success': True})

@app.route('/api/tasks/<task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Delete a task"""
    user_id = get_current_user()
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    # Find and update bomb to remove the wire
    bomb = bombs_collection.find_one(
        {"user_id": user_id, "exploding": False},
        sort=[("start_time", -1)]
    )
    
    if bomb and bomb.get('wires'):
        # Remove wire by index
        try:
            task_index = int(task_id.split('_')[1]) if '_' in task_id else int(task_id)
            if 0 <= task_index < len(bomb['wires']):
                updated_wires = [wire for i, wire in enumerate(bomb['wires']) if i != task_index]
                bombs_collection.update_one(
                    {"_id": bomb['_id']},
                    {"$set": {"wires": updated_wires}}
                )
        except (ValueError, IndexError):
            pass
    
    return jsonify({'success': True})

# Friends endpoints
@app.route('/api/friends', methods=['GET'])
def get_friends():
    """Get user's friends"""
    user_id = get_current_user()
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    friends_usernames = get_user_friends(user_id)
    friends_list = []
    
    for username in friends_usernames:
        user_doc = users_collection.find_one({"username": username})
        if user_doc:
            friends_list.append({
                'name': username,
                'email': user_doc.get('email', f'{username}@example.com')
            })
    
    return jsonify(friends_list)

@app.route('/api/friends', methods=['POST'])
def add_friend():
    """Add a friend by email"""
    user_id = get_current_user()
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    friend_email = data.get('email', '')
    
    if not friend_email:
        return jsonify({'error': 'Email required'}), 400
    
    # Find user by email
    friend_doc = users_collection.find_one({"email": friend_email})
    if not friend_doc:
        return jsonify({'error': 'User not found'}), 404
    
    friend_username = friend_doc.get('username')
    success = send_friend_request(user_id, friend_username)
    
    if success:
        # Auto-accept for demo purposes
        accept_friend_request(str(friend_doc['_id']), ObjectId(user_id))
        # Return updated friends list for frontend
        friends_usernames = get_user_friends(user_id)
        friends_list = []
        for username in friends_usernames:
            user_doc = users_collection.find_one({"username": username})
            if user_doc:
                friends_list.append({
                    'name': username,
                    'email': user_doc.get('email', f'{username}@example.com')
                })
        return jsonify({'success': True, 'friends': friends_list})
    
    return jsonify({'error': 'Failed to add friend'}), 400

# Punishments endpoints
@app.route('/api/punishments', methods=['GET'])
def get_punishments():
    """Get user's punishments (mock data for now)"""
    user_id = get_current_user()
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    # Return mock data - you can implement actual punishment storage later
    return jsonify([
        {'id': 'p1', 'desc': 'Pay $5 to Riley', 'amount': 5}
    ])

@app.route('/api/punishments', methods=['POST'])
def add_punishment():
    """Add a punishment"""
    user_id = get_current_user()
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    # For now, just return success - implement actual storage later
    return jsonify({'success': True})

# User profile endpoints
@app.route('/api/profile', methods=['GET'])
def get_profile():
    """Get user profile and stats"""
    user_id = get_current_user()
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_doc = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user_doc:
        return jsonify({'error': 'User not found'}), 404
    
    # Calculate stats from bombs
    total_bombs = bombs_collection.count_documents({"user_id": user_id})
    exploded_bombs = bombs_collection.count_documents({"user_id": user_id, "exploding": True})
    defused_bombs = total_bombs - exploded_bombs
    
    return jsonify({
        'user': {
            'name': user_doc.get('username', ''),
            'email': user_doc.get('email', '')
        },
        'stats': {
            'defused': defused_bombs,
            'exploded': exploded_bombs
        }
    })

if __name__ == '__main__':
    if init_database():
        app.run(debug=True, host='0.0.0.0', port=5000)
    else:
        print("Failed to initialize database connection")
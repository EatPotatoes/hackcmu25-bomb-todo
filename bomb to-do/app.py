from flask import Flask, request, jsonify
from flask_cors import CORS # Import CORS to handle cross-origin requests
# Import all the new functions from our updated account_system
from account_system import register_user, login_user, add_task, get_user_tasks

# Create the Flask application
app = Flask(__name__)

# Initialize CORS for the app
CORS(app)

# ============================================
# ACCOUNT API ENDPOINTS
# ============================================
@app.route('/register', methods=['POST'])
def api_register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"error": "Missing required fields"}), 400

    success = register_user(username, email, password)

    if success:
        return jsonify({"message": "User registered successfully"}), 201
    else:
        return jsonify({"error": "Username or email already exists"}), 409

@app.route('/login', methods=['POST'])
def api_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Missing required fields"}), 400

    # The login function now returns a user ID string or None
    user_id = login_user(username, password)

    if user_id:
        # On success, return a success message and the user's ID
        return jsonify({"message": "Login successful", "userId": user_id}), 200
    else:
        return jsonify({"error": "Invalid username or password"}), 401

# ============================================
# TODO LIST API ENDPOINTS
# ============================================
@app.route('/tasks', methods=['POST'])
def api_add_task():
    """Endpoint to add a new task."""
    data = request.get_json()
    description = data.get('description')
    user_id = data.get('userId')

    if not description or not user_id:
        return jsonify({"error": "Missing required fields"}), 400
    
    add_task(description, user_id)
    return jsonify({"message": "Task added successfully"}), 201

@app.route('/tasks/<user_id>', methods=['GET'])
def api_get_tasks(user_id):
    """Endpoint to get all tasks for a user."""
    tasks = get_user_tasks(user_id)
    return jsonify(tasks), 200

# ============================================
# RUN THE FLASK APP
# ============================================
if __name__ == "__main__":
    app.run(debug=True, port=5000)


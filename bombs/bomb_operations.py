# bomb_operations.py

from datetime import datetime, timedelta
import threading
from bson.objectid import ObjectId

def make_wire(name, timer_set=0):
    """
    Creates a wire dictionary with a timer attribute.
    """
    return {
        "name": name,
        "complete": False,
        "timer_set": timer_set,
        "start_time": None,
        "timer_expired": False,
        "verified_by": None # New field to track who verified the task
    }

def add_bomb_to_db(collection, name, exploding, wires, bomb_timer_set, user_id, user_name):
    """
    Adds a bomb to the database, associating it with a user.
    """
    # Ensure wire timers are less than bomb timer
    for wire in wires:
        if wire["timer_set"] > bomb_timer_set:
            print(f"Warning: Wire timer for '{wire['name']}' is greater than bomb timer. Adjusting.")
            wire["timer_set"] = bomb_timer_set

        # Set the start time for each wire
        wire["start_time"] = datetime.utcnow()

    bomb_document = {
        "name": name,
        "exploding": exploding,
        "wires": wires,
        "timer_set": bomb_timer_set,
        "start_time": datetime.utcnow(),
        "user_id": user_id  # Add the user_id field here
    }
    
    try:
        result = collection.insert_one(bomb_document)
        print(f"Successfully inserted bomb '{name}' (ID: {result.inserted_id}) for user '{user_name}' (ID: {user_id}).")
    except Exception as e:
        print(f"An error occurred while inserting: {e}")

def listen_for_wire_timer_end(collection, bomb_name, user_id, users_collection):
    """
    Callback function that runs when a wire timer expires.
    It marks the wire's timer_expired attribute to True only if the wire is not already complete.
    """
    owner_doc = users_collection.find_one({"_id": ObjectId(user_id)})
    owner_name = owner_doc.get("username", "Unknown User")
    
    print(f"\n--- Timer expired for wire on bomb '{bomb_name}'. Owner: '{owner_name}' (ID: {user_id}). ---")
    try:
        # First, check the current state of the wire
        bomb = collection.find_one({"name": bomb_name, "user_id": user_id})
        if bomb:
            is_incomplete = any(not wire['complete'] for wire in bomb.get("wires", []))
            if is_incomplete:
                print(f"Bomb '{bomb_name}' has incomplete wires. Exploding! 💥")
                update_operation = {"$set": {"exploding": True}}
                collection.update_one({"_id": bomb.get("_id")}, update_operation)
                print(f"Bomb '{bomb_name}' (ID: {bomb.get('_id')}) has been set to exploding: True.")
            else:
                print(f"All wires for bomb '{bomb_name}' (ID: {bomb.get('_id')}) are complete. The bomb is disarmed. ✨")

    except Exception as e:
        print(f"An error occurred while updating wire timer status: {e}")

def listen_for_new_bombs(collection, users_collection):
    print("Listening for new bombs...")
    try:
        with collection.watch([{"$match": {"operationType": "insert"}}]) as stream:
            for change in stream:
                bomb_document = change["fullDocument"]
                bomb_name = bomb_document.get("name")
                user_id = bomb_document.get("user_id")

                owner_doc = users_collection.find_one({"_id": ObjectId(user_id)})
                owner_name = owner_doc.get("username", "Unknown User")

                print(f"\n--- New bomb detected: '{bomb_name}' for user '{owner_name}' (ID: {user_id}). ---")
                
                # Schedule bomb timer
                bomb_timer_set = bomb_document.get("timer_set")
                threading.Timer(bomb_timer_set, complete_bomb_timer, args=[collection, bomb_name, user_id, users_collection]).start()
                
                # Schedule individual wire timers
                for wire in bomb_document.get("wires", []):
                    wire_name = wire.get("name")
                    wire_timer_set = wire.get("timer_set")
                    
                    if wire_name and wire_timer_set is not None:
                        print(f"Scheduling timer for wire '{wire_name}' on bomb '{bomb_name}'. Duration: {wire_timer_set}s.")
                        threading.Timer(wire_timer_set, listen_for_wire_timer_end, args=[collection, bomb_name, user_id, users_collection]).start()

    except Exception as e:
        print(f"Error in Change Stream listener: {e}")

def complete_bomb_timer(collection, bomb_name, user_id, users_collection):
    """
    Callback function that runs when a bomb's timer expires.
    It checks if any wires are incomplete or have expired timers and explodes the bomb if so.
    """
    owner_doc = users_collection.find_one({"_id": ObjectId(user_id)})
    owner_name = owner_doc.get("username", "Unknown User")
    
    print(f"\n--- Bomb timer expired for '{bomb_name}' (Owner: '{owner_name}', ID: {user_id}). Checking wire status... ---")
    
    # Retrieve the bomb document to check wire completion status
    bomb = collection.find_one({"name": bomb_name, "user_id": user_id})
    if not bomb:
        print(f"Bomb '{bomb_name}' not found for user '{owner_name}' (ID: {user_id}).")
        return

    is_incomplete = any(not wire['complete'] for wire in bomb.get("wires", []))
    is_expired = any(wire['timer_expired'] for wire in bomb.get("wires", []))

    if is_incomplete or is_expired:
        print(f"Bomb '{bomb_name}' (ID: {bomb.get('_id')}) has incomplete or expired wires. Exploding! 💥")
        update_operation = {"$set": {"exploding": True}}
        collection.update_one({"_id": bomb.get("_id")}, update_operation)
        print(f"Bomb '{bomb_name}' (ID: {bomb.get('_id')}) has been set to exploding: True.")
    else:
        print(f"All wires for bomb '{bomb_name}' (ID: {bomb.get('_id')}) are complete and their timers were disarmed. The bomb is disarmed. ✨")

def verify_wire_task(collection, bomb_name, wire_name, owner_user_id, verifier_user_id, users_collection):
    """
    Allows a user to verify a wire task for a friend.
    """
    try:
        owner_obj_id = ObjectId(owner_user_id)
        verifier_obj_id = ObjectId(verifier_user_id)

        owner_doc = users_collection.find_one({"_id": owner_obj_id})
        verifier_doc = users_collection.find_one({"_id": verifier_obj_id})
        owner_name = owner_doc.get("username", "Unknown User")
        verifier_name = verifier_doc.get("username", "Unknown User")

        # 1. Check if the verifier is a friend of the owner
        if not owner_doc or verifier_obj_id not in owner_doc.get("friends", []):
            print(f"❌ Verification failed: User '{verifier_name}' (ID: {verifier_user_id}) is not a friend of '{owner_name}' (ID: {owner_user_id}).")
            return False

        # 2. Find the specific wire in the bomb
        query = {"name": bomb_name, "user_id": owner_user_id, "wires.name": wire_name}
        bomb_doc = collection.find_one(query)
        if not bomb_doc:
            print(f"❌ Verification failed: Bomb '{bomb_name}' or wire '{wire_name}' not found for user '{owner_name}' (ID: {owner_user_id}).")
            return False

        # 3. Check if the wire is already complete or verified
        wire_doc = next((w for w in bomb_doc.get("wires", []) if w["name"] == wire_name), None)
        if wire_doc and wire_doc["complete"]:
            print(f"❌ Verification failed: Wire '{wire_name}' on bomb '{bomb_name}' is already complete. It was verified by '{wire_doc.get('verified_by', 'Unknown')}'")
            return False

        # 4. Update the wire to be complete and add the verifier's ID
        update_operation = {"$set": {"wires.$.complete": True, "wires.$.verified_by": verifier_user_id}}
        result = collection.update_one(query, update_operation)
        
        if result.matched_count > 0:
            print(f"✅ Wire '{wire_name}' on bomb '{bomb_name}' (ID: {bomb_doc.get('_id')}) successfully verified by friend '{verifier_name}' (ID: {verifier_user_id}).")
            return True
        else:
            print(f"❌ Verification failed: No document was modified. Bomb: '{bomb_name}' (ID: {bomb_doc.get('_id')}).")
            return False

    except Exception as e:
        print(f"An error occurred during verification: {e}")
        return False
# bomb_operations.py

from datetime import datetime, timedelta
import threading

def make_wire(name, timer_set=0):
    """
    Creates a wire dictionary with a timer attribute.
    """
    return {
        "name": name,
        "complete": False,
        "timer_set": timer_set,
        "start_time": None,
        "timer_expired": False
    }

def add_bomb_to_db(collection, name, exploding, wires, bomb_timer_set):
    """
    Adds a bomb to the database, starting its timer and each wire's timer.
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
        "start_time": datetime.utcnow()
    }
    
    try:
        result = collection.insert_one(bomb_document)
        print(f"Successfully inserted bomb with ID: {result.inserted_id}")
    except Exception as e:
        print(f"An error occurred while inserting: {e}")

def complete_wire_task(collection, bomb_name, wire_name):
    """
    Updates a single wire's 'complete' attribute to True.
    """
    try:
        query = {"name": bomb_name, "wires.name": wire_name}
        update_operation = {"$set": {"wires.$.complete": True}}
        result = collection.update_one(query, update_operation)
        
        if result.matched_count > 0:
            print(f"Successfully marked wire '{wire_name}' for bomb '{bomb_name}' as complete.")
        else:
            print(f"No bomb found with name '{bomb_name}' or wire '{wire_name}'.")
    except Exception as e:
        print(f"An error occurred while updating: {e}")

# Revised function to listen for wire timer endings
def listen_for_wire_timer_end(collection, bomb_name, wire_name):
    """
    Callback function that runs when a wire timer expires.
    It marks the wire's timer_expired attribute to True only if the wire is not already complete.
    """
    print(f"\n--- Timer expired for wire '{wire_name}' of bomb '{bomb_name}'. ---")
    try:
        # First, check the current state of the wire
        bomb = collection.find_one({"name": bomb_name, "wires.name": wire_name})
        if bomb:
            # Find the specific wire document
            wire_doc = next((w for w in bomb["wires"] if w["name"] == wire_name), None)
            if wire_doc and not wire_doc["complete"]:
                # If the wire is not complete, update its 'timer_expired' status
                query = {"name": bomb_name, "wires.name": wire_name}
                update_operation = {"$set": {"wires.$.timer_expired": True}}
                result = collection.update_one(query, update_operation)
                
                if result.matched_count > 0:
                    print(f"Successfully marked wire '{wire_name}' for bomb '{bomb_name}' as having an expired timer.")
            else:
                print(f"Wire '{wire_name}' for bomb '{bomb_name}' was already complete. No update needed.")
    except Exception as e:
        print(f"An error occurred while updating wire timer status: {e}")

# Listener for a new bomb insertion
def listen_for_new_bombs(collection):
    print("Listening for new bombs...")
    try:
        with collection.watch([{"$match": {"operationType": "insert"}}]) as stream:
            for change in stream:
                bomb_document = change["fullDocument"]
                bomb_name = bomb_document.get("name")
                
                # Schedule bomb timer
                bomb_timer_set = bomb_document.get("timer_set")
                threading.Timer(bomb_timer_set, complete_bomb_timer, args=[collection, bomb_name]).start()
                
                # Schedule individual wire timers
                for wire in bomb_document.get("wires", []):
                    wire_name = wire.get("name")
                    wire_timer_set = wire.get("timer_set")
                    
                    if wire_name and wire_timer_set is not None:
                        print(f"Scheduling timer for wire '{wire_name}' on bomb '{bomb_name}'. Duration: {wire_timer_set}s.")
                        threading.Timer(wire_timer_set, listen_for_wire_timer_end, args=[collection, bomb_name, wire_name]).start()

    except Exception as e:
        print(f"Error in Change Stream listener: {e}")

# Revised callback function to check wire status and explode if incomplete
def complete_bomb_timer(collection, bomb_name):
    """
    Callback function that runs when a bomb's timer expires.
    It checks if any wires are incomplete or have expired timers and explodes the bomb if so.
    """
    print(f"\n--- Bomb timer expired for '{bomb_name}'. Checking wire status... ---")
    
    # Retrieve the bomb document to check wire completion status
    bomb = collection.find_one({"name": bomb_name})
    if not bomb:
        print(f"Bomb '{bomb_name}' not found.")
        return

    # A bomb explodes if any wire is *not* complete OR if a wire's timer has expired
    is_incomplete = any(not wire['complete'] for wire in bomb.get("wires", []))
    is_expired = any(wire['timer_expired'] for wire in bomb.get("wires", []))

    if is_incomplete or is_expired:
        print(f"Bomb '{bomb_name}' has incomplete or expired wires. Exploding! 💥")
        update_operation = {"$set": {"exploding": True}}
        collection.update_one({"name": bomb_name}, update_operation)
        print(f"Bomb '{bomb_name}' has been set to exploding: True.")
    else:
        print(f"All wires for bomb '{bomb_name}' are complete and their timers were disarmed. The bomb is disarmed. ✨")
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
        "start_time": None  # Will be set when added to a bomb
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

# New function to listen for wire timer endings
def listen_for_wire_timer_end(collection, bomb_name, wire_name):
    """
    Callback function that runs when a wire timer expires.
    It marks the wire as complete in the database.
    """
    print(f"\n--- Timer expired for wire '{wire_name}' of bomb '{bomb_name}'. ---")
    complete_wire_task(collection, bomb_name, wire_name)

# New listener for a new bomb insertion
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

# Callback function to explode a bomb
def complete_bomb_timer(collection, bomb_name):
    print(f"\n--- Bomb timer expired for '{bomb_name}'. Exploding... ---")
    update_operation = {"$set": {"exploding": True}}
    collection.update_one({"name": bomb_name}, update_operation)
    print(f"Bomb '{bomb_name}' has been set to exploding: True.")
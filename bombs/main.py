# main.py

from database_connection import get_database_connection, clear_collection
from bomb_operations import add_bomb_to_db, listen_for_new_bombs, make_wire, complete_wire_task
import time
import threading

if __name__ == "__main__":
    client = get_database_connection()
    if client:
        db = client['bomb_database']
        bombs_collection = db['bombs']
        
        clear_collection(bombs_collection)

        # Start the Change Stream listener for new bombs in a separate thread
        listener_thread = threading.Thread(target=listen_for_new_bombs, args=(bombs_collection,), daemon=True)
        listener_thread.start()

        print("\n--- Main process running. Add bombs to trigger the listener. ---")

        # Create wires with timers
        wire1 = make_wire("short_wire", timer_set=3)
        wire2 = make_wire("medium_wire", timer_set=8)
        
        # Example 1: Add a bomb with multiple wires and a timer
        wires_bomb_1 = [wire1, wire2]
        add_bomb_to_db(bombs_collection, "cs_major", False, wires_bomb_1, 10) # Bomb timer is 10s

        wire3 = make_wire("long_wire", timer_set=15)
        wires_bomb_2 = [wire3]
        add_bomb_to_db(bombs_collection, "math_major", True, wires_bomb_2, 15) # Bomb timer is 15s

        complete_wire_task(bombs_collection, "cs_major", "short_wire")
        complete_wire_task(bombs_collection, "cs_major", "medium_wire")
        
        print("Keeping thread alive")
        input()

        # Verify the final state
        print("\n--- Final state of bombs ---")
        for bomb in bombs_collection.find():
            print(f"Bomb: {bomb['name']}, Exploding: {bomb['exploding']}, Timer Set: {bomb['timer_set']}")
            for wire in bomb.get("wires", []):
                print(f"  Wire: {wire['name']}, Complete: {wire['complete']}, Timer Expired: {wire['timer_expired']}")

        # Close the connection
        client.close()
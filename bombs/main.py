# main.py

from database_connection import get_database_connection, clear_collection
from bomb_operations import add_bomb_to_db, listen_for_new_bombs, make_wire
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
        add_bomb_to_db(bombs_collection, "cs major", False, wires_bomb_1, 10) # Bomb timer is 10s

        # Keep the main thread alive to allow the listeners to run
        print("\n--- Main thread will now sleep for 12 seconds to observe all timers. ---")
        time.sleep(12)
        
        print("\n--- All scheduled timers should have completed. ---")
        
        # Verify the final state
        print("\n--- Final state of bombs ---")
        for bomb in bombs_collection.find():
            print(bomb)

        # Close the connection
        client.close()
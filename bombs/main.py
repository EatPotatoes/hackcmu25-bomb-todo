# main.py

from database_connection import get_database_connection, clear_collection
from bomb_operations import add_bomb_to_db, listen_for_new_bombs, make_wire, verify_wire_task
from account_system import (
    register_user, login_user, 
    send_friend_request, accept_friend_request, get_user_friends, 
    client as account_client, users_collection as users_coll
)
import time
import threading
from bson.objectid import ObjectId

def main_menu():
    """Presents the main menu and handles user input."""
    while True:
        print("\n--- Virtual Bomb-like To-Do List ---")
        print("1. Register")
        print("2. Login")
        print("3. Exit")
        choice = input("Enter your choice: ")
        
        if choice == '1':
            username = input("Enter username: ")
            email = input("Enter email: ")
            password = input("Enter password: ")
            register_user(username, email, password)
        elif choice == '2':
            username = input("Enter username: ")
            password = input("Enter password: ")
            user_id = login_user(username, password)
            if user_id:
                return user_id
        elif choice == '3':
            print("Exiting...")
            return None
        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    bomb_client = get_database_connection()
    if bomb_client:
        bomb_db = bomb_client['bomb_database']
        bombs_collection = bomb_db['bombs']
        
        print("\n--- User Setup ---")
        register_user("Alice", "alice@example.com", "password123")
        register_user("Bob", "bob@example.com", "password123")
        
        alice_id = login_user("Alice", "password123")
        bob_id = login_user("Bob", "password123")

        if alice_id and bob_id:
            print("\n--- Establishing Friendship ---")
            send_friend_request(alice_id, "Bob")
            accept_friend_request(bob_id, alice_id)
            print(f"Alice's friends: {get_user_friends(alice_id)}")
            print(f"Bob's friends: {get_user_friends(bob_id)}")

            clear_collection(bombs_collection)

            listener_thread = threading.Thread(target=listen_for_new_bombs, args=(bombs_collection, users_coll), daemon=True)
            listener_thread.start()

            print("\n--- Main process running. ---")

            # Scenario 1: Alice's bomb is disarmed by Bob's verification.
            wire_a1 = make_wire("disarm_task_1", timer_set=5)
            wire_a2 = make_wire("disarm_task_2", timer_set=8)
            wires_disarm = [wire_a1, wire_a2]
            add_bomb_to_db(bombs_collection, "Finals Week Project", False, wires_disarm, 10, alice_id, "Alice")
            print(f"\nAlice (ID: {alice_id}) needs Bob (ID: {bob_id}) to verify her tasks...")
            time.sleep(3)
            verify_wire_task(bombs_collection, "Finals Week Project", "disarm_task_1", alice_id, bob_id, users_coll)
            time.sleep(2)
            verify_wire_task(bombs_collection, "Finals Week Project", "disarm_task_2", alice_id, bob_id, users_coll)
            
            # Scenario 2: Alice's bomb explodes because only one of two tasks is verified.
            wire_a3 = make_wire("explode_task_1", timer_set=5)
            wire_a4 = make_wire("explode_task_2", timer_set=8)
            wires_explode_partial = [wire_a3, wire_a4]
            add_bomb_to_db(bombs_collection, "Thesis Proposal", False, wires_explode_partial, 10, alice_id, "Alice")
            print(f"\nAlice (ID: {alice_id}) is trying to get her thesis tasks verified. Only one task is completed.")
            time.sleep(3)
            verify_wire_task(bombs_collection, "Thesis Proposal", "explode_task_1", alice_id, bob_id, users_coll)
            # The second task is intentionally not verified, causing the bomb to explode.

            # Scenario 3: Bob's bomb is disarmed by Alice's verification.
            wire_b1 = make_wire("friend_task_1", timer_set=5)
            wire_b2 = make_wire("friend_task_2", timer_set=8)
            wires_friend_disarm = [wire_b1, wire_b2]
            add_bomb_to_db(bombs_collection, "Group Project", False, wires_friend_disarm, 10, bob_id, "Bob")
            print(f"\nBob (ID: {bob_id}) is working on his group project tasks...")
            time.sleep(3)
            verify_wire_task(bombs_collection, "Group Project", "friend_task_1", bob_id, alice_id, users_coll)
            print(f"Alice (ID: {alice_id}) is helping verify the second task for Bob (ID: {bob_id})...")
            time.sleep(2)
            verify_wire_task(bombs_collection, "Group Project", "friend_task_2", bob_id, alice_id, users_coll)

            # Scenario 4: Bob's bomb explodes due to a missed deadline.
            wire_b3 = make_wire("deadline_task_1", timer_set=3)
            wire_b4 = make_wire("deadline_task_2", timer_set=8)
            wires_deadline_explode = [wire_b3, wire_b4]
            add_bomb_to_db(bombs_collection, "Budget Report", False, wires_deadline_explode, 10, bob_id, "Bob")
            print(f"\nBob (ID: {bob_id}) is working on his report, but a task deadline is missed...")
            
            # Scenario 5: Bob's bomb explodes because only one of two tasks is verified.
            wire_b5 = make_wire("partial_task_1", timer_set=5)
            wire_b6 = make_wire("partial_task_2", timer_set=8)
            wires_explode_partial_b = [wire_b5, wire_b6]
            add_bomb_to_db(bombs_collection, "Client Presentation", False, wires_explode_partial_b, 10, bob_id, "Bob")
            print(f"\nBob (ID: {bob_id}) is working on a presentation. Only the first task is verified by Alice.")
            time.sleep(3)
            verify_wire_task(bombs_collection, "Client Presentation", "partial_task_1", bob_id, alice_id, users_coll)
            # The second task is not verified.

            try:
                print("\n--- Press Enter to exit the program. ---")
                input()
            except KeyboardInterrupt:
                pass
            
            print("\n--- All scheduled timers should have completed. ---")
            
            # Verify the final state for Alice's bombs
            print(f"\n--- Final state of bombs for Alice ---")
            for bomb in bombs_collection.find({"user_id": alice_id}):
                print(f"Bomb: {bomb.get('name')}, Exploding: {bomb.get('exploding')}")
                for wire in bomb.get("wires", []):
                    verified_by_id = wire.get('verified_by')
                    verified_by_info = "Not yet verified"
                    if verified_by_id:
                        verifier_doc = users_coll.find_one({"_id": ObjectId(verified_by_id)})
                        if verifier_doc:
                            verified_by_info = f"{verifier_doc.get('username')} (ID: {verified_by_id})"
                    print(f"  Wire: {wire.get('name')}, Verified by: {verified_by_info}, "
                          f"Complete: {wire.get('complete')}, Timer Expired: {wire.get('timer_expired')}")

            # Verify the final state for Bob's bombs
            print(f"\n--- Final state of bombs for Bob ---")
            for bomb in bombs_collection.find({"user_id": bob_id}):
                print(f"Bomb: {bomb.get('name')}, Exploding: {bomb.get('exploding')}")
                for wire in bomb.get("wires", []):
                    verified_by_id = wire.get('verified_by')
                    verified_by_info = "Not yet verified"
                    if verified_by_id:
                        verifier_doc = users_coll.find_one({"_id": ObjectId(verified_by_id)})
                        if verifier_doc:
                            verified_by_info = f"{verifier_doc.get('username')} (ID: {verified_by_id})"
                    print(f"  Wire: {wire.get('name')}, Verified by: {verified_by_info}, "
                          f"Complete: {wire.get('complete')}, Timer Expired: {wire.get('timer_expired')}")

            # Close connections
            bomb_client.close()
            account_client.close()
        else:
            print("Login failed. Exiting.")
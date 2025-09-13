# database_connection.py

from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import certifi

def get_database_connection():
    """Establishes and returns a MongoDB client connection."""
    ca = certifi.where()
    uri = "mongodb+srv://garyguo_db_user:Afe33MxMOb19Q6we@cluster0.v8hr1d9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    try:
        client = MongoClient(uri, server_api=ServerApi('1'), tlsCAFile=ca)
        client.admin.command('ping')
        print("Pinged your deployment. You successfully connected to MongoDB!")
        return client
    except Exception as e:
        print(f"Connection failed: {e}")
        return None

def clear_collection(collection):
    """
    Deletes all documents from a given collection.
    
    Args:
        collection: The PyMongo collection object to clear.
    """
    try:
        result = collection.delete_many({})
        print(f"Cleared the collection. Deleted {result.deleted_count} documents.")
    except Exception as e:
        print(f"An error occurred while clearing the collection: {e}")
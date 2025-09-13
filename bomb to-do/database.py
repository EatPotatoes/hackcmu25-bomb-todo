# database.py

from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import certifi # 1. Import certifi

# Get the path to the certificate bundle
ca = certifi.where()

# Your URI with the real password
uri = "mongodb+srv://garyguo_db_user:Afe33MxMOb19Q6we@cluster0.v8hr1d9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

# 2. Add the tlsCAFile=ca parameter to your client
client = MongoClient(uri, server_api=ServerApi('1'), tlsCAFile=ca)

# Send a ping to confirm a successful connection
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)
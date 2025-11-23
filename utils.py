import json
import os
from web3 import Web3
from eth_account.messages import encode_defunct

# --- KONFIGURASI BLOCKCHAIN ---
RPC_URL = "http://127.0.0.1:8545"
w3 = Web3(Web3.HTTPProvider(RPC_URL))

# (Alamat ini biasanya SAMA TERUS selama Anda pakai Anvil & Key yang sama)
REGISTRY_CONTRACT_ADDRESS = "0xA15BB66138824a1c7167f5E85b957d04Dd34E468"

# Path ke file JSON hasil compile Foundry
ARTIFACT_PATH = './out/SimpleDIDRegistry.sol/SimpleDIDRegistry.json'

def get_contract():
    """
    Langsung mengembalikan instance contract yang sudah dideploy.
    Tidak perlu input address lagi karena sudah di-hardcode di atas.
    """
    if not os.path.exists(ARTIFACT_PATH):
        print("❌ Error: File artifact tidak ditemukan. Jalankan 'forge build'!")
        return None

    with open(ARTIFACT_PATH) as f:
        artifact = json.load(f)
        abi = artifact['abi']
    
    # Return contract instance yang siap pakai
    return w3.eth.contract(address=REGISTRY_CONTRACT_ADDRESS, abi=abi)

# --- FUNGSI KRIPTOGRAFI OFF-CHAIN (Tetap Sama) ---
def sign_data(data_dict, private_key):
    json_str = json.dumps(data_dict, sort_keys=True)
    message = encode_defunct(text=json_str)
    signed_message = w3.eth.account.sign_message(message, private_key=private_key)
    return signed_message.signature.hex()

def verify_signature(data_dict, signature):
    json_str = json.dumps(data_dict, sort_keys=True)
    message = encode_defunct(text=json_str)
    return w3.eth.account.recover_message(message, signature=signature)

# --- FUNGSI DB (Tetap Sama untuk Simpan Wallet Mahasiswa) ---
def load_db(filename):
    path = f"data/{filename}"
    if not os.path.exists(path):
        return {}
    with open(path, 'r') as f:
        return json.load(f)

def save_db(filename, data):
    if not os.path.exists("data"):
        os.makedirs("data")
    path = f"data/{filename}"
    with open(path, 'w') as f:
        json.dump(data, f, indent=4)
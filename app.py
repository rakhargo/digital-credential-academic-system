import streamlit as st
import json
from web3 import Web3
from eth_hash.auto import keccak

# --- KONFIGURASI ---
RPC_URL = "http://127.0.0.1:8545"
# GANTI SETELAH DEPLOY BARU!
CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3" 

# AKUN DEMO (Dari Anvil)
# Account 0: Admin PDDikti (Deployer)
# Account 1: Issuer (Kampus UPI)
ISSUER_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
ISSUER_ADDR = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
# Account 2: Holder (Mahasiswa - Rakha)
HOLDER_KEY = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
HOLDER_ADDR = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"

def get_contract(w3):
    # Perhatikan path folder json-nya mungkin berubah jadi AcademicIdentitySystem.sol
    path = './out/AcademicIdentitySystem.sol/AcademicIdentitySystem.json'
    with open(path) as f:
        abi = json.load(f)['abi']
    return w3.eth.contract(address=CONTRACT_ADDRESS, abi=abi)

def send_transaction(w3, func, private_key):
    account = w3.eth.account.from_key(private_key)
    nonce = w3.eth.get_transaction_count(account.address)
    tx = func.build_transaction({
        'chainId': 31337, 
        'gas': 2000000, 
        'gasPrice': w3.to_wei('50', 'gwei'),
        'nonce': nonce
    })
    signed = w3.eth.account.sign_transaction(tx, private_key)
    return w3.eth.send_raw_transaction(signed.raw_transaction)

# --- UI SETUP ---
st.set_page_config(page_title="SSI Academic System", layout="wide")
st.title("🎓 SSI: Sistem Identitas & Kredensial Akademik")
st.caption("Implementasi Alur 10 Langkah: DID Registry + Verifiable Credentials")

w3 = Web3(Web3.HTTPProvider(RPC_URL))
if not w3.is_connected():
    st.error("Anvil mati!")
    st.stop()

try:
    contract = get_contract(w3)
except Exception as e:
    st.error(f"Gagal load ABI. Pastikan path file JSON benar: {e}")
    st.stop()

# MENU
menu = st.sidebar.radio("Login Sebagai:", ["👤 Mahasiswa (Holder)", "🏛️ Kampus (Issuer)", "🔍 Perusahaan (Verifier)"])

# --- 1. MENU MAHASISWA (Langkah 1-3) ---
if menu == "👤 Mahasiswa (Holder)":
    st.header("1. Panel Mahasiswa (DID Registry)")
    st.info(f"Login sebagai Rakha (Holder)\nAddr: `{HOLDER_ADDR}`")
    
    st.write("Langkah ini mendaftarkan Identitas Digital (DID) Anda ke Blockchain agar bisa menerima ijazah.")
    
    did_uri = st.text_input("Buat DID URI Anda", value="did:ethr:rakha2025")
    metadata = st.text_input("Link Metadata (IPFS)", value="ipfs://QmHashDataProfilRakha")
    
    if st.button("Daftarkan DID Saya"):
        try:
            tx_hash = send_transaction(
                w3, 
                contract.functions.registerDID(did_uri, metadata), 
                HOLDER_KEY
            )
            st.success(f"✅ Sukses! DID Terdaftar. Hash: {tx_hash.hex()}")
        except Exception as e:
            st.error(f"Gagal: {e}")

# --- 2. MENU KAMPUS (Langkah 4-6) ---
elif menu == "🏛️ Kampus (Issuer)":
    st.header("2. Panel Kampus (Credential Issuance)")
    st.info(f"Login sebagai Universitas (Issuer)\nAddr: `{ISSUER_ADDR}`")
    
    st.warning("Pastikan Mahasiswa SUDAH mendaftarkan DID-nya sebelum diterbitkan ijazah.")
    
    col1, col2 = st.columns(2)
    with col1:
        target_mhs = st.text_input("Wallet Mahasiswa", value=HOLDER_ADDR)
        no_ijazah = st.text_input("Nomor Ijazah (ID)", value="IJAZAH-2025-001")
    with col2:
        data_raw = st.text_area("Data Mentah (JSON Content)", value="Rakha | S1 Ilkom | Lulus 2025")
    
    if st.button("Terbitkan & Catat ke Blockchain"):
        # Simulasi Hashing & Signing Off-chain
        vc_id_hash = Web3.keccak(text=no_ijazah)
        vc_content_hash = Web3.keccak(text=data_raw) # Anggap ini sudah di-sign
        
        try:
            tx_hash = send_transaction(
                w3,
                contract.functions.recordCredentialHash(vc_id_hash, vc_content_hash, target_mhs),
                ISSUER_KEY
            )
            st.success("✅ Ijazah diterbitkan ke Ledger!")
            st.code(f"VC ID Hash: {vc_id_hash.hex()}")
        except Exception as e:
            st.error(f"Gagal: {e}")
            if "Holder belum" in str(e):
                st.warning("⚠️ Mahasiswa ini belum punya DID! Suruh dia daftar dulu di menu sebelah.")

# --- 3. MENU VERIFIER (Langkah 10) ---
elif menu == "🔍 Perusahaan (Verifier)":
    st.header("3. Panel Verifikasi")
    st.write("Cek validitas kredensial langsung ke Blockchain.")
    
    search_id = st.text_input("Masukkan Nomor Ijazah", value="IJAZAH-2025-001")
    
    if st.button("Verifikasi Status"):
        vc_id_hash = Web3.keccak(text=search_id)
        
        # Call Read-Only Function
        is_valid, issuer, holder = contract.functions.verifyCredentialStatus(vc_id_hash).call()
        
        if is_valid:
            st.success("✅ VALID & TERDAFTAR")
            st.json({
                "Status": "Active",
                "Issuer Address": issuer,
                "Holder Address": holder,
                "Keterangan": "Issuer terdaftar resmi di PDDikti"
            })
        else:
            st.error("❌ TIDAK VALID / TIDAK DITEMUKAN")
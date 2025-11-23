import streamlit as st
import utils
import pandas as pd
from datetime import datetime

# --- CONFIG & STYLING ---
st.set_page_config(page_title="Etherscan Lokal", page_icon="🔗", layout="wide")

# Custom CSS agar hash panjang tidak merusak tampilan tapi bisa discroll/copy
st.markdown("""
<style>
    .hash-text { font-family: 'Courier New', monospace; color: #e67e22; font-size: 14px; }
    .status-success { color: #27ae60; font-weight: bold; padding: 4px 8px; border-radius: 4px; background: #eafaf1; }
    .status-fail { color: #c0392b; font-weight: bold; padding: 4px 8px; border-radius: 4px; background: #fdedec; }
    .block-container { padding-top: 2rem; }
</style>
""", unsafe_allow_html=True)

# --- FUNGSI NAVIGASI ---
def go_to_tx(tx_hash):
    st.query_params["tx"] = tx_hash

def go_home():
    if "tx" in st.query_params:
        del st.query_params["tx"]

# --- SETUP KONEKSI ---
if not utils.w3.is_connected():
    st.error("❌ Gagal konek ke Anvil. Nyalakan terminal 'anvil'!")
    st.stop()

contract = utils.get_contract()
contract_addr = utils.REGISTRY_CONTRACT_ADDRESS.lower() if contract else ""

# --- FUNGSI DECODER ---
def decode_tx_input(tx_input):
    if tx_input == "0x": return "Transfer ETH", {}
    if not contract: return "Unknown Contract Call", {}
    
    try:
        func_obj, func_params = contract.decode_function_input(tx_input)
        return func_obj.fn_name, func_params
    except:
        return "Contract Deployment / Unknown", {}

# =========================================================
# HALAMAN 1: TRANSACTION DETAILS (Mirip Etherscan Transaction Page)
# =========================================================
if "tx" in st.query_params:
    tx_hash = st.query_params["tx"]
    
    st.button("← Kembali ke Dashboard", on_click=go_home)
    st.title("Transaction Details")
    st.markdown("---")

    try:
        tx = utils.w3.eth.get_transaction(tx_hash)
        receipt = utils.w3.eth.get_transaction_receipt(tx_hash)
        
        status_html = '<span class="status-success">Success</span>' if receipt['status'] == 1 else '<span class="status-fail">Failed</span>'
        method_name, params = decode_tx_input(tx['input'])
        
        # --- TABEL DETAIL UTAMA ---
        with st.container():
            col_label, col_val = st.columns([1, 3])
            
            with col_label:
                st.write("**Transaction Hash:**")
                st.write("**Status:**")
                st.write("**Block:**")
                st.write("**Timestamp:**")
                st.write("") # Spacer
                st.write("**Method:**")
                st.write("**From:**")
                st.write("**To:**")
            
            with col_val:
                st.code(tx_hash, language="text") # Full Hash Copyable
                st.markdown(status_html, unsafe_allow_html=True)
                st.write(f"#{tx['blockNumber']}")
                
                # Get Timestamp
                block = utils.w3.eth.get_block(tx['blockNumber'])
                ts = datetime.fromtimestamp(block['timestamp'])
                st.write(f"{ts} ({ts.astimezone().tzname()})")
                
                st.write("") # Spacer
                st.write(f"🛠️ `{method_name}`")
                st.code(tx['from'], language="text")
                st.code(tx['to'] if tx['to'] else "[Contract Creation]", language="text")

        st.markdown("---")
        
        # --- TABEL VALUE & GAS ---
        c1, c2, c3 = st.columns(3)
        with c1:
            st.metric("Value", f"{utils.w3.from_wei(tx['value'], 'ether')} ETH")
        with c2:
            gas_used = receipt['gasUsed']
            gas_price_gwei = utils.w3.from_wei(tx['gasPrice'], 'gwei')
            tx_fee = utils.w3.from_wei(gas_used * tx['gasPrice'], 'ether')
            st.metric("Transaction Fee", f"{tx_fee:.8f} ETH")
        with c3:
            st.metric("Gas Price", f"{gas_price_gwei:.2f} Gwei")

        # --- INPUT DATA (DECODED) ---
        st.markdown("### 📥 Input Data")
        if params:
            st.info(f"Function: **{method_name}**")
            st.json(params) # Menampilkan parameter fungsi secara rapi
        else:
            st.text_area("Raw Input Data", tx['input'], height=100)

    except Exception as e:
        st.error(f"Transaksi tidak ditemukan atau error: {e}")

# =========================================================
# HALAMAN 2: DASHBOARD (HOME)
# =========================================================
else:
    # Header Metrics
    st.title("🧱 Local Blockchain Explorer")
    
    m1, m2, m3, m4 = st.columns(4)
    latest_block = utils.w3.eth.block_number
    gas_price = utils.w3.eth.gas_price
    
    m1.metric("Latest Block", f"#{latest_block}")
    m2.metric("Gas Price", f"{utils.w3.from_wei(gas_price, 'gwei'):.2f} Gwei")
    m3.metric("Chain ID", utils.w3.eth.chain_id)
    m4.metric("Transactions", "Real-time")
    
    st.markdown("---")
    
    # --- LIST TRANSAKSI (MANUAL TABLE BIAR BISA KLIK) ---
    st.subheader("📜 Latest Transactions")
    
    # Ambil 15 Blok Terakhir
    blocks_to_scan = 15
    start = max(0, latest_block - blocks_to_scan)
    
    # Header Tabel Custom
    h1, h2, h3, h4, h5 = st.columns([1.5, 3, 3, 1, 1])
    h1.markdown("**Method**")
    h2.markdown("**Tx Hash**")
    h3.markdown("**From / To**")
    h4.markdown("**Value**")
    h5.markdown("**Action**")
    
    st.divider()

    found_tx = False
    
    # Loop mundur dari blok terbaru
    for b_idx in range(latest_block, start - 1, -1):
        block = utils.w3.eth.get_block(b_idx, full_transactions=True)
        timestamp = datetime.fromtimestamp(block['timestamp']).strftime('%H:%M:%S')
        
        for tx in block['transactions']:
            found_tx = True
            method_name, _ = decode_tx_input(tx['input'])
            tx_hash_str = tx['hash'].hex()
            
            # Layout Baris
            c1, c2, c3, c4, c5 = st.columns([1.5, 3, 3, 1, 1])
            
            with c1:
                st.code(method_name, language="text")
            
            with c2:
                # Tampilkan HASH LENGKAP tanpa pruning
                st.code(tx_hash_str, language="text")
                st.caption(f"Block #{b_idx} • {timestamp}")
            
            with c3:
                st.write("From:")
                st.code(tx['from'], language="text")
                st.write("To:")
                st.code(tx['to'] if tx['to'] else "Create Contract", language="text")
                
            with c4:
                val = utils.w3.from_wei(tx['value'], 'ether')
                st.write(f"{val} ETH")
            
            with c5:
                # Tombol untuk melihat detail (Routing)
                if st.button("View", key=tx_hash_str):
                    go_to_tx(tx_hash_str)
                    st.rerun() # Refresh agar pindah halaman
            
            st.divider() # Garis pemisah antar transaksi

    if not found_tx:
        st.info("Belum ada transaksi di 15 blok terakhir.")
    
    if st.button("🔄 Refresh Data"):
        st.rerun()
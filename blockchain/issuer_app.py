import streamlit as st
import utils
import datetime
import uuid

st.set_page_config(page_title="Issuer Portal", page_icon="🏛️", layout="wide")

# AKUN KAMPUS (anvil #0)
ISSUER_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
ISSUER_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
ISSUER_DID = f"did:ethr:{ISSUER_ADDRESS}"

# AKUN ADMIN (anvil #9)
ADMIN_PRIVATE_KEY = "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6"
ADMIN_ADDRESS = "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720"

contract = utils.get_contract()
if not contract:
    st.error("Gagal load contract. Cek utils.py!")
    st.stop()

st.title("🏛️ Portal Akademik (Issuer)")
st.caption(f"Issuer DID: `{ISSUER_DID}`")

# --- STATUS & SIMULASI AKREDITASI ---
st.divider()
col_stat, col_action = st.columns([3, 1])

try:
    is_active, is_verified, org_name, _ = contract.functions.resolveDID(ISSUER_ADDRESS).call()
    
    with col_stat:
        if is_active:
            if is_verified:
                st.success(f"✅ **TERVERIFIKASI:** {org_name} (Official Issuer)")
            else:
                st.warning(f"⚠️ **UNVERIFIED:** {org_name} terdaftar tapi belum diakui.")
        else:
            st.error("❌ Belum Terdaftar di Blockchain.")

    with col_action:
        if not is_active:
            if st.button("📝 Daftar DID"):
                tx = contract.functions.registerDID(ISSUER_DID, "Universitas Pendidikan Indonesia").build_transaction({
                    'from': ISSUER_ADDRESS, 'nonce': utils.w3.eth.get_transaction_count(ISSUER_ADDRESS), 'gas': 1000000, 'gasPrice': utils.w3.to_wei('1', 'gwei')
                })
                utils.w3.eth.send_raw_transaction(utils.w3.eth.account.sign_transaction(tx, ISSUER_PRIVATE_KEY).raw_transaction)
                st.rerun()
        elif not is_verified:
            if st.button("👑 Self-Verify (Simulasi Admin)"):
                tx = contract.functions.verifyIssuer(ISSUER_ADDRESS).build_transaction({ # harusnya dari admin
                    'from': ADMIN_ADDRESS, 'nonce': utils.w3.eth.get_transaction_count(ADMIN_ADDRESS), 'gas': 1000000, 'gasPrice': utils.w3.to_wei('1', 'gwei')
                })
                utils.w3.eth.send_raw_transaction(utils.w3.eth.account.sign_transaction(tx, ADMIN_PRIVATE_KEY).raw_transaction)
                st.success("Akun Terverifikasi!")
                st.rerun()
except Exception as e:
    st.error(f"Blockchain Error: {e}")

# --- TABS MENU ---
tab_issue, tab_revoke = st.tabs(["📤 Terbitkan Ijazah", "🚨 Cabut Ijazah (Revoke)"])

# TAB 1: PENERBITAN (ANCHORING)
with tab_issue:
    st.subheader("Penerbitan Ijazah Baru")
    with st.form("issuance_form"):
        c1, c2 = st.columns(2)
        mhs_name = c1.text_input("Nama Mahasiswa")
        degree = c2.selectbox("Gelar", ["Sarjana Komputer (S.Kom)", "Magister Komputer (M.Kom)"])
        target_did = st.text_input("DID Wallet Mahasiswa", placeholder="did:ethr:0x...")
        
        submitted = st.form_submit_button("🔏 Tanda Tangani & Catat di Blockchain")

    if submitted:
        if not is_verified:
            st.error("Gagal: Kampus harus Terverifikasi (Centang Biru) dulu sebelum menerbitkan ijazah!")
        else:
            # 1. Buat Data JSON
            credential_payload = {
                "@context": ["https://www.w3.org/2018/credentials/v1"],
                "id": f"urn:uuid:{str(uuid.uuid4())}",
                "type": ["VerifiableCredential", "UniversityDegreeCredential"],
                "issuer": ISSUER_DID,
                "issuanceDate": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "credentialSubject": {
                    "id": target_did,
                    "data": {"name": mhs_name, "degree": degree, "university": "Universitas Pendidikan Indonesia"}
                }
            }

            # 2. Hitung Hash (Sidik Jari)
            vc_hash = utils.hash_json(credential_payload)

            try:
                # 3. Kirim Hash ke Blockchain (Anchoring)
                tx = contract.functions.issueCredential(vc_hash).build_transaction({
                    'from': ISSUER_ADDRESS, 
                    'nonce': utils.w3.eth.get_transaction_count(ISSUER_ADDRESS), 
                    'gas': 500000, 'gasPrice': utils.w3.to_wei('1', 'gwei')
                })
                signed_tx = utils.w3.eth.account.sign_transaction(tx, ISSUER_PRIVATE_KEY)
                tx_hash = utils.w3.eth.send_raw_transaction(signed_tx.raw_transaction)

                # 4. Sign Off-Chain
                signature = utils.sign_data(credential_payload, ISSUER_PRIVATE_KEY)
                
                final_vc = {
                    "credential": credential_payload,
                    "proof": {
                        "type": "EcdsaSecp256k1Signature2019",
                        "verificationMethod": f"{ISSUER_DID}#controller",
                        "jws": signature
                    }
                }
                
                st.success("✅ Ijazah Tercatat & Terbit!")
                st.info(f"🔗 Blockchain Tx: `{tx_hash.hex()}`")
                st.info(f"🔑 VC Hash (Anchor): `{vc_hash.hex()}`")
                st.json(final_vc)
                
            except Exception as e:
                st.error(f"Gagal Anchoring: {e}")

# TAB 2: PENCABUTAN (REVOCATION)
with tab_revoke:
    st.warning("Fitur ini digunakan untuk membatalkan validitas ijazah secara permanen di Blockchain.")
    hash_input = st.text_input("Masukkan Hash VC yang ingin dicabut (Lihat di JSON Verifier):")
    reason_input = st.text_input("Alasan Pencabutan", value="Kesalahan Data Administrasi")
    
    if st.button("🔥 Cabut Ijazah Permanen"):
        if hash_input:
            try:
                tx = contract.functions.revokeCredential(hash_input, reason_input).build_transaction({
                    'from': ISSUER_ADDRESS, 
                    'nonce': utils.w3.eth.get_transaction_count(ISSUER_ADDRESS), 
                    'gas': 500000, 'gasPrice': utils.w3.to_wei('1', 'gwei')
                })
                signed = utils.w3.eth.account.sign_transaction(tx, ISSUER_PRIVATE_KEY)
                utils.w3.eth.send_raw_transaction(signed.raw_transaction)
                st.error(f"Ijazah {hash_input[:10]}... BERHASIL DICABUT!")
            except Exception as e:
                st.error(f"Gagal mencabut: {e}")
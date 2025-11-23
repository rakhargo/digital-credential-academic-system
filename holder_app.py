import streamlit as st
import utils
import json

st.set_page_config(page_title="Holder Wallet", page_icon="Gp")

# --- SESSION SETUP ---
# Hardcode Akun Mahasiswa (Dari Anvil Account #1)
HOLDER_PK = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
HOLDER_ADDR = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
HOLDER_DID = f"did:ethr:{HOLDER_ADDR}"

# Load Wallet DB
wallet_db = utils.load_db("holder_wallet.json")
if "credentials" not in wallet_db:
    wallet_db["credentials"] = []

st.title("👤 Holder Wallet (Mahasiswa)")
st.info(f"My DID: `{HOLDER_DID}`")

# MENU TAB
tab1, tab2, tab3 = st.tabs(["📥 Terima Ijazah", "💼 Koleksi Saya", "📤 Share Presentation"])

with tab1:
    st.subheader("Simpan Ijazah Baru")
    vc_input = st.text_area("Tempel (Paste) JSON Ijazah dari Kampus di sini:")
    
    if st.button("Simpan ke Wallet"):
        try:
            vc_json = json.loads(vc_input)
            # Validasi sederhana
            if "proof" in vc_json and "credential" in vc_json:
                wallet_db["credentials"].append(vc_json)
                utils.save_db("holder_wallet.json", wallet_db)
                st.success("Ijazah berhasil disimpan di Wallet!")
            else:
                st.error("Format JSON tidak valid (Harus format VC).")
        except:
            st.error("Error parsing JSON.")

with tab2:
    st.subheader("Koleksi Kredensial")
    if not wallet_db["credentials"]:
        st.write("Belum ada ijazah.")
    else:
        for idx, vc in enumerate(wallet_db["credentials"]):
            with st.expander(f"🎓 Ijazah #{idx+1} - {vc['credential']['credentialSubject']['data']['degree']}"):
                st.json(vc)

with tab3:
    st.subheader("Buat Verifiable Presentation (VP)")
    st.write("Pilih kredensial yang ingin diserahkan ke Bank/Perusahaan:")
    
    selected_indices = []
    for idx, vc in enumerate(wallet_db["credentials"]):
        if st.checkbox(f"Sertakan: {vc['credential']['credentialSubject']['data']['degree']}", key=idx):
            selected_indices.append(vc)
    
    if st.button("Generate Presentation Token"):
        if not selected_indices:
            st.warning("Pilih minimal satu dokumen.")
        else:
            # Membuat VP Payload
            vp_payload = {
                "@context": ["https://www.w3.org/2018/credentials/v1"],
                "type": ["VerifiablePresentation"],
                "verifiableCredential": selected_indices,
                "holder": HOLDER_DID
            }
            
            # Sign VP oleh Mahasiswa (Membuktikan kepemilikan)
            signature = utils.sign_data(vp_payload, HOLDER_PK)
            
            final_vp = {
                "presentation": vp_payload,
                "proof": {
                    "type": "EcdsaSecp256k1Signature2019",
                    "verificationMethod": f"{HOLDER_DID}#controller",
                    "jws": signature
                }
            }
            
            st.success("Token Presentasi Siap!")
            st.json(final_vp)
            st.info("👇 Salin Token JSON ini untuk diserahkan ke Portal Bank")
import streamlit as st
import utils
import datetime
import uuid

# --- KONFIGURASI HALAMAN ---
st.set_page_config(page_title="Issuer Portal", page_icon="🏛️", layout="wide")

# --- IDENTITAS KAMPUS (SIMULASI) ---
# Kita gunakan Akun #1 dari Anvil sebagai Kampus
ISSUER_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
ISSUER_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
ISSUER_DID = f"did:ethr:{ISSUER_ADDRESS}"

# Load Smart Contract via Utils
contract = utils.get_contract()

# --- UI HEADER ---
st.title("🏛️ Portal Akademik (Issuer)")
st.caption(f"Login sebagai: **Universitas Pendidikan Indonesia (Simulasi)**")
st.code(f"Issuer DID: {ISSUER_DID}")

if not contract:
    st.error("❌ Gagal terhubung ke Smart Contract. Pastikan 'utils.py' sudah benar dan 'anvil' berjalan.")
    st.stop()

# --- BAGIAN 1: STATUS REGISTRASI BLOCKCHAIN ---
st.divider()
st.subheader("1. Status Registrasi Blockchain")

col1, col2 = st.columns([3, 1])

# Cek status di Blockchain
try:
    is_active, org_name, _ = contract.functions.resolveDID(ISSUER_ADDRESS).call()
    
    with col1:
        if is_active:
            st.success(f"✅ **TERVERIFIKASI:** DID ini terdaftar resmi sebagai '{org_name}'.")
            st.info("Sistem siap menerbitkan ijazah yang valid.")
        else:
            st.warning("⚠️ **BELUM TERDAFTAR:** DID ini belum ada di Blockchain Registry.")
            st.write("Verifikasi ijazah akan gagal jika Kampus belum mendaftarkan diri.")

    with col2:
        if not is_active:
            if st.button("📝 Daftarkan DID Kampus"):
                with st.spinner("Mencatat identitas ke Blockchain..."):
                    try:
                        # Panggil Smart Contract: registerDID
                        tx = contract.functions.registerDID(
                            ISSUER_DID, 
                            "Universitas Pendidikan Indonesia"
                        ).build_transaction({
                            'from': ISSUER_ADDRESS,
                            'nonce': utils.w3.eth.get_transaction_count(ISSUER_ADDRESS),
                            'gas': 1000000,
                            'gasPrice': utils.w3.to_wei('1', 'gwei')
                        })
                        
                        # Sign & Kirim Transaksi
                        signed_tx = utils.w3.eth.account.sign_transaction(tx, ISSUER_PRIVATE_KEY)
                        tx_hash = utils.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
                        
                        st.success("Berhasil Mendaftar!")
                        st.rerun()
                    except Exception as e:
                        st.error(f"Gagal: {e}")

except Exception as e:
    st.error(f"Error koneksi blockchain: {e}")

# --- BAGIAN 2: PENERBITAN IJAZAH (ISSUANCE) ---
st.divider()
st.subheader("2. Penerbitan Kredensial (Ijazah)")

with st.container():
    st.write("Isi data kelulusan mahasiswa di bawah ini:")
    
    with st.form("issuance_form"):
        c1, c2 = st.columns(2)
        mhs_name = c1.text_input("Nama Lengkap Mahasiswa")
        mhs_nim = c2.text_input("NIM")
        
        c3, c4 = st.columns(2)
        degree = c3.selectbox("Gelar Akademik", ["Sarjana Komputer (S.Kom)", "Sarjana Pendidikan (S.Pd)", "Magister Komputer (M.Kom)"])
        gpa = c4.text_input("IPK (GPA)", value="3.50")
        
        # Target DID (Biasanya didapat dari QR Code mahasiswa, disini kita input manual/copy dari holder app)
        target_did = st.text_input("DID Wallet Mahasiswa (Penerima)", placeholder="did:ethr:0x...")
        
        submit_btn = st.form_submit_button("🔏 Tanda Tangani & Terbitkan")

    if submit_btn:
        if not mhs_name or not target_did:
            st.error("Nama dan DID Mahasiswa wajib diisi!")
        else:
            # A. Susun Data JSON (JSON-LD Schema)
            # Sesuai paper, kita buat struktur Verifiable Credential
            issuance_date = datetime.datetime.now(datetime.timezone.utc).isoformat()
            
            credential_payload = {
                "@context": [
                    "https://www.w3.org/2018/credentials/v1",
                    "https://schema.affinidi.com/UniversityDegreeCredentialV1.jsonld"
                ],
                "id": f"urn:uuid:{str(uuid.uuid4())}",
                "type": ["VerifiableCredential", "UniversityDegreeCredential"],
                "issuer": ISSUER_DID,
                "issuanceDate": issuance_date,
                "credentialSubject": {
                    "id": target_did,
                    "data": {
                        "name": mhs_name,
                        "nim": mhs_nim,
                        "degree": degree,
                        "gpa": gpa,
                        "university": "Universitas Pendidikan Indonesia"
                    }
                }
            }

            # B. Signing Off-Chain (Kriptografi)
            # Kita menggunakan private key kampus untuk menanda-tangani hash dari JSON di atas
            try:
                signature = utils.sign_data(credential_payload, ISSUER_PRIVATE_KEY)
                
                # C. Kemas Hasil Akhir
                final_vc = {
                    "credential": credential_payload,
                    "proof": {
                        "type": "EcdsaSecp256k1Signature2019",
                        "created": issuance_date,
                        "verificationMethod": f"{ISSUER_DID}#controller",
                        "proofPurpose": "assertionMethod",
                        "jws": signature
                    }
                }
                
                st.success("✅ Ijazah Digital Berhasil Diterbitkan!")
                st.write("Salin kode JSON di bawah ini dan kirimkan ke Mahasiswa:")
                st.json(final_vc)
                
            except Exception as e:
                st.error(f"Gagal melakukan signing: {e}")
import streamlit as st
import utils
import json

# --- KONFIGURASI HALAMAN ---
st.set_page_config(page_title="Verifier Portal", page_icon="🏦", layout="wide")

# Load Contract
contract = utils.get_contract()

# --- UI HEADER ---
st.title("🏦 Portal Verifikasi (Bank/HRD)")
st.markdown("""
Aplikasi ini digunakan untuk memverifikasi keaslian dokumen digital (Ijazah) 
tanpa menghubungi Universitas penerbit secara langsung.
""")

if not contract:
    st.error("❌ Gagal terhubung ke Smart Contract. Cek utils.py!")
    st.stop()

st.info(f"🔍 Terhubung ke Registry Blockchain: `{utils.REGISTRY_CONTRACT_ADDRESS}`")

# --- FORM VERIFIKASI ---
st.divider()
col_input, col_result = st.columns([1, 1])

with col_input:
    st.subheader("Input Dokumen")
    st.write("Tempelkan (Paste) JSON 'Verifiable Presentation' atau 'Credential' dari Mahasiswa:")
    json_input = st.text_area("JSON Token", height=400)
    verify_btn = st.button("🔍 Verifikasi Keaslian")

with col_result:
    st.subheader("Hasil Analisis")
    
    if verify_btn and json_input:
        try:
            # Parsing JSON
            token_data = json.loads(json_input)
            
            # Deteksi Tipe Dokumen (VP atau VC langsung)
            # Skenario Holder App menghasilkan VP (Verifiable Presentation)
            if "presentation" in token_data:
                credentials = token_data['presentation']['verifiableCredential']
                holder_did = token_data['presentation']['holder']
                st.caption(f"📦 Tipe: Verifiable Presentation (Milik: {holder_did})")
            elif "credential" in token_data:
                # Fallback jika user copas VC langsung dari Issuer
                credentials = [token_data]
                st.caption("📄 Tipe: Raw Verifiable Credential")
            else:
                st.error("Format JSON tidak dikenali. Harus format VC atau VP.")
                st.stop()

            # --- LOOP VERIFIKASI SETIAP DOKUMEN ---
            all_passed = True
            
            for i, vc_wrapper in enumerate(credentials):
                # Struktur VC dari Holder App bisa dibungkus atau raw, kita normalisasi
                # Di utils.py sign_data membungkus jadi {"credential": ..., "proof": ...}
                if "credential" in vc_wrapper:
                    vc_content = vc_wrapper['credential']
                    vc_proof = vc_wrapper['proof']
                else:
                    # Jika format raw W3C
                    vc_content = vc_wrapper.copy()
                    if "proof" in vc_content:
                        del vc_content["proof"] # Proof harus dipisah saat verify signature
                    vc_proof = vc_wrapper["proof"]

                # Ambil Data Kunci
                issuer_did_claim = vc_content['issuer']
                degree_name = vc_content['credentialSubject']['data'].get('degree', 'Dokumen Tanpa Judul')
                
                with st.expander(f"Dokumen #{i+1}: {degree_name}", expanded=True):
                    
                    # LANGKAH 1: Verify Signature (Off-Chain Math)
                    signature = vc_proof['jws']
                    recovered_signer_addr = utils.verify_signature(vc_content, signature)
                    recovered_did = f"did:ethr:{recovered_signer_addr}"
                    
                    st.write(f"**Issuer Diklaim:** `{issuer_did_claim}`")
                    st.write(f"**Penanda Tangan Asli (Recovered):** `{recovered_did}`")
                    
                    check_1 = (recovered_did == issuer_did_claim)
                    if check_1:
                        st.success("✅ **Integritas:** Signature Valid (Dokumen tidak diedit).")
                    else:
                        st.error("❌ **Integritas:** Signature INVALID! Dokumen korup/palsu.")
                        all_passed = False

                    # LANGKAH 2: Verify Registry (On-Chain Blockchain)
                    # Panggil Smart Contract resolveDID
                    is_active, org_name, _ = contract.functions.resolveDID(recovered_signer_addr).call()
                    
                    if is_active:
                        st.success(f"✅ **Otoritas:** Issuer Terdaftar di Blockchain sebagai **'{org_name}'**.")
                    else:
                        st.error("❌ **Otoritas:** Issuer TIDAK TERDAFTAR di Blockchain Registry.")
                        st.warning("Hati-hati: Penanda tangan mungkin membuat signature sendiri tapi bukan Kampus resmi.")
                        all_passed = False
            
            st.divider()
            if all_passed:
                st.balloons()
                st.success("🎉 KESIMPULAN AKHIR: SEMUA DOKUMEN VALID & SAH.")
            else:
                st.error("🛑 KESIMPULAN AKHIR: DOKUMEN DITOLAK / BERMASALAH.")

        except json.JSONDecodeError:
            st.error("Format JSON Error.")
        except Exception as e:
            st.error(f"Terjadi kesalahan teknis: {str(e)}")
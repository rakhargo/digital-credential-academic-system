// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Academic Identity Ecosystem
 * @notice Mengimplementasikan alur 10 langkah sesuai diagram Sistem Manajemen Identitas
 */
contract AcademicIdentitySystem {
    
    // --- BAGIAN 1: DID REGISTRY (Untuk Langkah 1, 2, 3) ---
    // Sesuai gambar: "Mendaftarkan DID" dan "Membuat DID Document"
    
    struct DIDDocument {
        string didString;       // Contoh: "did:ethr:0x123..."
        string docMetadata;     // Link ke IPFS atau metadata publik (Step 3)
        address controller;     // Pemilik DID (Mahasiswa/Holder)
        uint256 created;
    }

    // Mapping: Address Wallet => Data DID
    mapping(address => DIDDocument) public didRegistry;
    
    event DIDRegistered(address indexed user, string did, uint256 timestamp);

    // Fungsi Langkah 2: Holder mendaftarkan DID mereka sendiri
    function registerDID(string memory _didString, string memory _metadata) external {
        require(didRegistry[msg.sender].created == 0, "DID sudah terdaftar untuk wallet ini");
        
        didRegistry[msg.sender] = DIDDocument({
            didString: _didString,
            docMetadata: _metadata,
            controller: msg.sender,
            created: block.timestamp
        });

        emit DIDRegistered(msg.sender, _didString, block.timestamp);
    }


    // --- BAGIAN 2: ISSUER REGISTRY & VC (Untuk Langkah 4, 5, 6) ---
    // Sesuai gambar: "Audit data", "Penandatanganan", "Pencatatan di Blockchain"

    address public pddiktiAdmin;
    mapping(address => bool) public authorizedIssuers;

    struct CredentialProof {
        bytes32 credentialHash; // Hash dari Signed VC (Step 6)
        address issuer;         // Kampus yang menerbitkan
        address holder;         // Mahasiswa pemilik
        bool isRevoked;         // Status pembatalan
        uint256 issuedAt;
    }

    // Mapping: ID Unik Kredensial => Data Proof
    mapping(bytes32 => CredentialProof) public credentialRegistry;

    event IssuerAuthorized(address indexed issuer);
    event CredentialRecorded(bytes32 indexed vcId, address indexed issuer, address indexed holder);

    modifier onlyPDDikti() {
        require(msg.sender == pddiktiAdmin, "Hanya PDDikti");
        _;
    }

    modifier onlyIssuer() {
        require(authorizedIssuers[msg.sender], "Bukan Issuer Resmi");
        _;
    }

    constructor() {
        pddiktiAdmin = msg.sender; // Deployer jadi Admin Pusat
    }

    function addIssuer(address _issuer) external onlyPDDikti {
        authorizedIssuers[_issuer] = true;
        emit IssuerAuthorized(_issuer);
    }

    // Fungsi Langkah 6: Pencatatan di Blockchain (Issuer | Hash Signatured VC)
    function recordCredentialHash(bytes32 _vcId, bytes32 _hashSignaturedVC, address _holderWallet) external onlyIssuer {
        // Validasi: Pastikan Holder sudah punya DID (Langkah prasyarat)
        require(didRegistry[_holderWallet].created > 0, "Holder belum mendaftarkan DID");

        credentialRegistry[_vcId] = CredentialProof({
            credentialHash: _hashSignaturedVC,
            issuer: msg.sender,
            holder: _holderWallet,
            isRevoked: false,
            issuedAt: block.timestamp
        });

        emit CredentialRecorded(_vcId, msg.sender, _holderWallet);
    }
    
    // Fungsi Langkah 10: Verifikasi Akhir (Verifier | Cek Status)
    function verifyCredentialStatus(bytes32 _vcId) external view returns (bool isValid, address issuer, address holder) {
        CredentialProof memory proof = credentialRegistry[_vcId];
        
        // Cek 1: Apakah ada datanya?
        if (proof.issuedAt == 0) return (false, address(0), address(0));
        
        // Cek 2: Apakah status revoked?
        if (proof.isRevoked) return (false, proof.issuer, proof.holder);

        // Cek 3: Apakah Issuer masih authorized?
        if (!authorizedIssuers[proof.issuer]) return (false, proof.issuer, proof.holder);

        return (true, proof.issuer, proof.holder);
    }
}
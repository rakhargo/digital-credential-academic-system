// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AcademicCredential {
    // --- STATE VARIABLES ---
    
    // 1. Identitas PDDikti sebagai 'Root of Trust'
    address public pddiktiAdmin;

    // 2. Daftar Kampus Resmi (Whitelist)
    // Mapping: Alamat Wallet Kampus => Status Aktif/Tidak
    mapping(address => bool) public authorizedIssuers;

    // 3. Struktur Data Ijazah (Credential)
    struct Credential {
        bytes32 contentHash;  // Hash dari file ijazah/JSON
        address issuer;       // Kampus penerbit
        uint256 timestamp;    // Waktu terbit
        bool isValid;         // Status validitas (bisa dicabut/revoke)
    }

    // Mapping: ID Ijazah (bisa hash unik) => Data Credential
    mapping(bytes32 => Credential) public credentials;

    // --- EVENTS (Untuk Transparansi/Audit Trail) ---
    event IssuerAdded(address indexed issuer, string name);
    event IssuerRemoved(address indexed issuer);
    event CredentialIssued(bytes32 indexed credentialId, address indexed issuer);

    // --- MODIFIERS (Satpam Gerbang) ---
    
    modifier onlyPDDikti() {
        require(msg.sender == pddiktiAdmin, "Akses Ditolak: Bukan PDDikti");
        _;
    }

    modifier onlyAuthorizedIssuer() {
        require(authorizedIssuers[msg.sender], "Akses Ditolak: Kampus Ilegal/Tidak Terdaftar");
        _;
    }

    // --- CONSTRUCTOR ---
    constructor() {
        // Saat deploy, akun pen-deploy dianggap sebagai PDDikti
        pddiktiAdmin = msg.sender;
    }

    // --- FUNGSI MANAJEMEN ISSUER (Oleh PDDikti) ---
    
    // Fungsi ini mencegah Kampus 'nakal' bikin ijazah sendiri tanpa izin pusat
    function addIssuer(address _campusAddress, string memory _campusName) external onlyPDDikti {
        authorizedIssuers[_campusAddress] = true;
        emit IssuerAdded(_campusAddress, _campusName);
    }

    function removeIssuer(address _campusAddress) external onlyPDDikti {
        authorizedIssuers[_campusAddress] = false;
        emit IssuerRemoved(_campusAddress);
    }

    // --- FUNGSI PENERBITAN IJAZAH (Oleh Kampus) ---
    
    // Hanya bisa dipanggil jika kampus sudah di-whitelist oleh PDDikti
    function issueCredential(bytes32 _credentialId, bytes32 _contentHash) external onlyAuthorizedIssuer {
        // Cek apakah ID ini sudah pernah dipakai
        require(credentials[_credentialId].timestamp == 0, "Credential ID sudah ada");

        credentials[_credentialId] = Credential({
            contentHash: _contentHash,
            issuer: msg.sender,
            timestamp: block.timestamp,
            isValid: true
        });

        emit CredentialIssued(_credentialId, msg.sender);
    }
}
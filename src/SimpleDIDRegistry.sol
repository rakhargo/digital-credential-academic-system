// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Simple DID Registry (Hybrid Version)
 * @notice Versi ini menyimpan Nama Kampus (Metadata) agar bisa ditampilkan di UI
 */
contract SimpleDIDRegistry {
    
    struct DIDDocument {
        string didURI;       // Contoh: "did:ethr:0x123..."
        address controller;  // Wallet pemilik
        string metadata;     // Disimpan sebagai Nama (misal: "Universitas UPI")
        bool active;
        uint256 registeredAt;
    }

    // Mapping: Address Wallet => Dokumen Identitas
    mapping(address => DIDDocument) public dids;

    event DIDRegistered(address indexed owner, string didURI, string name);

    // [Fungsi 1] Pendaftaran (Dipanggil oleh Issuer App)
    // Parameter ke-2 diubah jadi 'string memory _name' agar cocok dengan Python
    function registerDID(string memory _didURI, string memory _name) external {
        dids[msg.sender] = DIDDocument({
            didURI: _didURI,
            controller: msg.sender,
            metadata: _name, // Simpan nama kampus
            active: true,
            registeredAt: block.timestamp
        });
        
        emit DIDRegistered(msg.sender, _didURI, _name);
    }

    // [Fungsi 2] Resolusi (Dipanggil oleh Verifier App & Issuer App)
    // Fungsi ini yang HILANG tadi. Gunanya untuk cek status & ambil nama.
    function resolveDID(address _issuer) external view returns (bool isActive, string memory name, string memory didURI) {
        DIDDocument memory doc = dids[_issuer];
        return (doc.active, doc.metadata, doc.didURI);
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleDIDRegistry {
    
    struct DIDDocument {
        string didURI;
        address controller;
        string metadata;     
        bool active;
        bool isVerified;     
        uint256 registeredAt;
    }

    // Status untuk setiap Ijazah (Hash)
    struct CredentialStatus {
        address issuer;
        uint256 issuedAt;
        bool isRevoked;
        bool exists;
    }

    address public admin;
    mapping(address => DIDDocument) public dids;
    mapping(bytes32 => CredentialStatus) public credentials;

    event DIDRegistered(address indexed owner, string name);
    event CredentialAnchored(bytes32 indexed vcHash, address indexed issuer);
    event CredentialRevoked(bytes32 indexed vcHash, string reason);

    modifier onlyVerifiedIssuer() {
        require(dids[msg.sender].isVerified, "Hanya Kampus Terverifikasi (Centang Biru) yg boleh!");
        _;
    }

    constructor() {
        admin = msg.sender; // Deployer jadi Admin
    }

    // 1. DAFTAR DID
    function registerDID(string memory _didURI, string memory _name) external {
        dids[msg.sender] = DIDDocument({
            didURI: _didURI,
            controller: msg.sender,
            metadata: _name,
            active: true,
            isVerified: false, // Default Unverified
            registeredAt: block.timestamp
        });
        emit DIDRegistered(msg.sender, _name);
    }

    // 2. VERIFIKASI KAMPUS (Admin Only)
    function verifyIssuer(address _issuer) external {
        require(msg.sender == admin, "Bukan Admin");
        dids[_issuer].isVerified = true;
    }

    // 3. CATAT IJAZAH (Anchoring)
    function issueCredential(bytes32 _vcHash) external onlyVerifiedIssuer {
        require(!credentials[_vcHash].exists, "Hash ini sudah ada!");
        credentials[_vcHash] = CredentialStatus({
            issuer: msg.sender,
            issuedAt: block.timestamp,
            isRevoked: false,
            exists: true
        });
        emit CredentialAnchored(_vcHash, msg.sender);
    }

    // 4. CABUT IJAZAH (Revocation)
    function revokeCredential(bytes32 _vcHash, string memory _reason) external {
        require(credentials[_vcHash].issuer == msg.sender, "Bukan penerbit asli!");
        credentials[_vcHash].isRevoked = true;
        emit CredentialRevoked(_vcHash, _reason);
    }

    // 5. CEK STATUS (View)
    function resolveDID(address _issuer) external view returns (bool, bool, string memory, string memory) {
        DIDDocument memory doc = dids[_issuer];
        return (doc.active, doc.isVerified, doc.metadata, doc.didURI);
    }

    function verifyCredentialStatus(bytes32 _vcHash) external view returns (bool exists, bool isRevoked, address issuer) {
        CredentialStatus memory c = credentials[_vcHash];
        return (c.exists, c.isRevoked, c.issuer);
    }
}
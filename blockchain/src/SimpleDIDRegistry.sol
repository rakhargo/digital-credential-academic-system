// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleDIDRegistry {
    
    struct DIDDocument {
        string didURI;
        address controller;
        string metadata;
        string serviceEndpoint;     
        bool active;
        bool isVerified;     
        uint256 registeredAt;
    }

    struct CredentialStatus {
        address issuer;
        uint256 issuedAt;
        bool isRevoked;
        bool exists;
        bool isValidated;
    }

    address public kemendikbud; // kemendikbud
    address public pddikti;

    mapping(address => DIDDocument) public dids;
    mapping(bytes32 => CredentialStatus) public credentials;

    event DIDRegistered(address indexed owner, string name);
    event IssuerVerified(address indexed issuer);
    event CredentialAnchored(bytes32 indexed vcHash, address indexed issuer);
    event CredentialValidated(bytes32 indexed vcHash);
    event CredentialRevoked(bytes32 indexed vcHash, string reason);

    modifier onlyKemendikbud() {
        require(msg.sender == kemendikbud, "Hanya Kemendikbud!");
        _;
    }

    modifier onlyPDDikti() {
        require(msg.sender == pddikti, "Hanya PDDikti!");
        _;
    }

    modifier onlyVerifiedIssuer() {
        require(dids[msg.sender].isVerified, "Hanya Kampus Terverifikasi yang boleh!");
        _;
    }

    constructor() {
        kemendikbud = msg.sender; // Deployer jadi Admin
    }

    function setPDDiktiAddress(address _pddiktiAddress) external onlyKemendikbud {
        pddikti = _pddiktiAddress;
    }


    // 1. DAFTAR DID
    function registerDID(string memory _didURI, string memory _name, string memory _endpoint) external {
        dids[msg.sender] = DIDDocument({
            didURI: _didURI,
            controller: msg.sender,
            metadata: _name,
            serviceEndpoint: _endpoint,
            active: true,
            isVerified: false,
            registeredAt: block.timestamp
        });
        emit DIDRegistered(msg.sender, _name);
    }

    // 2. Akreditasi Kampus (Memberi Centang Biru)
    function verifyIssuer(address _issuer) external onlyKemendikbud {
        dids[_issuer].isVerified = true;
        emit IssuerVerified(_issuer);
    }
    
    // 3. CATAT IJAZAH (Anchoring)
    function issueCredential(bytes32 _vcHash) external onlyVerifiedIssuer {
        require(!credentials[_vcHash].exists, "Hash ini sudah ada!");
        credentials[_vcHash] = CredentialStatus({
            issuer: msg.sender,
            issuedAt: block.timestamp,
            isRevoked: false,
            exists: true,
            isValidated: false
        });
        emit CredentialAnchored(_vcHash, msg.sender);
    }

    function validateCredential(bytes32 _vcHash) external onlyPDDikti {
        require(credentials[_vcHash].exists, "Ijazah tidak ditemukan");
        require(!credentials[_vcHash].isRevoked , "Ijazah sudah dicabut kampus");
        
        credentials[_vcHash].isValidated = true;
        emit CredentialValidated(_vcHash);
    }

    // 4. CABUT IJAZAH (Revocation)
    function revokeCredential(bytes32 _vcHash, string memory _reason) external {
        require(credentials[_vcHash].issuer == msg.sender, "Bukan penerbit asli!");
        credentials[_vcHash].isRevoked = true;
        emit CredentialRevoked(_vcHash, _reason);
    }

    // 5. CEK STATUS (View)
    function resolveDID(address _issuer) external view returns (bool, bool, string memory, string memory, string memory) {
        DIDDocument memory doc = dids[_issuer];
        return (doc.active, doc.isVerified, doc.metadata, doc.didURI, doc.serviceEndpoint);
    }

    function verifyCredentialStatus(bytes32 _vcHash) external view returns (
        bool exists, 
        bool isRevoked, 
        bool isValidated,
        address issuer
    ) {
        CredentialStatus memory c = credentials[_vcHash];
        return (c.exists, c.isRevoked, c.isValidated, c.issuer);
    }
}
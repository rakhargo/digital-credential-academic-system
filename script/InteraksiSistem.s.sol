// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {AcademicCredential} from "../src/AcademicCredential.sol";

contract InteraksiSistem is Script {
    // Kita pakai Private Key bawaan Anvil (Default)
    // PK 0: 0xac09... (Kita anggap Admin/PDDikti)
    uint256 adminPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    
    // PK 1: 0x59c6... (Kita anggap Kampus UPI)
    uint256 kampusPrivateKey = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;
    
    // Alamat wallet dari PK di atas (untuk verifikasi di log)
    address kampusAddress = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;

    function run() public {
        // --- STEP 1: DEPLOY CONTRACT (Oleh Admin) ---
        console.log("--- MULAI DEPLOYMENT ---");
        
        // Mulai sesi sebagai Admin
        vm.startBroadcast(adminPrivateKey);
        
        AcademicCredential credentialSystem = new AcademicCredential();
        console.log("Contract dideploy di alamat:", address(credentialSystem));
        console.log("Admin PDDikti adalah:", credentialSystem.pddiktiAdmin());

        // --- STEP 2: WHITELIST KAMPUS (Oleh Admin) ---
        console.log("\n--- MENDAFTARKAN KAMPUS ---");
        
        credentialSystem.addIssuer(kampusAddress, "Universitas Pendidikan Indonesia");
        console.log("Kampus UPI berhasil didaftarkan (Whitelist)");
        
        // Admin selesai tugas
        vm.stopBroadcast();


        // --- STEP 3: MENERBITKAN IJAZAH (Oleh Kampus) ---
        console.log("\n--- PENERBITAN IJAZAH ---");
        
        // Pura-puranya ini data JSON Mahasiswa yang sudah di-Hash
        // (Nanti ini tugas Python backend, di sini kita simulasi saja)
        bytes32 idIjazah = keccak256(abi.encodePacked("IJAZAH-UPI-2025-001"));
        bytes32 hashDataMahasiswa = keccak256(abi.encodePacked("Rakha Dhifiargo | 2209489 | S1 Ilmu Komputer"));
        
        console.log("Mencoba menerbitkan ijazah untuk ID:", vm.toString(idIjazah));
        
        // Mulai sesi sebagai Kampus
        vm.startBroadcast(kampusPrivateKey);

        credentialSystem.issueCredential(idIjazah, hashDataMahasiswa);
        
        console.log("Sukses! Ijazah telah tercatat di Blockchain.");
        
        vm.stopBroadcast();


        // --- STEP 4: VERIFIKASI DATA (Read Only) ---
        console.log("\n--- CEK DATA DI BLOCKCHAIN ---");
        
        (bytes32 contentHash, address issuer, uint256 timestamp, bool isValid) = credentialSystem.credentials(idIjazah);
        
        console.log("Issuer Terdaftar:", issuer);
        console.log("Status Valid:", isValid);
        console.log("Timestamp:", timestamp);
        
        if (issuer == kampusAddress && isValid) {
            console.log("KESIMPULAN: Ijazah VALID dan diterbitkan oleh Kampus Resmi.");
        } else {
            console.log("KESIMPULAN: Ijazah PALSU.");
        }
    }
}
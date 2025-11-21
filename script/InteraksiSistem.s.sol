// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {AcademicIdentitySystem} from "../src/AcademicIdentitySystem.sol";

contract InteraksiSistem is Script {
    // Aktor Sesuai Diagram
    uint256 pddiktiKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80; // Admin
    uint256 kampusKey = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;  // Issuer
    uint256 mhsKey = 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a;     // Holder (Rakha)

    address kampusAddr = vm.addr(kampusKey);
    address mhsAddr = vm.addr(mhsKey);

    function run() public {
        // 1. DEPLOY SYSTEM (PDDIKTI)
        vm.startBroadcast(pddiktiKey);
        AcademicIdentitySystem system = new AcademicIdentitySystem();
        system.addIssuer(kampusAddr); // Whitelist Kampus
        vm.stopBroadcast();

        // --- ALUR DIMULAI (SESUAI GAMBAR) ---

        // LANGKAH 1: Mahasiswa sudah punya Wallet (mhsKey)
        
        // LANGKAH 2 & 3: Mahasiswa Mendaftarkan DID & Metadata
        vm.startBroadcast(mhsKey);
        console.log("--- [Langkah 2] Register DID oleh Mahasiswa ---");
        system.registerDID("did:ethr:rakha2025", "ipfs://metadata-rakha");
        vm.stopBroadcast();

        // LANGKAH 4 & 5: (Simulasi Off-chain) Kampus membuat & tanda tangan VC
        bytes32 vcID = keccak256("IJAZAH-001");
        bytes32 signedVcHash = keccak256("Isi Ijazah yang sudah ditandatangani Kampus");

        // LANGKAH 6: Pencatatan di Blockchain oleh Issuer
        vm.startBroadcast(kampusKey);
        console.log("--- [Langkah 6] Pencatatan Hash VC oleh Kampus ---");
        system.recordCredentialHash(vcID, signedVcHash, mhsAddr);
        vm.stopBroadcast();

        // LANGKAH 10: Verifikasi oleh Perusahaan (Verifier)
        console.log("--- [Langkah 10] Verifikasi Akhir ---");
        (bool isValid, address issuer, address holder) = system.verifyCredentialStatus(vcID);
        
        if(isValid && holder == mhsAddr) {
            console.log("HASIL: Ijazah Valid, DID Holder Cocok!");
        } else {
            console.log("HASIL: Ijazah Palsu!");
        }
    }
}
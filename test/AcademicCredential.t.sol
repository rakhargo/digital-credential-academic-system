// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {AcademicCredential} from "../src/AcademicCredential.sol";

contract AcademicCredentialTest is Test {
    AcademicCredential public credentialSystem;

    // Kita siapkan 3 aktor
    address pddiktiAdmin = address(0x1); // Akun 1
    address kampusResmi = address(0x2);  // Akun 2
    address hacker = address(0x3);       // Akun 3

    function setUp() public {
        // 1. Kita bertindak seolah-olah kita adalah PDDikti saat deploy
        vm.prank(pddiktiAdmin); 
        credentialSystem = new AcademicCredential();
    }

    // SKENARIO 1: Proses Normal (Happy Path)
    function test_PenerbitanIjazahResmi() public {
        // A. PDDikti mendaftarkan Kampus Resmi
        vm.prank(pddiktiAdmin);
        credentialSystem.addIssuer(kampusResmi, "Universitas Teknologi Blockchain");

        // B. Kampus Resmi menerbitkan Ijazah
        vm.startPrank(kampusResmi);
        
        bytes32 idIjazah = keccak256("IJAZAH-001");
        bytes32 hashData = keccak256("Data Lengkap Mahasiswa");
        
        credentialSystem.issueCredential(idIjazah, hashData);
        
        vm.stopPrank();

        // C. Verifikasi bahwa data masuk
        // Kita ambil data dari struct (karena return struct agak kompleks di solidity lama, kita akses mapping)
        (bytes32 contentHash, address issuer, uint256 timestamp, bool isValid) = credentialSystem.credentials(idIjazah);
        
        assertEq(isValid, true); // Ijazah harus valid
        assertEq(issuer, kampusResmi); // Penerbit harus Kampus Resmi
        
        console.log("Sukses: Ijazah berhasil diterbitkan oleh Kampus Resmi");
    }

    // SKENARIO 2: Keamanan (Security Path)
    function test_GagalJikaBukanKampus() public {
        // Hacker mencoba menerbitkan ijazah TANPA didaftarkan PDDikti
        vm.prank(hacker);
        
        bytes32 idIjazahPalsu = keccak256("IJAZAH-PALSU-001");
        bytes32 hashDataPalsu = keccak256("Data Palsu");

        // Kita berekspektasi transaksi ini AKAN GAGAL dengan pesan error tertentu
        vm.expectRevert("Akses Ditolak: Kampus Ilegal/Tidak Terdaftar");
        
        credentialSystem.issueCredential(idIjazahPalsu, hashDataPalsu);
        
        console.log("Sukses: Hacker gagal menerbitkan ijazah (Sistem Aman)");
    }

    // SKENARIO 3: PDDikti Cabut Izin Kampus
    function test_CabutIzinKampus() public {
        // A. Daftar dulu
        vm.prank(pddiktiAdmin);
        credentialSystem.addIssuer(kampusResmi, "Universitas Bermasalah");

        // B. Cabut izin
        vm.prank(pddiktiAdmin);
        credentialSystem.removeIssuer(kampusResmi);

        // C. Kampus mencoba menerbitkan lagi -> Harus Gagal
        vm.prank(kampusResmi);
        vm.expectRevert("Akses Ditolak: Kampus Ilegal/Tidak Terdaftar");
        credentialSystem.issueCredential(keccak256("FAIL"), keccak256("DATA"));
    }
}
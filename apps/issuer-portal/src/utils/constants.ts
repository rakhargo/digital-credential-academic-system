import {
  Shield,
  User,
  FileCheck,
  Wallet,
  Database,
  CheckCircle,
  XCircle,
  QrCode,
  Copy,
  ExternalLink,
  Lock,
  Search,
  School,
  Building2,
  RefreshCw,
  ChevronRight
} from 'lucide-react';

export const ICONS = {
  Shield, User, FileCheck, Wallet, Database, CheckCircle, XCircle, QrCode,
  Copy, ExternalLink, Lock, Search, School, Building2, RefreshCw, ChevronRight
};

export const ROLES = [
  { id: 'issuer', label: 'Issuer (Kampus)', icon: School },
  { id: 'holder', label: 'Holder (Alumni)', icon: Wallet },
  { id: 'verifier', label: 'Verifier (HRD)', icon: FileCheck },
];

export const INITIAL_BLOCKCHAIN = [
  {
    blockId: 1024,
    txHash: "0x8a7f...9b2c",
    vcHash: "0x123456789abc",
    did: "did:ethr:issuer:univ_indonesia",
    timestamp: "2024-01-15 10:00:00",
    status: "Active"
  }
];

export const generateHash = (data: any): string => {
  return "0x" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export interface BlockData {
  blockId: number;
  txHash: string;
  vcHash: string;
  did: string;
  timestamp: string;
  status: string;
}

export interface Credential {
  id: string;
  degree: string;
  issuer: string;
  issuanceDate: string;
  credentialSubject: any;
  hash: string;
  proof: {
    signature: string;
  };
}

export interface FormData {
  name: string;
  nim: string;
  program: string;
  gpa: string;
  graduationDate: string;
  address: string;
}
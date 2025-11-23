# Hybrid SSI Academic Credential System

A decentralized academic credential verification system based on **Self-Sovereign Identity (SSI)** principles. This project utilizes **Ethereum (Foundry)** for the DID Registry and **Python (Streamlit)** for the application logic (Issuer, Holder, Verifier).

## Project Structure

- **contracts/**: Solidity smart contracts (DID Registry).
- **issuer_app.py**: Portal for universities to register DIDs and issue credentials.
- **holder_app.py**: Digital wallet for students to store VCs and generate VPs.
- **verifier_app.py**: Portal for employers/banks to verify credentials.
- **explorer_app.py**: Custom local blockchain explorer.
- **utils.py**: Shared Web3 logic and cryptographic functions.

## Prerequisites

- [Python 3.12+](https://www.python.org/)
- [Foundry](https://getfoundry.sh/) (for Anvil and Forge)

## Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/yourusername/hybrid-ssi-system.git](https://github.com/yourusername/hybrid-ssi-system.git)
    cd hybrid-ssi-system
    ```

2.  **Install Python Dependencies**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Compile Smart Contracts**
    ```bash
    forge build
    ```

## Setup & Deployment

1.  **Start Local Blockchain (Anvil)**
    Open a terminal and run:
    ```bash
    anvil
    ```

2.  **Deploy Registry Contract**
    Open a new terminal and deploy the contract:
    ```bash
    forge create src/SimpleDIDRegistry.sol:SimpleDIDRegistry \
      --rpc-url [http://127.0.0.1:8545](http://127.0.0.1:8545) \
      --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
    ```

3.  **Update Configuration**
    Copy the `Deployed to: 0x...` address from the output above and paste it into `utils.py`:
    ```python
    REGISTRY_CONTRACT_ADDRESS = "0xYOUR_CONTRACT_ADDRESS"
    ```

## Running the Applications

Run each command in a separate terminal:

**1. Issuer Portal (University)**
```bash
streamlit run issuer_app.py --server.port 8501
```

**2. Holder Wallet (Student)**
```bash
streamlit run holder_app.py --server.port 8502
```

**3. Verifier Portal (HR)**
```bash
streamlit run verifier_app.py --server.port 8503
```

**4. Block Explorer**
```bash
streamlit run explorer_app.py --server.port 8504
```

## Usage Flow
1.  **Issuer App:** Register the University DID on-chain, fill in student data, issue a credential, and copy the resulting JSON.
1.  **Holder App:** Paste the JSON to save it. Go to "Share Presentation", select the credential, and generate a VP Token.
1.  **Verifier App:** Paste the VP Token to verify the signature integrity and check the Issuer's status on the blockchain.
1.  **Explorer App** Monitor transactions in real-time.
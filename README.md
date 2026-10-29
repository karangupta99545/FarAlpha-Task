# Simple Backend API with Automated GitHub Actions Deployment

A lightweight Node.js/Express REST API configured to run on **Port 80**, featuring a fully automated CI/CD pipeline using **GitHub Actions** for zero-touch deployment to an Azure Virtual Machine.

---

## 📋 Table of Contents
1. [Objective & Overview](#-objective--overview)
2. [Compliance with Challenge Constraints](#-compliance-with-challenge-constraints)
3. [API Specification](#-api-specification)
4. [CI/CD Deployment Architecture](#-cicd-deployment-architecture)
5. [Local Development & Testing](#-local-development--testing)
6. [GitHub Repository & Secrets Configuration](#-github-repository--secrets-configuration)
7. [Remote Verification & Testing](#-remote-verification--testing)
8. [Challenges Encountered & How They Were Overcome](#-challenges-encountered--how-they-were-overcome)

---

## 🎯 Objective & Overview

This project satisfies the technical challenge:
* **Backend API**: Implemented in **Node.js** (Express framework) exposing a single route: `GET /sayHello`.
* **Port**: Listens directly on **Port 80**.
* **Automated CI/CD**: Utilizes **GitHub Actions** to test, transfer, configure, and run the service on an Azure Linux VM (`74.235.184.25`) upon every push to `main`.
* **Zero Manual Intervention**: Deployment is 100% automated via pipeline.

---

## ✅ Compliance with Challenge Constraints

| Constraint / Rule | Compliance Status | Implementation Detail |
| :--- | :---: | :--- |
| **Port 80 Configuration** | ✅ Passed | Service listens on `process.env.PORT \|\| 80`. Node.js granted `cap_net_bind_service=+ep` capability to bind without root. |
| **Single Route `/sayHello`** | ✅ Passed | Returns HTTP 200 with JSON payload `{"message": "Hello User."}`. |
| **Private Repository** | ✅ Passed | Repository created in Private mode on GitHub. |
| **No Secrets in Repo** | ✅ Passed | All sensitive credentials (IP, user, SSH private key) reside solely in GitHub Actions encrypted secrets. |
| **No Secrets on VM** | ✅ Passed | The application requires no credentials, tokens, or `.env` files to operate on the VM. |
| **NO `git pull` on VM** | ✅ Passed | Code is directly packaged and transferred via SCP from the GitHub Actions runner. |
| **NO Manual Code on VM** | ✅ Passed | Pipeline provisions directories, copies artifacts, installs dependencies, and manages the daemon automatically. |

---

## 🔌 API Specification

### Endpoint: `GET /sayHello`
* **Method**: `GET`
* **Path**: `/sayHello`
* **Status Code**: `200 OK`
* **Response Headers**: `Content-Type: application/json`
* **Response Body**:
```json
{
  "message": "Hello User."
}
```

### Health Check Endpoint: `GET /`
* **Method**: `GET`
* **Path**: `/`
* **Status Code**: `200 OK`
* **Response Body**:
```json
{
  "status": "online",
  "endpoint": "/sayHello"
}
```

---

## 🚀 CI/CD Deployment Architecture

The workflow (`.github/workflows/deploy.yml`) is split into two automated stages:

```
[ Developer Push ]
        │
        ▼
[ GitHub Actions Runner ]
  ├── 1. Run Unit Tests (node:test)
  ├── 2. Connect via SSH & prepare /home/azureuser/app
  └── 3. Transfer server.js & package.json via SCP (Direct push - NO git pull)
        │
        ▼
[ Azure Virtual Machine: 74.235.184.25 ]
  ├── 4. Ensure Node.js & PM2 installed
  ├── 5. Set Linux capability: cap_net_bind_service=+ep on node binary
  ├── 6. Install production dependencies (npm install --omit=dev)
  ├── 7. Start / Zero-downtime Reload via PM2 on Port 80
  └── 8. Perform post-deployment smoke test (curl localhost:80/sayHello)
```

---

## 💻 Local Development & Testing

### 1. Prerequisites
* Node.js v18.0.0 or higher
* npm

### 2. Installation
```bash
npm install
```

### 3. Run Unit Tests
Uses Node's built-in test runner (`node:test`):
```bash
npm test
```

### 4. Run Locally
```bash
# Note: On local machines, running on port 80 might require administrator/root privileges
PORT=3000 npm start
# or on default port 80:
sudo npm start
```

---

## 🔐 GitHub Repository & Secrets Configuration

### Required GitHub Secrets
Under your Private GitHub repository: **Settings → Secrets and variables → Actions → Repository secrets**, configure the following:

| Secret Name | Value Description | Example |
| :--- | :--- | :--- |
| `VM_HOST` | Target VM public IP | `74.235.184.25` |
| `VM_USERNAME` | SSH username | `azureuser` |
| `VM_SSH_KEY` | Entire PEM/OpenSSH private key content | `-----BEGIN OPENSSH PRIVATE KEY----- ...` |

> **Note**: Ensure the SSH key secret includes the header `-----BEGIN ...-----` and footer `-----END ...-----` with matching line breaks.

---

## 🧪 Remote Verification & Testing

Once the GitHub Actions workflow finishes successfully, verify the deployment using `curl` or a web browser:

```bash
# Test the required route
curl -i http://74.235.184.25/sayHello

# Expected Output:
# HTTP/1.1 200 OK
# Content-Type: application/json; charset=utf-8
# {"message":"Hello User."}
```

You can also test the root health endpoint:
```bash
curl -i http://74.235.184.25/
```

---

## 💡 Challenges Encountered & How They Were Overcome

### 1. Binding to Privileged Port 80 without Running as Root
* **Challenge**: Under standard Linux kernel security restrictions, non-root users (`azureuser`) cannot bind sockets to ports below 1024. Running the Node.js application directly as `root` is a security anti-pattern.
* **Solution**: Rather than running the entire application under the root account, we utilized the Linux capability `cap_net_bind_service=+ep` directly on the Node binary (`sudo setcap 'cap_net_bind_service=+ep' $(readlink -f $(which node))`). This securely allows the Node runtime to bind to port 80 while maintaining standard user privileges.

### 2. Strict Prohibition of `git pull` on the Target VM
* **Challenge**: The deployment constraint specifically forbade using `git pull` or storing git credentials/secrets on the VM.
* **Solution**: Implemented an artifact-push deployment model. The GitHub Actions runner checks out the repository, runs test validations, and uses secure SCP (`appleboy/scp-action`) to push only the necessary application source files directly into `/home/azureuser/app`. No git repository, git credentials, or access tokens ever touch the VM.

### 3. Persistent Execution and Zero-Downtime Reloads
* **Challenge**: Executing a background node command over standard SSH sessions usually terminates the process when the SSH session closes.
* **Solution**: Integrated **PM2** process manager within the deployment pipeline. PM2 runs the application in the background, automatically captures logs, ensures service restart on unexpected crashes, and performs seamless reloads upon subsequent pushes.

### 4. Zero Secrets Stored on the VM
* **Challenge**: Ensuring no sensitive environment variables or keys are leaked or stored on the VM filesystem.
* **Solution**: The application is designed to be completely stateless and configuration-free on the VM side. All pipeline authentications happen strictly in-memory during the ephemeral GitHub Actions execution using GitHub Actions encrypted secrets.

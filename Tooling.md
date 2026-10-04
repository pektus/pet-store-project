# Gitea & Jenkins Integration Guide: Tooling & Authentication

This document guides you through creating, configuring, and testing the SSH keys and access tokens required for your Jenkins Docker agent to pull/push code from **Gitea** and upload builds to the **Gitea Maven Package Registry**.

---

## 📋 Architecture Overview

Based on your [`Jenkinsfile`](./Jenkinsfile), the pipeline interacts with Gitea using two distinct authentication mechanisms:

| Credential Type | Jenkins Credential ID | Purpose | Destination in Gitea |
| :--- | :--- | :--- | :--- |
| **SSH Private Key** | `gitea-ssh-key` | Pulling code & pushing tags/version updates | User Profile > **SSH Keys** |
| **Personal Access Token** | `gitea-token` | Uploading Maven artifacts to Gitea Registry | User Profile > **Applications** |

---

## 🔑 Part 1: Generating the SSH Key Pair

### Where should you create it?
You should generate the key pair on your **local machine** (your Windows 11 PC using PowerShell) or any terminal with `ssh-keygen`. 

> [!NOTE]
> You **do not** need to store this key file on the Jenkins agent container disk. Once added to the **Jenkins Credentials Store**, Jenkins automatically injects it into memory inside the container only when the pipeline step runs (via `sshagent(['gitea-ssh-key'])`).

### Step-by-Step Generation:

1. Open **PowerShell** or **Windows Terminal** on your computer.
2. Run the following command to generate a modern, secure **ED25519** key pair without a passphrase (required for headless CI/CD automation):

```powershell
ssh-keygen -t ed25519 -C "jenkins-agent@ci" -f "$HOME\.ssh\id_ed25519_jenkins_gitea" -N '""'
```

*(If you prefer an RSA 4096-bit key instead, run:)*
```powershell
ssh-keygen -t rsa -b 4096 -C "jenkins-agent@ci" -f "$HOME\.ssh\id_rsa_jenkins_gitea" -N '""'
```

3. This creates **two files** in your `C:\Users\<YourUser>\.ssh\` folder:
   - `id_ed25519_jenkins_gitea` (Private key — **Keep this secret!** Goes into Jenkins)
   - `id_ed25519_jenkins_gitea.pub` (Public key — Goes into Gitea)

---

## 🌐 Part 2: Add the Public Key to Gitea

1. Open your browser and go to your Gitea server: `http://192.168.1.233`
2. Log in with your account (`adrian`).
3. Click your profile avatar in the top right corner > **Settings**.
4. In the left navigation, click **SSH / GPG Keys**.
5. Click the blue **Add Key** button:
   - **Key Name:** `Jenkins Docker Agent`
   - **Key Content:** Open `C:\Users\<YourUser>\.ssh\id_ed25519_jenkins_gitea.pub` in Notepad, copy the entire line, and paste it here.
6. Click **Add Key**.

---

## 🔒 Part 3: Add the Private Key to Jenkins Credentials

Your pipeline expects a credential with the ID **`gitea-ssh-key`**.

1. Open your Jenkins Dashboard (`http://localhost:8080` or your Jenkins URL).
2. Go to **Manage Jenkins** > **Credentials** > **System** > **Global credentials (unrestricted)**.
3. Click **Add Credentials** in the top right:
   - **Kind:** Select **SSH Username with private key**
   - **ID:** `gitea-ssh-key` *(Must match `SSH_CREDENTIAL_ID` in your Jenkinsfile)*
   - **Description:** `Gitea SSH Key for pet-store-project CI`
   - **Username:** `git` *(Always `git` for Gitea SSH)*
   - **Private Key:** Select **Enter directly**, click **Add**, and paste the full content of your private key file (`C:\Users\<YourUser>\.ssh\id_ed25519_jenkins_gitea`).
     - Include the header and footer lines:
       ```text
       -----BEGIN OPENSSH PRIVATE KEY-----
       ...
       -----END OPENSSH PRIVATE KEY-----
       ```
   - **Passphrase:** Leave completely empty.
4. Click **Create**.

---

## 📦 Part 4: Create Gitea Personal Access Token (for Maven Package Registry)

Your pipeline uses this token to authenticate against `http://192.168.1.233/api/packages/DevHome/maven`.

### Step 1: Generate Token in Gitea
1. In Gitea (`http://192.168.1.233`), go to **Settings** > **Applications**.
2. Under **Manage Access Tokens**, enter:
   - **Token Name:** `jenkins-maven-package-token`
   - **Select Permissions:**
     - `repo` (Read and Write) — To update repository tags/commits
     - `package` (Read and Write) — To upload Maven artifacts to `DevHome` package registry
3. Click **Generate Token**.
4. **Copy the generated token immediately** (it will not be shown again).

### Step 2: Add Token to Jenkins Credentials
1. In Jenkins, go to **Manage Jenkins** > **Credentials** > **System** > **Global credentials** > **Add Credentials**.
2. Fill in:
   - **Kind:** Select **Secret text**
   - **ID:** `gitea-token` *(Must match `GITEA_TOKEN_CREDENTIAL_ID` in your Jenkinsfile)*
   - **Secret:** Paste your Gitea Personal Access Token.
   - **Description:** `Gitea Access Token for DevHome Package Registry`
3. Click **Create**.

---

## ⚡ Part 5: Handling Gitea SSH Port 2222 and Host Key Prompts

Notice in your `Jenkinsfile`:
```groovy
GITEA_HOST     = '192.168.1.233'
GITEA_SSH_PORT = '2222'
```

Because Gitea uses non-standard SSH port **`2222`**, standard SSH URLs format as:
```text
ssh://git@192.168.1.233:2222/adrian/pet-store-project.git
```

### Preventing "Host Key Verification" Hangs in Docker Agent:
When an automated agent connects to Gitea via SSH for the first time, SSH prompts:
`Are you sure you want to continue connecting (yes/no)?`
Because the agent runs headlessly, this prompt will cause the build to freeze.

To prevent this, our agent Docker image can pre-seed the host key or configure `StrictHostKeyChecking accept-new`.

You can also test the connection from your Windows host machine using:
```powershell
ssh -i "$HOME\.ssh\id_ed25519_jenkins_gitea" -p 2222 git@192.168.1.233
```
*Expected successful response from Gitea:*
```text
Hi there, adrian! You've successfully authenticated with the key named Jenkins Docker Agent, but Gitea does not provide shell access.
Connection to 192.168.1.233 closed.
```

---

## 🚀 Part 6: How the Pipeline Uses These Credentials

Your [`Jenkinsfile`](./Jenkinsfile) is already set up to seamlessly use both credentials and publish both **SNAPSHOT** and **-RELEASE** versions:

### 1. Dual Maven Package Deployment
1. **Deploy SNAPSHOT (`CURRENT_SNAPSHOT_VERSION`)**: Compiles, tests, and deploys development artifacts (e.g. `1.0.1-SNAPSHOT`) to `<snapshotRepository>` in Gitea Package Registry.
2. **Deploy RELEASE (`RELEASE_VERSION`)**: Automatically sets version to `-RELEASE` (e.g. `1.0.1-RELEASE`), compiles, and deploys clean release artifacts to `<repository>` in Gitea Package Registry.

### 2. SCM Release Tagging & Next SNAPSHOT Bump
1. **Commit & Tag Release**: Commits the `-RELEASE` POM version, tags the commit (e.g. `v1.0.1-RELEASE`), pushes the tag to Gitea via SSH, and registers the release with release notes in Gitea Releases API.
2. **Interactive Next SNAPSHOT Prompt**: Prompts for the next development iteration (e.g. `1.0.2-SNAPSHOT`), bumps the POMs, and pushes back to the active Git branch with `[skip ci]`.

---

## ✅ Summary Checklist

- [ ] Generated ED25519 key pair with no passphrase on workstation.
- [ ] Added public key (`.pub`) to Gitea at `http://192.168.1.233` under **Settings > SSH / GPG Keys**.
- [ ] Added private key to Jenkins as **SSH Username with private key** (ID: `gitea-ssh-key`, Username: `git`).
- [ ] Generated Gitea Access Token with `repo` and `package` permissions.
- [ ] Added Gitea Access Token to Jenkins as **Secret text** (ID: `gitea-token`).
- [ ] Verified SSH connection to `git@192.168.1.233` on port `2222`.

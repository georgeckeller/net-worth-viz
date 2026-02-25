# 🚀 Net Worth Viz Setup Guide

Welcome to the **Net Worth Viz** codelab! This guide will walk you through setting up your own secure, private dashboard on Google Cloud Platform and Firebase using Terraform. There is absolutely NO coding required. Just copy, paste, and let the automation do the heavy lifting!

---

## 🛑 Prerequisites

Before we begin, you need a few things:
1. A **Google Cloud Platform (GCP) User Account**.
2. **Google Cloud CLI (`gcloud`)** installed on your machine. [Install Here](https://cloud.google.com/sdk/docs/install)
3. **Terraform** installed on your machine. [Install Here](https://developer.hashicorp.com/terraform/downloads)
4. **Node.js (22+)** and **npm** installed.
5. **Firebase CLI** installed (`npm install -g firebase-tools`).

---

## Step 1: Prepare Your Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a **New Project**. Name it something like `my-net-worth-viz`.
3. **Crucial:** Ensure that **Billing is Enabled** for this new project (Firebase requires the Blaze pay-as-you-go plan, but typical usage falls well within the free tier).
4. Note your **Project ID** (e.g., `my-net-worth-viz-12345`).

---

## Step 2: Authenticate Your Command Line

Open your terminal and authenticate your local environment with Google Cloud and Firebase.

```bash
# Login to gcloud
gcloud auth login

# Set your current project
gcloud config set project YOUR_PROJECT_ID

# Login to allow Terraform to create resources
gcloud auth application-default login

# Login to Firebase
firebase login
```

---

## Step 3: Run the Terraform Automation

Terraform will automatically enable all required APIs (Cloud Functions, Firestore, Google Sheets API) and set up your Firebase project!

1. Navigate to the `terraform` directory in this project:
   ```bash
   cd terraform
   ```

2. Copy the example variables file:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

3. Open `terraform.tfvars` in your preferred text editor and replace `your-project-id-here` with your actual GCP Project ID.

4. Initialize and apply the Terraform configuration:
   ```bash
   terraform init
   terraform apply
   ```
   *Type `yes` when prompted to create the resources.*

5. **Wait for completion.** When done, Terraform will output some green text. Note the **`cloud_functions_url_base`** value; you will need it later!

---

## Step 4: Prepare Your Google Sheet

The dashboard reads your financial data from a private Google Sheet.

1. Go to [Google Sheets](https://sheets.google.com) and create a new sheet.
2. Copy the contents of the `sample-data.csv` file into this new sheet.
3. Note the **Sheet ID** from the URL. (e.g., in `https://docs.google.com/spreadsheets/d/abc123xyz/edit`, the ID is `abc123xyz`).
4. **Share the Sheet**: Over in your GCP Console, go to **IAM & Admin > Service Accounts**. Find the `App Engine default service account` (ends in `@appspot.gserviceaccount.com`).
5. Share your Google Sheet directly with that email address as a **Viewer**.

---

## Step 5: Configure the Application

Time to connect the frontend to your newly provisioned backend!

1. Go back to the root directory of the project:
   ```bash
   cd ..
   ```

2. Create your local environment file:
   ```bash
   cp .env.example .env.local
   ```

3. Open `.env.local` and fill in the values:
   - `VITE_SHEET_ID`: Paste the Sheet ID from Step 4.
   - `VITE_API_URL`: Use the `cloud_functions_url_base` from Step 3 and append `/getAssets`. (e.g., `https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/getAssets`)
   - `VITE_VERIFY_PASSWORD_URL`: Fast forward your `cloud_functions_url_base` and append `/verifyPassword`. (e.g., `https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/verifyPassword`)

---

## Step 6: Deploy Everything!

Let's ship it!

1. Select your Firebase project for this directory:
   ```bash
   firebase use YOUR_PROJECT_ID
   ```

2. Install dependencies:
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

3. Deploy using the built-in script:
   ```bash
   npm run deploy
   ```

**🎉 Congratulations!**
Your Net Worth Viz is now live, completely private, and running entirely within your own Google Cloud environment! Watch your terminal for the Hosting URL and launch your application!

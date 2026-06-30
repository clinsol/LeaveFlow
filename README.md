# LeaveFlow 📅✨

**LeaveFlow** is a polished, corporate modern workspace leave planner and holiday tracker. It allows professionals to manage their leaves, design custom leave categories, track upcoming public holidays, and visualize their leave schedule across the entire fiscal year.

---

## Features 🚀

- **Interactive Fiscal Calendar**: View your scheduled leaves, holidays, and weekends dynamically formatted with crisp, corporate slate aesthetics.
- **Smart Leave Suggestions**: Leverage smart algorithms to optimize your leave days around upcoming weekends and public holidays to maximize consecutive time off.
- **Custom Leave Categories**: Add, edit, and assign custom colors to your leave categories (e.g., Annual Leave, Sick Leave, Study Leave).
- **Public & Custom Holiday Management**: Keep track of official holidays or add custom ones specific to your organization.
- **One-Click Safe Reset**: Instantly revert the workspace to default categories, official holidays, and clear all logged entries.

---

## Tech Stack 🛠️

- **Frontend Framework**: React 19 + TypeScript
- **Bundler & Dev Server**: Vite 6
- **Styling**: Tailwind CSS v4 (Utility-first styling, slate & corporate color palette)
- **Animations**: `motion` (for fluid micro-transitions and interactive hover states)
- **Icons**: Lucide React

---

## Local Development Setup 💻

Follow these steps to run the application locally on your machine:

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18 or higher recommended).

### 1. Install Dependencies
In your project terminal, run:
```bash
npm install
```

### 2. Start the Development Server
Run the local Vite dev server:
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000`.

### 3. Build for Production
To build a production-ready optimized bundle:
```bash
npm run build
```

---

## How to Export & Upload to GitHub 🐙

Follow these precise steps to export this project from Google AI Studio and upload it to your personal GitHub profile:

### Step 1: Download the ZIP File from AI Studio
1. In the **Google AI Studio** workspace, click on the **Settings Menu** (represented by the gear icon ⚙️ in the top right corner).
2. Look for the **Export as ZIP** option.
3. Click it to download the complete source code bundle directly to your local machine.
4. Extract the downloaded `.zip` file into a directory of your choice.

### Step 2: Create a New Repository on GitHub
1. Open your web browser and navigate to [GitHub](https://github.com/).
2. Log in and click the **New** button (or go to `https://github.com/new`) to create a new repository.
3. Name your repository (e.g., `leaveflow-planner`).
4. Keep the repository setting as **Public** or **Private** based on your preference.
5. **Crucial**: Do **NOT** initialize the repository with a README, `.gitignore`, or license (since these files are already included in your downloaded project).
6. Click **Create repository**.

### Step 3: Initialize Git and Push Your Project
Open your local terminal or command prompt, navigate (`cd`) to your extracted project folder, and run the following commands:

```bash
# 1. Initialize git in your project directory
git init

# 2. Add all project files to staging
git add .

# 3. Commit the changes
git commit -m "initial: deploy LeaveFlow to GitHub"

# 4. Set the default branch to main
git branch -M main

# 5. Link your local project to your GitHub repository
# (Replace USERNAME and REPO-NAME with your GitHub credentials)
git remote add origin https://github.com/USERNAME/REPO-NAME.git

# 6. Push your project to GitHub
git push -u origin main
```

Now, your project is fully uploaded, organized, and visible on GitHub! 🌟

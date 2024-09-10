LAUNCH A INSTANCE

OPEN GITBASH WHERE .pem file is located
1. Chmod 400 zaubTask.pem
2. Connect with SSH
3. Update the package list:
   sudo apt update
4. Install Node.js:
   sudo apt install nodejs npm
5. Verify installation:
   node -v
   npm -v
6. Install Chromium dependencies:
   sudo apt install -y libx11-xcb1 libxcomposite1 libxcursor1 libxdamage1 libxi6 libxtst6 libnss3 libxrandr2 libasound2 libatk1.0-0 libatk-bridge2.0-0 libpangocairo-1.0-0 libgtk-3-0
7. Clone your project:
   git clone https://github.com/your-username/your-repo.git
8. Navigate into your project folder:
   cd your-repo
9. Install project dependencies:
    npm install

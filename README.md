# VolunteerCBUS

A modern web platform for discovering and posting volunteer opportunities in Columbus, Ohio. Built with React, Firebase, and Tailwind CSS.

## 🎯 Features

- **Browse Opportunities** - Explore volunteer roles filtered by category, location, and keywords
- **Post Opportunities** - Submit new volunteer openings for community review
- **Admin Dashboard** - Moderate submissions and track engagement metrics
- **Real-time Analytics** - Monitor site traffic, engagement rates, and application clicks
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- **Search & Filter** - Find roles by title, organization, category, and location

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/volunteer-cbus.git
cd volunteer-cbus

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm start
```

The app will open at `http://localhost:3001`

## 🔧 Configuration

### Firebase Setup

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Get your Firebase config from Project Settings
3. Update `src/App.js` line 24-31 with your credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## 🔐 Admin Access

Type the secret command `admindanny0987` anywhere on the site to trigger admin login.
Enter passcode: `2026`

### Admin Features
- View pending opportunity submissions
- Approve or reject new posts
- Delete opportunities
- Track site metrics and engagement

## 📁 Project Structure

```
volunteer-cbus/
├── public/
│   └── index.html          # HTML entry point
├── src/
│   ├── App.js              # Main React component
│   └── index.js            # React DOM render
├── package.json            # Dependencies
└── README.md               # This file
```

## 📦 Dependencies

- **React 18** - UI library
- **Firebase 10** - Backend & database
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## 🎨 Design Features

- Dark theme with red accent color
- Bold typography and uppercase branding
- Smooth animations and transitions
- Mobile-first responsive layout
- Accessibility-focused components

## 🔄 Database Structure

```
artifacts/
└── volunteer-cbus-v1/
    └── public/
        └── data/
            ├── opportunities/    # Volunteer posts
            └── siteMetrics/
                └── global        # Analytics data
```

## 🚢 Deployment

### Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy
firebase deploy
```

### Vercel

```bash
npm run build
vercel --prod
```

## 📝 Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App (irreversible)

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

Created by Daniel Parparov for the Columbus community.

## 🙏 Acknowledgments

- Columbus community volunteers
- Firebase for backend infrastructure
- React team for the framework
- Tailwind CSS for styling utilities

## 📞 Support

Have questions? Issues? Suggestions?
- Open a GitHub issue
- Contact: [your email]

---

**VolunteerCBUS** - Empowering the future of Columbus through real-world impact.

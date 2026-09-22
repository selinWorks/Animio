<div align="center">

# 🐾 Animio

### Smarter care for the ones who can't tell you what's wrong.

**A modern mobile pet care companion for managing daily care, health information, reminders, and AI-assisted guidance — all in one place.**

<br/>

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge\&logo=react\&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge\&logo=typescript\&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge\&logo=firebase\&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge\&logo=node.js\&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge\&logo=express\&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI_API-412991?style=for-the-badge\&logo=openai\&logoColor=white)

<br/>

**React Native · TypeScript · Firebase · Node.js · Express · OpenAI**

</div>

---

## ✦ About Animio

Pet care involves more than remembering feeding times.

Health information, vaccination records, veterinary visits, medication schedules, routine care, reminders, and everyday observations can quickly become scattered across different places.

**Animio brings them together.**

Animio is a full-stack mobile application designed to give pet owners a structured and intuitive way to manage their pets' daily care and important health-related information.

Users can create individual pet profiles, organize care activities through a calendar, receive scheduled reminders, manage pet information, and access an AI-powered assistant for general informational guidance.

Behind the AI Assistant, Animio uses a dedicated **Node.js backend** and a custom **rule-based risk assessment system** that evaluates user-provided information before communicating with the AI service.

The result is an application that combines mobile development, cloud services, backend architecture, notifications, persistent data, and AI integration within a single product.

---

## ✦ Key Features

<table>
<tr>
<td width="50%" valign="top">

### 🐕 Pet Profiles

Create and manage individual profiles for multiple pets.

Profiles can contain:

* Name
* Animal type
* Age
* Gender
* Weight
* Vaccination information
* Last veterinary visit
* Health and care notes
* Profile image

</td>
<td width="50%" valign="top">

### 📅 Care Calendar

Organize important pet-related activities through a dedicated calendar system.

Care activities can include:

* Vaccinations
* Veterinary appointments
* Medication
* Feeding routines
* Grooming
* General care tasks

</td>
</tr>

<tr>
<td width="50%" valign="top">

### 🔔 Smart Reminders

Scheduled notifications help users stay aware of upcoming care activities.

Animio integrates:

* Care reminders
* Local notifications
* Notification preferences
* Persistent notification state

</td>
<td width="50%" valign="top">

### 🤖 AI Assistant

Receive general informational guidance based on contextual information about the pet and the reported situation.

Requests are processed through Animio's backend before reaching the AI service.

</td>
</tr>

<tr>
<td width="50%" valign="top">

### 🔐 Authentication

Firebase Authentication provides account-based access to the application.

Authentication state is integrated with the navigation flow, separating login and registration from the main application.

</td>
<td width="50%" valign="top">

### ☁️ Cloud Synchronization

Animio uses Firebase services to persist user-specific information including:

* Pet profiles
* Care activities
* User preferences
* AI conversations
* Feedback

</td>
</tr>
</table>

---

# 🤖 AI-Assisted Pet Care

The AI Assistant is one of Animio's core features.

Rather than sending a free-form question directly from the mobile application to an AI model, Animio processes assistant requests through a dedicated backend.

The assistant can use contextual information such as:

* Pet type
* Reported problem
* Selected symptoms
* Duration of the problem
* User-reported urgency

This information is evaluated by Animio's backend before an AI-generated response is returned.

```text
Pet Information
      │
      ▼
User-Reported Situation
      │
      ▼
Backend Validation
      │
      ▼
Risk Assessment
      │
      ▼
AI Processing
      │
      ▼
Structured Guidance
```

> [!IMPORTANT]
> **Animio does not provide veterinary diagnoses.**
>
> The AI Assistant is designed to provide general informational guidance and should not be considered a replacement for examination, diagnosis, or treatment by a qualified veterinarian.

---

# 🛡️ Risk Assessment System

Animio includes a custom **rule-based risk scoring layer** within its backend.

The purpose of this layer is to perform a deterministic assessment of the information submitted by the user before AI-generated guidance is produced.

The system can evaluate factors including:

* Problem category
* Selected symptoms
* Symptom combinations
* Duration
* Reported urgency
* Pet type

Based on these factors, the backend classifies the submitted situation into one of four levels.

| Level | Classification | Description                                         |
| :---: | :------------- | :-------------------------------------------------- |
|   🟢  | **Low**        | General or lower-risk situation                     |
|   🟡  | **Medium**     | Situation may require closer observation            |
|   🟠  | **High**       | Potentially concerning situation                    |
|   🔴  | **Urgent**     | Situation may require prompt professional attention |

### Why a separate risk layer?

The risk classification is handled by application logic rather than being delegated entirely to the language model.

This creates a clear separation between:

```text
Rule-Based Assessment  →  AI-Generated Guidance
```

and allows Animio to maintain its own deterministic logic independently of the generated AI response.

---

# 🏗️ System Architecture

Animio follows a client-cloud-backend architecture.

```text
┌─────────────────────────────────────────────────────┐
│                     ANIMIO                          │
│            React Native + TypeScript                │
│                                                     │
│   UI • Navigation • Pets • Calendar • Assistant    │
└─────────────────────────┬───────────────────────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
                ▼                   ▼
      ┌──────────────────┐   ┌──────────────────────┐
      │     FIREBASE     │   │   NODE.JS BACKEND   │
      │                  │   │      Express.js      │
      │ Authentication   │   └──────────┬───────────┘
      │ Cloud Firestore  │              │
      │ Storage          │              ▼
      └──────────────────┘   ┌──────────────────────┐
                             │   RISK ASSESSMENT    │
                             │                      │
                             │  Rule-Based Scoring  │
                             └──────────┬───────────┘
                                        │
                                        ▼
                             ┌──────────────────────┐
                             │      OPENAI API      │
                             │                      │
                             │  AI-Assisted Output  │
                             └──────────────────────┘
```

### Mobile Application

The React Native client is responsible for:

* User interface
* Navigation
* Authentication flow
* Pet management
* Care calendar
* Notification interaction
* User preferences
* AI Assistant interface

### Firebase

Firebase provides cloud infrastructure for:

* Authentication
* User-specific application data
* Pet data
* Care activities
* Preferences
* Conversation data
* Media storage

### Backend

The Node.js and Express backend is responsible for:

* Receiving AI Assistant requests
* Validating request data
* Running risk assessment logic
* Communicating with the OpenAI API
* Keeping sensitive API credentials outside the mobile client

---

# 🔄 AI Request Flow

A typical assistant request follows the flow below:

```text
┌───────────────┐
│     USER      │
└───────┬───────┘
        │
        │ Pet + Situation Information
        ▼
┌─────────────────────┐
│    ANIMIO MOBILE    │
│ React Native + TS   │
└──────────┬──────────┘
           │
           │ API Request
           ▼
┌─────────────────────┐
│   EXPRESS BACKEND   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  INPUT VALIDATION   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    RISK SCORING     │
│                     │
│  LOW       ●        │
│  MEDIUM     ●       │
│  HIGH        ●      │
│  URGENT       ●     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│      OPENAI API     │
└──────────┬──────────┘
           │
           │ Generated Guidance
           ▼
┌─────────────────────┐
│    ANIMIO MOBILE    │
└─────────────────────┘
```

This structure keeps the mobile client separated from sensitive server-side logic and credentials.

---

# ☁️ Firebase Integration

Animio uses multiple Firebase services rather than treating Firebase as a single database layer.

## Firebase Authentication

Responsible for user account authentication and authenticated application access.

## Cloud Firestore

Used for structured application data such as:

```text
Users
 ├── Pet Profiles
 ├── Care Activities
 ├── Preferences
 ├── Assistant Conversations
 └── Feedback
```

## Firebase Storage

Used for media associated with the application, including pet profile images.

Separating structured records from uploaded media keeps the application's data architecture cleaner and easier to maintain.

---

# 🔔 Notifications

Animio includes a dedicated notification system for pet care reminders.

**Notifee** is used for local notification functionality within the React Native application.

Notification-related functionality includes:

* Scheduled care reminders
* Notification preferences
* Care reminder preferences
* Notification screen
* Persistent local notification state

This allows calendar-based care activities to become actionable reminders instead of remaining passive records.

---

# 🧭 Navigation

Animio uses **React Navigation** with both stack-based and bottom-tab navigation.

```text
Animio
│
├── Authentication
│   │
│   ├── Login
│   └── Register
│
└── Main Application
    │
    ├── Home
    │
    ├── Pets
    │   ├── Add Pet
    │   ├── Pet Details
    │   └── Edit Pet
    │
    ├── Calendar
    │
    ├── AI Assistant
    │
    ├── Notifications
    │
    └── Profile
        ├── About
        └── Upcoming Features
```

This structure keeps major application areas easily accessible while allowing detail and editing screens to use their own navigation flow.

---

# 🛠️ Technology Stack

## Mobile Development

| Technology                       | Usage                              |
| -------------------------------- | ---------------------------------- |
| **React Native**                 | Cross-platform mobile application  |
| **TypeScript**                   | Type-safe development              |
| **React Native CLI**             | Native React Native environment    |
| **React Navigation**             | Stack and bottom-tab navigation    |
| **Notifee**                      | Local notifications                |
| **AsyncStorage**                 | Local persistent application state |
| **React Native Image Picker**    | Pet image selection                |
| **React Native SVG**             | Vector UI elements                 |
| **Lucide React Native**          | Application iconography            |
| **React Native Linear Gradient** | Gradient-based UI components       |

## Backend

| Technology              | Usage                              |
| ----------------------- | ---------------------------------- |
| **Node.js**             | Server-side JavaScript runtime     |
| **Express.js**          | REST API and request routing       |
| **Custom Risk Scoring** | Rule-based risk classification     |
| **OpenAI API**          | AI-assisted informational guidance |

## Cloud

| Technology                  | Usage                   |
| --------------------------- | ----------------------- |
| **Firebase Authentication** | Account authentication  |
| **Cloud Firestore**         | Cloud data persistence  |
| **Firebase Storage**        | Image and media storage |

---

# 📂 Project Structure

```text
Animio/
│
├── src/
│   │
│   ├── assets/
│   │   ├── fonts/
│   │   └── images/
│   │
│   ├── data/
│   │
│   ├── navigation/
│   │
│   ├── screens/
│   │
│   ├── services/
│   │
│   └── types/
│
├── backend/
│   │
│   └── src/
│       ├── routes/
│       └── services/
│
├── android/
│
├── ios/
│
├── App.tsx
├── package.json
└── README.md
```

---

# 📱 Application Preview

<div align="center">

### Interface Preview

Screenshots will be added as the interface is finalized.

<!--

Create a "screenshots" directory in the repository and add
the corresponding application screenshots.

<table>
  <tr>
    <td align="center">
      <img src="screenshots/home.png" width="210" />
      <br/><br/>
      <b>Home</b>
    </td>
    <td align="center">
      <img src="screenshots/pets.png" width="210" />
      <br/><br/>
      <b>Pet Management</b>
    </td>
    <td align="center">
      <img src="screenshots/pet-details.png" width="210" />
      <br/><br/>
      <b>Pet Details</b>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="screenshots/calendar.png" width="210" />
      <br/><br/>
      <b>Care Calendar</b>
    </td>
    <td align="center">
      <img src="screenshots/assistant.png" width="210" />
      <br/><br/>
      <b>AI Assistant</b>
    </td>
    <td align="center">
      <img src="screenshots/profile.png" width="210" />
      <br/><br/>
      <b>Profile</b>
    </td>
  </tr>
</table>

-->

</div>

---

# 🚀 Getting Started

## Prerequisites

Before running Animio, make sure the following are installed:

* **Node.js**
* **npm**
* **React Native development environment**
* **Android Studio** for Android development
* **Xcode** for iOS development on macOS

The project also requires valid Firebase configuration files and backend environment variables.

---

## 1. Clone the Repository

```bash
git clone <repository-url>
cd Animio
```

---

## 2. Install Mobile Dependencies

```bash
npm install
```

---

## 3. Install Backend Dependencies

```bash
cd backend
npm install
```

Return to the project root when necessary:

```bash
cd ..
```

---

# 🔐 Environment Configuration

Sensitive credentials must never be committed to source control.

Create the backend environment configuration locally.

```env
OPENAI_API_KEY=your_openai_api_key
```

Environment files containing private credentials should remain excluded through `.gitignore`.

Firebase configuration must also be provided locally according to the target platform.

> [!CAUTION]
> Never expose the OpenAI API key directly inside the React Native application.
> AI requests should be sent through the backend so that server-side credentials remain outside the mobile client.

---

# ▶️ Running the Application

## Start the Backend

From the backend directory:

```bash
cd backend
npm start
```

---

## Start Metro

From the project root:

```bash
npm start
```

---

## Run on Android

Open another terminal:

```bash
npm run android
```

---

## Run on iOS

```bash
npm run ios
```

> iOS development requires macOS and Xcode.

---

# 🔒 Security Considerations

Animio follows several basic security principles:

* Sensitive AI credentials remain on the backend
* Environment files are excluded from source control
* Authentication is handled through Firebase Authentication
* User data is associated with authenticated application accounts
* AI requests are processed through a backend rather than exposing credentials to the mobile client
* Risk assessment is performed independently from generated AI content

These decisions help maintain separation between the client, cloud data, backend logic, and external AI services.

---

# 🎯 Project Goals

Animio was developed as a practical full-stack mobile project exploring how several modern technologies can work together within a single application.

The project demonstrates experience with:

```text
✓ Cross-platform mobile development
✓ TypeScript-based application architecture
✓ Mobile UI/UX development
✓ Authentication flows
✓ Cloud database integration
✓ Cloud media storage
✓ Navigation architecture
✓ Local notifications
✓ Persistent application state
✓ REST API communication
✓ Backend development
✓ AI API integration
✓ Rule-based risk assessment
✓ Client-server separation
```

Rather than treating these technologies as isolated examples, Animio combines them into one connected product experience.

---

# 🗺️ Roadmap

Animio is actively evolving.

Potential future improvements include:

* More detailed vaccination history
* Extended health history
* Recurring care routines
* Advanced reminder customization
* Improved health trend visualization
* Additional pet types and personalization
* More advanced Assistant context handling
* Expanded care history
* Improved accessibility
* Further UI/UX refinements

---

# ⚠️ Medical Disclaimer

Animio is a pet care organization and informational assistance application.

The AI Assistant and risk assessment features are intended to provide **general informational guidance only**.

They do not provide medical diagnoses and must not be used as a substitute for professional veterinary examination, diagnosis, advice, or treatment.

If a pet appears seriously ill, injured, or in immediate danger, users should contact a qualified veterinarian or emergency veterinary service.

---

# 👩‍💻 Development Team

Animio is a collaborative project developed by **Selin** and **Betül Kızılkaya**, bringing together mobile development, UI/UX, backend systems, cloud services, and AI-assisted functionality.

<table>
<tr>
<td width="50%" valign="top">

### 💜 Selin

**Mobile Development & UI/UX**

- React Native application development
- TypeScript-based mobile architecture
- Interface design and UI/UX implementation
- Navigation and screen flows
- Pet profile and care management interfaces
- Calendar and reminder interfaces
- Application-wide visual design and user experience

**GitHub:** [@selinWorks](https://github.com/selinWorks)

</td>
<td width="50%" valign="top">

### 🤖 Betül Kızılkaya

**Backend & AI Systems**

- Node.js and Express.js backend development
- AI Assistant backend integration
- OpenAI API communication
- Rule-based risk assessment logic
- Request validation and server-side processing
- AI response flow and supporting backend services

**GitHub:** [@betulkizilkaya](https://github.com/betulkizilkaya)

</td>
</tr>
</table>

### Technology Responsibilities

```text
Mobile & UI/UX       → React Native + TypeScript
Backend              → Node.js + Express.js
Cloud                → Firebase
AI Integration       → OpenAI API
Risk Assessment      → Custom Rule-Based Risk Scoring
```

---

# 📄 License & Copyright

Copyright © 2026 **Selin & Betül Kızılkaya**. All rights reserved.

The source code, design, documentation, and other original materials in this repository are the intellectual property of the project authors unless otherwise stated.

Permission is not granted to copy, modify, redistribute, publish, sublicense, or use substantial portions of this project for commercial purposes without prior permission from the authors.

Third-party libraries, frameworks, services, trademarks, and other external materials used by Animio remain subject to their respective licenses and terms.

---

<div align="center">

<br/>

## 🐾 Animio

**Care. Organize. Understand.**

*Making everyday pet care a little easier.*

<br/>

Developed with care by **[Selin](https://github.com/selinWorks)** & **[Betül Kızılkaya](https://github.com/betulkizilkaya)**

<br/>

Built using **React Native, TypeScript, Firebase, Node.js & Express.js**

<br/>

**© 2026 Animio · All rights reserved.**

</div>

# 🐾 PetCare

**PetCare** is a mobile application designed to help pet owners manage their pets' daily care, health information, and important activities from one place.

Built with **React Native and TypeScript**, PetCare combines pet management features with Firebase services and an AI-powered assistant that provides guidance based on information entered by the user.

---

## ✨ Features

### 🐶 Pet Management

Users can create and manage individual profiles for their pets.

Pet profiles can contain information such as:

* Name
* Animal type
* Age
* Weight
* Vaccination information
* Last veterinary visit
* Health and care notes

Pet information can be viewed and updated directly from the mobile application.

### 📅 Care & Activity Tracking

PetCare helps users organize important activities related to their pets.

Users can manage care-related events and keep track of upcoming activities through the application's calendar system.

### 🤖 AI Pet Care Assistant

PetCare includes an AI-powered assistant designed to provide general guidance based on the information provided by the user.

The assistant evaluates information such as:

* Pet type
* Type of problem
* Duration
* Urgency

Before generating an AI response, the backend uses its own **risk scoring system** to classify the situation into different risk levels:

* 🟢 Low
* 🟡 Medium
* 🟠 High
* 🔴 Urgent

After the initial risk assessment, the backend communicates with the AI service to generate an appropriate response.

> **Note:** The AI Assistant is designed to provide general informational guidance and is not a replacement for professional veterinary diagnosis or treatment.

### 🔐 Authentication

PetCare uses **Firebase Authentication** to manage user authentication securely.

Users can create an account and sign in to access their personal pet information.

### ☁️ Cloud Data Storage

Application data is stored using **Cloud Firestore**.

Firestore is used to manage data such as:

* User information
* Pet profiles
* Care activities
* AI Assistant conversations
* Feedback

### 💬 Feedback

Users can provide feedback directly through the application, helping improve the overall PetCare experience.

---

## 🛠️ Tech Stack

### Mobile Application

* **React Native**
* **TypeScript**
* **React Native CLI**

### Backend

* **Node.js**
* **Express.js**

### Database & Authentication

* **Firebase Authentication**
* **Cloud Firestore**

### AI

* **OpenAI API**
* Custom risk scoring system

---

## 🏗️ Architecture

PetCare consists of a React Native mobile application connected to Firebase services and a separate Node.js backend.

```text
                     ┌─────────────────────┐
                     │      PetCare        │
                     │ React Native + TS   │
                     └──────────┬──────────┘
                                │
                 ┌──────────────┴──────────────┐
                 │                             │
                 ▼                             ▼
       ┌──────────────────┐          ┌──────────────────┐
       │     Firebase     │          │ Node.js Backend  │
       │                  │          │    Express.js    │
       │ Authentication   │          └────────┬─────────┘
       │ Cloud Firestore  │                   │
       └──────────────────┘                   ▼
                                      ┌──────────────────┐
                                      │   Risk Scoring   │
                                      │      System      │
                                      └────────┬─────────┘
                                               │
                                               ▼
                                      ┌──────────────────┐
                                      │    OpenAI API    │
                                      └──────────────────┘
```

The mobile application handles the user interface and pet management experience, while Firebase provides authentication and cloud data storage.

AI Assistant requests are processed through the Node.js backend, where the application's risk scoring logic evaluates the provided information before interacting with the OpenAI API.

---

## 📱 Screenshots

Application screenshots will be added here.

<!--
Example:

<p align="center">
  <img src="screenshots/home.png" width="220" />
  <img src="screenshots/pet-details.png" width="220" />
  <img src="screenshots/ai-assistant.png" width="220" />
</p>
-->

---

## 🚀 Getting Started

### Prerequisites

Before running the project, make sure you have the following installed:

* Node.js
* npm
* React Native development environment
* Android Studio for Android development
* Xcode for iOS development on macOS

You will also need the required Firebase configuration and environment variables for services used by the project.

### Installation

Clone the repository:

```bash
git clone <repository-url>
```

Navigate to the project:

```bash
cd PetCare
```

Install the dependencies:

```bash
npm install
```

### Start Metro

```bash
npm start
```

### Run on Android

Open another terminal and run:

```bash
npm run android
```

### Run on iOS

```bash
npm run ios
```

> iOS development requires macOS and Xcode.

---

## 🔒 Environment Variables

Sensitive information such as API keys should **not** be committed to the repository.

Create the required environment configuration locally and provide the necessary credentials for services such as the OpenAI API.

Example:

```env
OPENAI_API_KEY=your_api_key
```

Make sure files containing private credentials are included in `.gitignore`.

---

## 🎯 Project Purpose

PetCare was developed to create a practical mobile solution for everyday pet care while gaining hands-on experience with modern mobile and backend technologies.

The project brings together:

* Cross-platform mobile development
* User authentication
* Cloud database management
* REST API communication
* Backend development
* AI API integration
* Rule-based risk assessment
* Mobile UI/UX development

---

## 🔮 Future Improvements

PetCare can be expanded with features such as:

* Push notifications for upcoming care activities
* More detailed vaccination tracking
* Veterinary appointment reminders
* Improved pet health history
* Enhanced AI Assistant capabilities
* Additional personalization options

---

## 👩‍💻 Developer

Developed with **React Native, TypeScript, Firebase, Node.js and Express.js**.

---

<p align="center">
  🐾 <b>Making everyday pet care easier.</b>
</p>

# Story of Time Launcher (时光故事启动器)

## Project Overview
A modern, immersive launcher for World of Warcraft 3.3.5a, featuring a "Time Magic" aesthetic and hybrid P2P/HTTP distribution.

## Tech Stack
- **Frontend**: React 19 + TypeScript + Tailwind CSS (UI & Logic)
- **Host**: C# .NET 9 + WPF (WebView2) (System Integration)

## Prerequisites
- Node.js (v18+)
- .NET 9 SDK

## Getting Started

### 1. Start the Frontend (UI)
Open a terminal in the `Frontend` directory:
```bash
cd Frontend
npm install
npm run dev
```
The frontend will run at `http://localhost:5173`.

### 2. Start the Host (Launcher)
Open a new terminal in the root directory:
```bash
dotnet run --project Host/StoryOfTimeLauncher.csproj
```
The launcher window should appear, loading the UI from the running frontend server.

## Project Structure
- `Frontend/`: React application containing all UI components and logic.
- `Host/`: WPF application hosting the WebView2 control to display the frontend.

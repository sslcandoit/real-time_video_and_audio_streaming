# Real-Time Video and Audio Streaming Web App

## Project Overview

This project is a **real-time video and audio streaming web application** using **WebRTC** for video calls and the **Web Audio API** for audio processing and visualization. The app allows users to initiate video chats, toggle audio filters, visualize audio waveforms, and select audio input/output devices. Real-time peer communication is handled using **Socket.IO**.

### Key Features:
- **Real-time Video Chat**: Peer-to-peer video streaming using WebRTC.
- **Audio Filters**: Toggleable low-pass filters (0-200 Hz) for both local and remote audio streams.
- **Waveform Visualization**: Audio waveform visualization using the Web Audio API.
- **Device Selection**: Input/output audio device selection for microphones and speakers.
- **Peer-to-Peer Communication**: Socket.IO is used for signaling in WebRTC connections.

---

## Tools and Technologies

### Frontend:
- **React**: Main framework for the UI and state management.
- **WebRTC (Peer.js)**: Enables real-time video and audio streaming between peers.
- **Web Audio API**: Used for applying audio filters (gain, low-pass) and visualizing the waveform.
- **Socket.IO**: Handles signaling during WebRTC connection setup.
- **Material-UI**: UI components like buttons and icons for a modern interface.
- **HTML5 Canvas**: Used for rendering the audio waveform.

### Backend:
- **Node.js**: Server environment to handle requests and manage Socket.IO connections.
- **Express.js**: Backend framework to serve the frontend and manage the server-side logic.
- **Socket.IO**: Provides real-time bidirectional communication between the frontend and backend.

---

## Project Structure

### Frontend (`App.js`)

- **State Management**:
  - React's `useState` and `useRef` are used to manage the media streams, peer connections, and audio processing nodes (GainNode, BiquadFilterNode, AnalyserNode).
  
- **Audio Processing**:
  - The **Web Audio API** is used to process and analyze audio streams. It manages two separate chains for local and remote audio: one for applying gain and filtering, and the other for waveform visualization.

- **Device Selection**:
  - The app uses the **MediaDevices API** to list available audio input (microphones) and output (speakers). Users can dynamically select input and output devices, which updates the stream accordingly.

- **WebRTC**:
  - WebRTC is implemented using **Peer.js**. Signaling is managed using Socket.IO, allowing users to initiate and answer video calls. Both incoming and outgoing streams are handled by the app.

- **Waveform Visualization**:
  - The audio waveform for both local and remote streams is drawn on an HTML5 `<canvas>` element using the **AnalyserNode** from the Web Audio API.

### Backend (`server.js`)

- **Socket.IO Server**:
  - The server uses Socket.IO to handle signaling during the WebRTC connection setup process. It assigns a unique ID to each connected user and forwards signaling data to establish WebRTC connections between peers.

  Key events:
  - `callUser`: Initiates a call between two users.
  - `answerCall`: Answers a call, completing the WebRTC handshake.
  - `disconnect`: Manages user disconnection and cleans up resources.

---

## Functionality and Logic

### Call Setup:
1. **Initiating a Call**:
   - A user enters an ID to call, and Peer.js initiates a WebRTC connection.
   - Signaling data is sent to the server, which forwards it to the recipient.

2. **Answering a Call**:
   - The recipient receives the signaling data and accepts the call, completing the WebRTC connection.

3. **Ending a Call**:
   - A user can end the call by closing the peer connection. The server emits a `callEnded` event to both users.

### Audio Processing:
- **Gain Control**: The **GainNode** is used to control the volume of the audio stream.
- **Low-Pass Filter**: A **BiquadFilterNode** applies a low-pass filter to the audio (cutoff frequency: 0-200 Hz). Each stream (local and remote) has its own independent filter, which can be toggled on or off.

### Visualization:
- The app visualizes the audio waveform using the **AnalyserNode**. The `getByteTimeDomainData()` method is used to get waveform data and render it on an HTML `<canvas>` element for both local and remote streams.

---

## Challenges

1. **Synchronizing WebRTC with Web Audio API**:
   - Managing separate Web Audio nodes for both the local and remote audio streams and ensuring that their filters and visualizations did not interfere with each other was challenging.

2. **Dynamic Device Selection**:
   - Changing the audio input/output devices dynamically using the **MediaDevices API** while maintaining the active WebRTC stream required careful management of media states.

3. **Real-Time Communication**:
   - Handling signaling and managing connections through Socket.IO, especially under poor network conditions, required building reconnection logic and managing peer disconnection events.

---

## How to Run the Project

### Prerequisites:
- You must have **Node.js** and **npm** installed on your system.

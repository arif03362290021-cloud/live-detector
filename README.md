# Vision Tracker

Build a fully functional, modern, responsive web application for my CodeAlpha AI Internship — Task 4: Object Detection and Tracking.

Project Title

Real-Time Object Detection & Tracking System

Objective

Create an AI-powered application that can detect objects from a live webcam stream or an uploaded video and track detected objects in real time using bounding boxes, object labels, confidence scores, and unique tracking IDs.

Core Requirements

Live Webcam Detection

Add a button: “Start Camera”.

Request webcam permission from the browser.

Display the live camera feed.

Run object detection continuously on the video frames.

Draw bounding boxes around detected objects.

Display the object name, confidence percentage, and tracking ID above each bounding box.

Video Upload

Add an “Upload Video” option.

Support common video formats such as MP4, WebM, and MOV where supported by the browser.

Process the uploaded video frame by frame.

Display detection and tracking results directly over the video.

Object Detection

Use a pretrained YOLO model suitable for browser-based inference.

Prefer a lightweight YOLO model so the application can run efficiently in the browser.

Use a browser-compatible inference solution such as ONNX Runtime Web or another suitable client-side approach.

Do NOT create fake detection results.

If the model cannot load, show a clear error message instead of pretending that detection is working.

Object Tracking

Implement a lightweight SORT-style tracking algorithm in JavaScript/TypeScript.

Assign a unique tracking ID to each detected object.

Maintain the same ID while the same object remains visible across consecutive frames.

When multiple objects are detected, track them independently.

Detection Overlay For every detected object, display:

Bounding box

Object class/name

Confidence score

Tracking ID

Example:

Person | ID: 3 | 94%

Dashboard / Statistics Create a professional dashboard showing:

Current FPS

Number of detected objects

Number of active tracked objects

Detection status

Camera status

Processing status

Also show a small live list of currently tracked objects, for example:

Person — ID 1 — 95% Car — ID 2 — 91% Dog — ID 3 — 88%

Controls Add:

Start Camera

Stop Camera

Upload Video

Start Detection

Stop Detection

Clear / Reset

Toggle Detection Boxes

Toggle Tracking IDs

Modern UI Design a clean, professional AI dashboard suitable for a Computer Science internship project.

Use:

Modern dark/light interface

Responsive design for desktop and mobile

AI/Computer Vision themed elements

Clean cards and buttons

Professional typography

Smooth animations

Clear status indicators

Do not overcomplicate the interface.

Technical Requirements

Use:

React

TypeScript

Tailwind CSS

Modern component architecture

Browser-based computer vision/inference

YOLO pretrained model

SORT-style object tracking

The application should preferably perform inference locally in the browser so that no external API key is required.

Important Functional Requirement

This must be a REAL working object detection and tracking application.

Do NOT use:

Fake bounding boxes

Random object names

Simulated tracking IDs

Static screenshots

Fake detection animations

The application should actually process webcam/video frames and display real detection results.

If browser limitations prevent a particular model from running, implement the most practical browser-compatible pretrained YOLO solution and clearly show model loading/progress/error states.

User Experience

When the application opens, show:

“Real-Time Object Detection & Tracking”

Subtitle:

“CodeAlpha AI Internship — Task 4”

Then provide two main options:

[ Start Camera ] [ Upload Video ]

When detection starts, show the video with real-time bounding boxes and tracking IDs.

At the bottom, show:

“Powered by Computer Vision”

and

“Developed as part of CodeAlpha AI Internship — Task 4”

Code Quality

Keep the code clean and modular.

Separate detection, tracking, video processing, and UI components.

Handle camera permissions gracefully.

Handle unsupported video formats.

Handle model-loading errors.

Avoid freezing the UI during inference.

Optimize frame processing for reasonable browser performance.

Add comments explaining important computer-vision logic.

Final Requirement

After building the application, make sure all buttons and core features actually work.

The final result should be a functional demonstration of:

Webcam/Video Input → YOLO Object Detection → Bounding Boxes → SORT Tracking → Tracking IDs → Real-Time Dashboard

This project will be submitted as CodeAlpha AI Internship Task 4, so prioritize real functionality, reliability, and professional presentation over unnecessary visual effects.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d8ce463a-2beb-4d35-b644-b1524387fe22).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

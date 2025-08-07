# **App Name**: VeriClock

## Core Features:

- Device Management: Admin interface for managing RFID devices, including adding, updating, deleting, and updating the token used for NodeMCU authentication. It can also change Enrollment or Attendance modes.
- User Registration: User interface for registering users, triggered by RFID scans from NodeMCU, linked with device Enrollment Mode. Captures user details and stores them securely, preventing duplicate RFID UIDs.
- Attendance Logging: Logs attendance when a user scans their RFID in Attendance Mode, sent from NodeMCU. Logs are stored with user, device, date, and status information.
- Attendance Display and Export: Displays attendance logs in a tabular format, filtered by date range, user, or device department. Includes an "Export to Excel" option for generating and downloading attendance data.
- Scheduling Assistant: AI-powered tool suggests optimal class scheduling based on attendance patterns.
- Admin Authentication: Secure admin login using Firebase Authentication with optional user roles for enhanced system security.

## Style Guidelines:

- Primary color: Deep indigo (#3F51B5) to convey trust, security, and professionalism.
- Background color: Very light indigo (#F0F2F9) to provide a clean and modern interface.
- Accent color: Muted teal (#4CAF50) to highlight important actions and provide visual interest.
- Font pairing: 'Poppins' (sans-serif) for headings, 'PT Sans' (sans-serif) for body text, lending a modern yet accessible feel. 
- Use a set of modern, line-style icons for navigation and key actions.
- Modern, dashboard-style layout with a focus on clear data presentation. Uses card-based components and a consistent grid system to support different screen sizes.
- GSAP animations used sparingly for transitions and loading states to provide a premium look and feel.
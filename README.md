# Our Mobile Mechanic

A modern, responsive web application for managing car services and bookings.

## Project Overview

This application allows users to:
- Register and manage their vehicles
- Schedule mechanic services
- Track service history
- Manage bookings and appointments

## Key Features

- User authentication and authorization
- Vehicle management
- Service booking and scheduling
- Responsive design for all devices
- Real-time status updates

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Zustand
- **UI Components**: Custom components with accessibility support
- **State Management**: Zustand with persistence
- **Form Handling**: Custom form hooks with validation
- **Routing**: React Router v6
- **API Integration**: Axios with type safety

## Modern Development Practices

This project implements several modern React and TypeScript best practices:

- **Functional Components**: All components are functional with React hooks
- **Custom Hooks**: Reusable logic extracted into custom hooks
- **Code Splitting**: Dynamic imports with React.lazy for better performance
- **TypeScript**: Strong typing throughout the application
- **Error Handling**: Comprehensive error boundaries and state management
- **Accessibility**: ARIA attributes, keyboard navigation, and semantic HTML
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **State Management**: Zustand for predictable and performant state management
- **Suspense & Error Boundaries**: For better loading and error states
- **Clean Architecture**: Organized folder structure and separation of concerns

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── api/          # API configuration and services
├── components/   # Reusable UI components
├── hooks/        # Custom React hooks
├── interfaces/   # TypeScript interfaces and types
├── layouts/      # Page layout components
├── pages/        # Page components
├── routes/       # Routing configuration
├── services/     # Service layer for API communication
├── stores/       # Zustand state management
└── utils/        # Utility functions and helpers
```

## License

This project is private software for Our Mobile Mechanic.

#### Backend
- https://github.com/rody-huancas/api-rest-ts-mongo


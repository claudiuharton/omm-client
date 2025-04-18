# API Documentation

This document provides detailed documentation for the backend API endpoints used in the application. All requests are made to the base URL: `http://localhost:8080`

## Table of Contents

- [Authentication](#authentication)
  - [Login](#login)
  - [Register](#register)
  - [Logout](#logout)
- [User Profile](#user-profile)
  - [Get User](#get-user)
  - [Update User Address](#update-user-address)
- [Cars](#cars)
  - [Get All Cars](#get-all-cars)
  - [Get Car by ID](#get-car-by-id)
  - [Create Car](#create-car)
  - [Update Car](#update-car)
  - [Delete Car](#delete-car)
- [Jobs and Services](#jobs-and-services)
  - [Get All Jobs](#get-all-jobs)
  - [Get Part Items](#get-part-items)
- [Bookings](#bookings)
  - [Get All Bookings](#get-all-bookings)
  - [Create Booking](#create-booking)
  - [Delete Booking](#delete-booking)
- [Payments](#payments)
  - [Initiate Payment](#initiate-payment)
- [Authorization](#authorization)

## Authentication

### Login
- **URL**: `/api/auth/login`
- **Method**: POST
- **Description**: Authenticate a user and get a JWT token
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**:
  ```json
  {
    "responseObject": {
      "user": {
        "id": "string",
        "firstName": "string",
        "lastName": "string",
        "phone": "string",
        "email": "string",
        "role": "string",
        "updatedAt": "string",
        "zipCode": "string",
        "createdAt": "string"
      },
      "token": "string"
    }
  }
  ```

### Register
- **URL**: `/api/auth/register/client`
- **Method**: POST
- **Description**: Register a new client user
- **Request Body**:
  ```json
  {
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Response**: Returns the registered user data

### Logout
- **URL**: `/api/auth/logout`
- **Method**: GET
- **Description**: Log out the currently authenticated user
- **Authentication**: Required (JWT token in Authorization header)
- **Response**: Confirmation message

## User Profile

### Get User
- **URL**: `/api/users/:id`
- **Method**: GET
- **Description**: Get user details by ID
- **Authentication**: Required
- **Response**: User profile data with token

### Update User Address
- **URL**: `/api/users/:id`
- **Method**: PUT
- **Description**: Update user's zip code/address
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "zipCode": "string"
  }
  ```
- **Response**: Updated user profile data

## Cars

### Get All Cars
- **URL**: `/api/cars`
- **Method**: GET
- **Description**: Get all cars for the authenticated user
- **Authentication**: Required
- **Response**:
  ```json
  {
    "responseObject": [
      {
        "id": "string",
        "carNumber": "string",
        "model": "string",
        "make": "string",
        "bookings": [],
        "engineSize": "string",
        "dateOfManufacture": "string",
        "motExpiryDate": "string",
        "tecDocKType": "string",
        "vin": "string",
        "colour": "string",
        "fuelType": "string",
        "transmission": "string",
        "gearCount": 0,
        "bodyStyle": "string",
        "numberOfDoors": 0,
        "numberOfSeats": 0,
        "co2Emissions": 0,
        "isElectricVehicle": false,
        "vehicleTechnicalData": "string",
        "numberOfPreviousKeepers": 0,
        "wheelBase": 0,
        "vehicleLength": 0,
        "vehicleWidth": 0,
        "vehicleHeight": 0,
        "unladenWeight": 0,
        "fuelTankCapacity": 0,
        "createdAt": "string",
        "updatedAt": "string"
      }
    ]
  }
  ```

### Get Car by ID
- **URL**: `/api/cars/:id`
- **Method**: GET
- **Description**: Get a specific car by ID
- **Authentication**: Required
- **Response**: Single car object

### Create Car
- **URL**: `/api/cars`
- **Method**: POST
- **Description**: Register a new car
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "vrm": "string"
  }
  ```
- **Response**: Created car details

### Update Car
- **URL**: `/api/cars/:id`
- **Method**: PUT
- **Description**: Update car details
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "carNumber": "string",
    "make": "string",
    "model": "string"
  }
  ```
- **Response**: Updated car details

### Delete Car
- **URL**: `/api/cars/:id`
- **Method**: DELETE
- **Description**: Delete a car by ID
- **Authentication**: Required
- **Response**: Confirmation message

## Jobs and Services

### Get All Jobs
- **URL**: `/api/jobs`
- **Method**: GET
- **Description**: Get all available jobs/services
- **Authentication**: Required
- **Response**:
  ```json
  {
    "responseObject": [
      {
        "name": "string",
        "duration": 0,
        "searchQuery": "string",
        "id": "string"
      }
    ]
  }
  ```

### Get Part Items
- **URL**: `/api/jobs/articles`
- **Method**: POST
- **Description**: Get available part items for a specific vehicle and part type
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "vin": "string",
    "part": "string"
  }
  ```
- **Response**:
  ```json
  {
    "responseObject": [
      {
        "id": "string",
        "title": "string",
        "tier": "string",
        "top": ["string"],
        "price": 0,
        "category": 0
      }
    ]
  }
  ```

## Bookings

### Get All Bookings
- **URL**: `/api/bookings`
- **Method**: GET
- **Description**: Get all bookings for the authenticated user
- **Authentication**: Required
- **Response**:
  ```json
  {
    "responseObject": [
      {
        "id": "string",
        "car": {/* Car object */},
        "jobs": [/* Job objects */],
        "location": { "postalCode": "string" },
        "schedules": [
          {
            "id": "string",
            "timeInterval": "string",
            "dates": ["string"]
          }
        ],
        "jobsPrices": [
          {
            "id": "string",
            "price": 0,
            "duration": 0
          }
        ],
        "partItemsPrices": [
          {
            "id": "string",
            "price": 0
          }
        ],
        "partItems": [/* PartItem objects */],
        "totalPrice": 0,
        "createdAt": "string",
        "status": "string"
      }
    ]
  }
  ```

### Create Booking
- **URL**: `/api/bookings`
- **Method**: POST
- **Description**: Create a new booking
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "timeSlots": ["string"],
    "jobs": ["string"],
    "partItems": ["string"],
    "postalCode": "string",
    "selectedCar": "string"
  }
  ```
- **Response**: Created booking details

### Delete Booking
- **URL**: `/api/bookings/:id`
- **Method**: DELETE
- **Description**: Delete a booking by ID
- **Authentication**: Required
- **Response**: Confirmation message

## Payments

### Initiate Payment
- **URL**: `/api/pay`
- **Method**: POST
- **Description**: Initiate payment for a booking
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "id": "string",
    "redirectUrl": "http://localhost:5173/thank-you"
  }
  ```
- **Response**:
  ```json
  {
    "responseObject": {
      "href": "string" // URL to payment gateway
    }
  }
  ```

## Authorization

All endpoints (except login and register) require authentication. Include the JWT token in the Authorization header of each request:

```
Authorization: Bearer {token}
```

The token is obtained from the login response and should be stored securely on the client side. 
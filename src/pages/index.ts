// Core pages
export * from './LoginPage';
export * from './RegisterUser';
// export * from './ManageUsersPage';
export * from './ManageBookings';
export * from './ManageCars';
export * from './ManageParts';
export * from './ManageJobs';

// Additional pages
export * from './HomePage';
export * from './AdminDashboard';
export * from './ManageClients';
export * from './ManageMechanics';
export * from './MechanicDashboard';
export * from './NewCar';
export * from './ThankYou';
export * from './CheckAddress';

// Default exports need to be re-exported differently
export { default as RegisterMechanicPage } from './RegisterMechanic'; 
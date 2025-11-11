import '@auth0/nextjs-auth0';
import { ActiveDevice } from '../app/lib/types'; // Import our new type

declare module '@auth0/nextjs-auth0' {
  interface Session {
    deviceId?: string;
    needsProfileCompletion?: boolean;
    needsDeviceManagement?: boolean;
    newDeviceToAdd?: ActiveDevice | null;
  }
}
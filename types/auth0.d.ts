import '@auth0/nextjs-auth0';
import { ActiveDevice } from '../app/lib/type'; // Import our new type

declare module '@auth0/nextjs-auth0' {
  interface Session {
    deviceId?: string;
    needsProfileCompletion?: boolean;
    needsDeviceManagement?: boolean;
    newDeviceToAdd?: ActiveDevice | null;
    deviceAutoLoggedOut?: boolean;
  }
}
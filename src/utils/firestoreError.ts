import { FirebaseError } from 'firebase/app'

export function getFirestoreErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case 'permission-denied':
        return 'Permission denied. Please sign in again.'
      case 'unauthenticated':
        return 'Your session has expired. Please sign in again.'
      case 'unavailable':
        return 'Service unavailable. Check your connection and try again.'
      case 'not-found':
        return 'This item no longer exists.'
      case 'resource-exhausted':
        return 'Service limit reached. Please try again later.'
      case 'already-exists':
        return 'This item already exists.'
      default:
        return 'An unexpected error occurred. Please try again.'
    }
  }
  return 'An unexpected error occurred. Please try again.'
}

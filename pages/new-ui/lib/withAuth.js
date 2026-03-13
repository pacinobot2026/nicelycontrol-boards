import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from './authContext';

export default function withAuth(Component) {
  function AuthenticatedComponent(props) {
    const { session, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !session) {
        router.replace('/login');
      }
    }, [loading, session, router]);

    if (loading || !session) return null;

    return <Component {...props} />;
  }

  AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name || 'Component'})`;
  return AuthenticatedComponent;
}

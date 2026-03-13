import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/authContext';

export default function Home() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (session) {
        window.location.href = 'https://dashboard-gilt-one-zc4y5uu95v.vercel.app';
      } else {
        router.replace('/login');
      }
    }
  }, [loading, session, router]);

  return null;
}

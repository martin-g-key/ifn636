import React, { useEffect, useState } from 'react';
import ExpensesPage from './ExpensesPage';
import { validateSession } from '../api';

export default function ProtectedExpensesPage({ onInvalidToken }) {
    const [authStatus, setAuthStatus] = useState('checking');
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        let ignore = false;
        validateSession()
            .then(() => {
                if (!ignore) setAuthStatus('authenticated');
            })
            .catch((err) => {
                if (ignore) return;
                if (err.status === 401) {
                    onInvalidToken();
                } else {
                    setAuthError(err.message);
                    setAuthStatus('error');
                }
            });

        return () => { ignore = true; };
    }, [onInvalidToken]);

    if (authStatus === 'checking') {
        return <p>Checking session...</p>;
    }
    if (authStatus === 'error') {
        return <p style={{ color: 'red' }}>Unable to verify session: {authError}</p>;
    }

    return <ExpensesPage />;
}

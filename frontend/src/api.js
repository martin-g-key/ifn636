// endpoint for API calls between frontend to backend
const API_BASE = process.env.API_BASE;

// authHeaders
// create function to read saved token and build Authorisation header
function authHeaders() {
    const token = sessionStorage.getItem('token');
    return token ? { Authorization: 'Bearer ' + token } : {};
}

// fetchUsers
export async function fetchUsers() {
    const res = await fetch(`${API_BASE}/api/users`, { headers: {...authHeaders() } }); // changed to added in authenctication
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
}

// createUser
export async function createUser(username, password, role, employer_username) {
    const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() }, //changed to support authentication
        body: JSON.stringify({ username, password, role, employer_username }),
    });
    if (!res.ok) throw new Error('Failed to create user');
    return res.json();
}

// fetchEmployers
export async function fetchEmployers() {
    const res = await fetch(`${API_BASE}/api/users/employers`, { headers: { ...authHeaders() } });
    if (!res.ok) throw new Error('failed to fetch employers');
    return res.json();
}


// login
export async function login(username,password) {
    const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error('login failed');
    return res.json();
}

// updateUser
export async function updateUser(id, fields) {
    const res = await fetch(`${API_BASE}/api/users/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(fields),
    });
    if (!res.ok) throw new Error('failed to update user');
    return res.json();
}


// deleteUser
export async function deleteUser(id) {
    const res = await fetch(`${API_BASE}/api/users/${id}`, {
        method: 'DELETE',
        headers: { ...authHeaders() },
    });
    if (!res.ok) throw new Error('Failed to delete uesr');
    return true;
}


// fetchTrips (optional financial year filter)
export async function fetchTrips(finYear) {
    const query = finYear ? `?fin_year=${encodeURIComponent(finYear)}` : '';
    const res = await fetch(`${API_BASE}/api/trips${query}`, {
        headers: { ...authHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch trips');
    return res.json();
}

// updateTrip
export async function updateTrip(id, fields) {
    const res = await fetch(`${API_BASE}/api/trips/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json', ...authHeaders()},
        body: JSON.stringify(fields),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || 'Failed to update Trip');
    return body;
}

// deleteTrip
export async function deleteTrip(id) {
    const res = await fetch(`${API_BASE}/api/trips/${id}`, {
        method: 'DELETE',
        headers: { ...authHeaders() },
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to delete Trip');
    }
}

// createTrip 
export async function createTrip(trip) {
    const res = await fetch(`${API_BASE}/api/trips`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(trip),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || 'Failed to create trip');
    return body;
}

// fetchFinYears
export async function fetchFinYears() {
    const res = await fetch(`${API_BASE}/api/trips/fin-years`, {
        headers: { ...authHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch financial years');
    return res.json();
}

// fetchFinancialYears
// only returns years that actually have expenses in them, so the dropdown is never full of empty years
export async function fetchFinancialYears() {
    const res = await fetch(`${API_BASE}/api/reports/financial-years`, { headers: { ...authHeaders() } });
    if (!res.ok) throw new Error('Failed to fetch financial years');
    return res.json();
}


// fetchExpenseReport
// leave finYear empty to get every year back
export async function fetchExpenseReport(finYear) {
    if (sessionStorage.getItem('role') === 'Employee') {
        const expenses = await fetchExpenses();
        return finYear
            ? expenses.filter((expense) => expense.fin_year === finYear)
            : expenses;
    }

    const query = finYear ? `?fin_year=${finYear}` : '';
    const res = await fetch(`${API_BASE}/api/reports/expenses${query}`, { headers: { ...authHeaders() } });
    if (!res.ok) throw new Error('Failed to fetch expense report');
    return res.json();
}


// downloadExpenseReport
// the export route needs the token, and a plain link can't send an Authorization header,
// so fetch the file first and then hand the browser a temporary link to click
export async function downloadExpenseReport(finYear) {
    const query = finYear ? `&fin_year=${finYear}` : '';
    const res = await fetch(`${API_BASE}/api/reports/expenses/export?format=csv${query}`, {
        headers: { ...authHeaders() },
    });
    if (!res.ok) throw new Error('Failed to download expense report');

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'expenses.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);   // the blob stays in memory until this is called
}

export async function createExpense(expense) {
    // Reuse the saved JWT so the API can link the expense to the authenticated user.
    const res = await fetch(`${API_BASE}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(expense),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || 'Failed to create expense');
    return body;
}

export async function fetchExpenses() {
    // The JWT identifies the employee
    // the API returns only that employee's expenses.
    const res = await fetch(`${API_BASE}/api/expenses`, { headers: { ...authHeaders() } });
    if (!res.ok) throw new Error('Failed to fetch expenses');
    return res.json();
}

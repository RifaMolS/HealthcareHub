import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        medicalHistory: user?.regid?.medicalHistory || { diabetes: false, bp: false, thyroid: false, other: '' },
        membershipPlan: user?.regid?.membershipPlan || 'None'
    });

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://localhost:5001/health/update-profile/${user.regid._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData)
            });
            const data = await response.json();
            if (response.ok) {
                const updatedUser = { ...user, regid: { ...user.regid, ...profileData } };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                setIsEditing(false);
                alert('Profile updated successfully!');
            } else {
                alert(data.message || 'Update failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during update');
        }
    };

    if (!user) {
        return (
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <h2>Access Denied</h2>
                <button onClick={() => navigate('/login')}>Go to Login</button>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#4f46e5', color: 'white', padding: '1rem 2rem', borderRadius: '10px', marginBottom: '2rem' }}>
                <h1>Healthcare Hub</h1>
                <div>
                    <span style={{ marginRight: '1rem' }}>Welcome, {user.regid?.name}</span>
                    <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Logout</button>
                </div>
            </header>

            <main>
                <div style={{ background: 'white', padding: '2rem', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2>User Profile</h2>
                        {!isEditing && (
                            <button onClick={() => setIsEditing(true)} style={{ padding: '0.5rem 1.5rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                                Complete Profile (Health & Plan)
                            </button>
                        )}
                    </div>

                    {!isEditing ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                                <h3 style={{ color: '#4f46e5' }}>Personal Details</h3>
                                <p><strong>Email:</strong> {user.email}</p>
                                <p><strong>Phone:</strong> {user.regid?.phone}</p>
                                <p><strong>Address:</strong> {user.regid?.address}</p>
                                <p><strong>Membership:</strong> <span style={{ color: '#059669', fontWeight: 'bold' }}>{user.regid?.membershipPlan}</span></p>
                            </div>
                            <div>
                                <h3 style={{ color: '#4f46e5' }}>Medical Background</h3>
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    <li>Diabetes: {user.regid?.medicalHistory?.diabetes ? '✅' : '❌'}</li>
                                    <li>BP issues: {user.regid?.medicalHistory?.bp ? '✅' : '❌'}</li>
                                    <li>Thyroid: {user.regid?.medicalHistory?.thyroid ? '✅' : '❌'}</li>
                                    <li>Other: {user.regid?.medicalHistory?.other || 'None'}</li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleUpdateProfile}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div>
                                    <h3 style={{ color: '#4f46e5' }}>Medical Conditions</h3>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label><input type="checkbox" checked={profileData.medicalHistory.diabetes} onChange={(e) => setProfileData({ ...profileData, medicalHistory: { ...profileData.medicalHistory, diabetes: e.target.checked } })} /> Diabetes</label>
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label><input type="checkbox" checked={profileData.medicalHistory.bp} onChange={(e) => setProfileData({ ...profileData, medicalHistory: { ...profileData.medicalHistory, bp: e.target.checked } })} /> Blood Pressure</label>
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label><input type="checkbox" checked={profileData.medicalHistory.thyroid} onChange={(e) => setProfileData({ ...profileData, medicalHistory: { ...profileData.medicalHistory, thyroid: e.target.checked } })} /> Thyroid</label>
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label>Other: </label>
                                        <input type="text" value={profileData.medicalHistory.other} onChange={(e) => setProfileData({ ...profileData, medicalHistory: { ...profileData.medicalHistory, other: e.target.value } })} style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }} />
                                    </div>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <h3 style={{ color: '#4f46e5' }}>Select Membership</h3>
                                    <select value={profileData.membershipPlan} onChange={(e) => setProfileData({ ...profileData, membershipPlan: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '5px' }}>
                                        <option value="None">None</option>
                                        <option value="Tier 1: Grocery Delivery">Tier 1: Grocery Delivery</option>
                                        <option value="Tier 2: Home Cleaning & Maintenance">Tier 2: Home Cleaning & Maintenance</option>
                                        <option value="Tier 3: Diet Suggestions & Nurse">Tier 3: Diet Suggestions & Nurse</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                                <button type="submit" style={{ padding: '0.75rem 2rem', background: '#059669', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Save Changes</button>
                                <button type="button" onClick={() => setIsEditing(false)} style={{ padding: '0.75rem 2rem', background: '#9ca3af', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
                            </div>
                        </form>
                    )}
                </div>

                <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {user.regid?.membershipPlan.includes('Tier 1') && (
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '15px' }}>
                            <h3>🛒 Grocery Delivery</h3>
                            <button style={{ width: '100%', padding: '0.5rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Shop Now</button>
                        </div>
                    )}
                    {user.regid?.membershipPlan.includes('Tier 2') && (
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '15px' }}>
                            <h3>🧹 Home Cleaning</h3>
                            <button style={{ width: '100%', padding: '0.5rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Book Service</button>
                        </div>
                    )}
                    {user.regid?.membershipPlan.includes('Tier 3') && (
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '15px' }}>
                            <h3>🍎 AI Diet & Nurse</h3>
                            <button style={{ width: '100%', padding: '0.5rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Get Diet Plan</button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default Dashboard;

export const runtime = 'nodejs';
import axios from 'axios';

export const renewToken = async (token: string | null): Promise<string | null> => {
  if (!token) return null; // Return null if no token is provided

  try {
    const renewResponse = await axios.post(
      '/api/renew-token',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const newToken = renewResponse.data.token;
    if (typeof window !== 'undefined') localStorage.setItem('token', newToken); // Store the new token
    return newToken; // Return the new token
  } catch (error) {
    console.error('Token renewal failed:', error);
    return null; // Return null if renewal fails
  }
};

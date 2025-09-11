import fetch from 'node-fetch';

export async function pergamoLogin(user: string, pass: string): Promise<string | null> {
  try {
    const res = await fetch('https://backpergamo.hlips.com.co/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, pass })
    });
    const data = await res.json();
    if (data && data.token) {
      return data.token;
    }
    console.error('Login Pergamo fallido:', data);
    return null;
  } catch (e) {
    console.error('Error en login Pergamo:', e);
    return null;
  }
}

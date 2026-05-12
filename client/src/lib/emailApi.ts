export async function sendWelcomeEmail(email: string, userName?: string): Promise<{ success: boolean }> {
  try {
    const response = await fetch('/api/send-welcome-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, userName }),
    });

    if (!response.ok) {
      throw new Error('Failed to send welcome email');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false };
  }
}

export async function sendWhatsAppMessage(to: string, message: string) {
  const token = process.env.FONNTE_TOKEN;

  if (!token) {
    console.warn('[WhatsApp] FONNTE_TOKEN is not set in .env.local. Skipping WhatsApp notification.');
    console.log(`[WhatsApp Simulated Sent] To: ${to}\nMessage:\n${message}`);
    return false;
  }

  // Ensure 'to' starts with 62 instead of 0
  const formattedPhone = to.replace(/\D/g, '').replace(/^0/, '62');

  try {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: formattedPhone,
        message: message,
        countryCode: '62',
      }),
    });

    const data = await response.json();
    
    if (!response.ok || !data.status) {
      console.error('[WhatsApp] Failed to send message:', data);
      return false;
    }

    console.log('[WhatsApp] Notification sent successfully to', formattedPhone);
    return true;
  } catch (error) {
    console.error('[WhatsApp] Error sending message:', error);
    return false;
  }
}

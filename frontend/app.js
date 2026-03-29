const API_URL = 'https://taxifreising.onrender.com/api';

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('anfrageForm');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = 'Wird gesendet...';

    const data = {};
    new FormData(form).forEach((val, key) => { data[key] = val; });

    try {
      const res = await fetch(`${API_URL}/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        form.style.display = 'none';
        document.getElementById('successBox').style.display = 'block';
      } else {
        alert('Fehler: ' + (json.error || 'Unbekannter Fehler'));
        btn.disabled = false;
        btn.textContent = 'Anfrage senden / Send Request';
      }
    } catch (err) {
      alert('Verbindungsfehler. Bitte rufen Sie uns an: +49 151 4162 0000');
      btn.disabled = false;
      btn.textContent = 'Anfrage senden / Send Request';
    }
  });
});

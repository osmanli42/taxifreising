import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, run } from '../db';
import { Resend } from 'resend';

const router = Router();

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || '');
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'info@taxifreising.de';
const SITE_URL = process.env.SITE_URL || 'http://localhost:4002';
const API_URL = process.env.API_URL || 'http://localhost:4002';

// ─── DESIGN TOKENS ────────────────────────────────────
const C = {
  brand: '#0c2d48',
  brandLight: '#164e78',
  accent: '#0ea5e9',
  accentDark: '#0284c7',
  green: '#059669',
  greenLight: '#10b981',
  greenBg: '#ecfdf5',
  greenBorder: '#a7f3d0',
  gold: '#d97706',
  goldBg: '#fffbeb',
  goldBorder: '#fde68a',
  blueBg: '#f0f9ff',
  blueBorder: '#bae6fd',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  radius: '8px',
};

// ─── SHARED EMAIL COMPONENTS ───────────────────────────
function emailShell(content: string) {
  return `<!DOCTYPE html>
<html lang="de" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Taxi Freising</title>
  <!--[if mso]><style>table,td{font-family:Arial,sans-serif !important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">&nbsp;</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2f7;">
    <tr><td align="center" style="padding:32px 16px;">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        ${content}
      </table>

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding:28px 24px 8px;text-align:center;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:${C.gray600};letter-spacing:0.5px;">TAXI FREISING</p>
          <p style="margin:0 0 4px;font-size:12px;color:${C.gray400};">Eisvogelweg 2, 85356 Freising</p>
          <p style="margin:0 0 4px;font-size:12px;color:${C.gray400};">
            <a href="tel:+4915141620000" style="color:${C.gray400};text-decoration:none;">+49 151 4162 0000</a> &bull;
            <a href="mailto:info@taxifreising.de" style="color:${C.gray400};text-decoration:none;">info@taxifreising.de</a>
          </p>
          <div style="margin:16px auto 0;width:80px;height:1px;background:${C.gray200};"></div>
          <p style="margin:12px 0 0;font-size:11px;color:${C.gray400};">24/7 Taxiservice &bull; Festpreise &bull; Professioneller Service</p>
        </td></tr>
      </table>

    </td></tr>
  </table>
</body>
</html>`;
}

function headerBlock(icon: string, title: string, subtitle: string, bgColor: string = C.brand) {
  return `
        <tr><td style="background:linear-gradient(135deg,${bgColor} 0%,${bgColor}dd 100%);padding:36px 32px 28px;text-align:center;">
          <div style="font-size:36px;margin-bottom:12px;">${icon}</div>
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">${title}</h1>
          ${subtitle ? `<p style="margin:0;font-size:14px;color:rgba(255,255,255,0.75);line-height:1.5;">${subtitle}</p>` : ''}
        </td></tr>`;
}

function brandBar() {
  return `
        <tr><td style="background:${C.brand};padding:16px 32px;text-align:center;">
          <span style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.6);letter-spacing:2.5px;text-transform:uppercase;">Taxi Freising</span>
        </td></tr>`;
}

function sectionTitle(text: string) {
  return `<div style="font-size:11px;font-weight:700;color:${C.gray400};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:14px;">${text}</div>`;
}

function dataRow(label: string, value: string, isLast: boolean = false) {
  return `<tr>
    <td style="padding:11px 0;font-size:13px;color:${C.gray500};width:35%;vertical-align:top;${!isLast ? `border-bottom:1px solid ${C.gray100};` : ''}">${label}</td>
    <td style="padding:11px 0;font-size:14px;color:${C.gray900};font-weight:500;${!isLast ? `border-bottom:1px solid ${C.gray100};` : ''}">${value}</td>
  </tr>`;
}

function primaryButton(text: string, href: string, color: string = C.green) {
  return `
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr><td style="background:${color};border-radius:${C.radius};text-align:center;">
              <a href="${href}" target="_blank" style="display:inline-block;padding:16px 48px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.2px;">${text}</a>
            </td></tr>
          </table>`;
}

function featurePill(text: string) {
  return `<td style="padding:4px 6px;"><div style="padding:6px 14px;background:${C.greenBg};border:1px solid ${C.greenBorder};border-radius:20px;font-size:12px;color:${C.green};font-weight:600;white-space:nowrap;">${text}</div></td>`;
}

function contactBlock() {
  return `
          <div style="border-top:1px solid ${C.gray200};padding-top:24px;margin-top:8px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
              <tr>
                <td style="padding:10px 16px;background:${C.gray50};border-radius:${C.radius} 0 0 ${C.radius};text-align:center;width:50%;">
                  <a href="tel:+4915141620000" style="text-decoration:none;color:${C.gray700};">
                    <div style="font-size:18px;margin-bottom:2px;">📞</div>
                    <div style="font-size:13px;font-weight:600;">+49 151 4162 0000</div>
                  </a>
                </td>
                <td style="padding:10px 16px;background:${C.gray50};border-radius:0 ${C.radius} ${C.radius} 0;text-align:center;width:50%;border-left:1px solid ${C.gray200};">
                  <a href="https://wa.me/4915141620000" style="text-decoration:none;color:${C.gray700};">
                    <div style="font-size:18px;margin-bottom:2px;">💬</div>
                    <div style="font-size:13px;font-weight:600;">WhatsApp</div>
                  </a>
                </td>
              </tr>
            </table>
          </div>`;
}

function signOff(greeting: string = 'Mit freundlichen Grüßen') {
  return `
          <p style="font-size:14px;color:${C.gray700};margin:24px 0 0;line-height:1.7;">
            ${greeting},<br><strong style="color:${C.brand};">Ihr Taxi Freising Team</strong>
          </p>`;
}

// ─── POST / — New inquiry ──────────────────────────────
router.post('/', async (req, res) => {
  try {
    const token = uuidv4();
    const confirm_token = uuidv4();
    const { anrede, vorname, nachname, email, phone, abholort, zielort, flugnummer, abholdatum, abholzeit, fahrgaeste, fahrzeug, gepaeck, anmerkungen, kindersitz_baby, kindersitz_kinder, kindersitz_sitz } = req.body;

    await run(
      `INSERT INTO tf_inquiries (token, confirm_token, anrede, vorname, nachname, email, phone, abholort, zielort, flugnummer, abholdatum, abholzeit, fahrgaeste, fahrzeug, gepaeck, anmerkungen, kindersitz_baby, kindersitz_kinder, kindersitz_sitz)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [token, confirm_token, anrede, vorname, nachname, email, phone, abholort, zielort, flugnummer, abholdatum, abholzeit, fahrgaeste, fahrzeug, gepaeck, anmerkungen, kindersitz_baby || 0, kindersitz_kinder || 0, kindersitz_sitz || 0]
    );

    const resend = getResend();

    await resend.emails.send({
      from: 'Taxi Freising <info@taxifreising.de>',
      to: ADMIN_EMAIL,
      subject: `Neue Anfrage: ${vorname} ${nachname} | ${abholort} → ${zielort}`,
      html: emailShell(`
        ${brandBar()}
        ${headerBlock('📋', 'Neue Transferanfrage', `${vorname} ${nachname} wartet auf ein Angebot`, C.brand)}
        <tr><td style="padding:32px;">

          <div style="background:linear-gradient(135deg,${C.blueBg},#e0f2fe);border:1px solid ${C.blueBorder};border-radius:12px;padding:20px;margin-bottom:28px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
              <tr>
                <td style="width:44%;text-align:center;padding:8px;">
                  <div style="font-size:11px;color:${C.accentDark};font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Abholung</div>
                  <div style="font-size:15px;color:${C.gray900};font-weight:700;line-height:1.3;">${abholort}</div>
                </td>
                <td style="width:12%;text-align:center;padding:8px;">
                  <div style="font-size:22px;color:${C.accent};">→</div>
                </td>
                <td style="width:44%;text-align:center;padding:8px;">
                  <div style="font-size:11px;color:${C.accentDark};font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Ziel</div>
                  <div style="font-size:15px;color:${C.gray900};font-weight:700;line-height:1.3;">${zielort}</div>
                </td>
              </tr>
            </table>
            <div style="text-align:center;margin-top:8px;font-size:14px;color:${C.gray600};">📅 ${abholdatum} &bull; 🕐 ${abholzeit} Uhr</div>
          </div>

          ${sectionTitle('Kundendaten')}
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;">
            ${dataRow('Name', `${anrede} ${vorname} ${nachname}`)}
            ${dataRow('E-Mail', `<a href="mailto:${email}" style="color:${C.accent};text-decoration:none;">${email}</a>`)}
            ${dataRow('Telefon', `<a href="tel:${phone}" style="color:${C.accent};text-decoration:none;">${phone}</a>`)}
            ${dataRow('Fahrgäste', `${fahrgaeste} Person(en)`)}
            ${dataRow('Fahrzeug', fahrzeug || '–')}
            ${dataRow('Gepäck', gepaeck ? `${gepaeck} Stück` : '–')}
            ${req.body.kindersitz_baby || req.body.kindersitz_kinder || req.body.kindersitz_sitz ? dataRow('Kindersitz', `👶 ${req.body.kindersitz_baby || 0} | 🧒 ${req.body.kindersitz_kinder || 0} | 📦 ${req.body.kindersitz_sitz || 0}`) : ''}
            ${flugnummer ? dataRow('Flugnummer', flugnummer) : ''}
            ${anmerkungen ? dataRow('Anmerkungen', anmerkungen, true) : dataRow('Anmerkungen', '–', true)}
          </table>

          ${primaryButton('Angebot erstellen →', `${API_URL}/admin/quote/${token}`, C.brand)}
          <p style="text-align:center;font-size:12px;color:${C.gray400};margin-top:12px;">Klicken Sie, um dem Kunden ein Festpreisangebot per E-Mail zu senden.</p>

        </td></tr>
      `),
    });

    await resend.emails.send({
      from: 'Taxi Freising <info@taxifreising.de>',
      to: email,
      subject: 'Ihre Anfrage ist eingegangen – Taxi Freising',
      html: emailShell(`
        ${brandBar()}
        ${headerBlock('✉️', 'Anfrage erhalten', 'Vielen Dank! Wir melden uns in Kürze mit einem Angebot.', C.brand)}
        <tr><td style="padding:32px;">

          <p style="font-size:15px;color:${C.gray700};line-height:1.7;margin:0 0 8px;">
            Sehr geehrte${anrede === 'Frau' ? '' : 'r'} ${anrede} ${nachname},
          </p>
          <p style="font-size:14px;color:${C.gray600};line-height:1.7;margin:0 0 28px;">
            wir haben Ihre Anfrage erhalten und bearbeiten diese so schnell wie möglich. In Kürze erhalten Sie von uns ein persönliches Festpreisangebot per E-Mail.
          </p>

          <div style="background:${C.gray50};border-radius:12px;padding:24px;margin-bottom:28px;">
            ${sectionTitle('Zusammenfassung Ihrer Anfrage')}
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
              ${dataRow('Von', abholort)}
              ${dataRow('Nach', zielort)}
              ${dataRow('Datum', `${abholdatum} um ${abholzeit} Uhr`)}
              ${dataRow('Fahrgäste', `${fahrgaeste} Person(en)`)}
              ${req.body.kindersitz_baby || req.body.kindersitz_kinder || req.body.kindersitz_sitz ? dataRow('Kindersitz', `👶 ${req.body.kindersitz_baby || 0} | 🧒 ${req.body.kindersitz_kinder || 0} | 📦 ${req.body.kindersitz_sitz || 0}`, true) : ''}
            </table>
          </div>

          <div style="background:${C.greenBg};border:1px solid ${C.greenBorder};border-radius:12px;padding:20px;margin-bottom:28px;">
            <div style="font-size:14px;font-weight:700;color:${C.green};margin-bottom:10px;">So geht es weiter:</div>
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
              <tr>
                <td style="width:32px;vertical-align:top;padding:4px 0;">
                  <div style="width:24px;height:24px;background:${C.green};color:#fff;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;">1</div>
                </td>
                <td style="padding:4px 0 12px 8px;font-size:13px;color:${C.gray700};line-height:1.5;">Wir prüfen Ihre Anfrage und erstellen ein Angebot</td>
              </tr>
              <tr>
                <td style="width:32px;vertical-align:top;padding:4px 0;">
                  <div style="width:24px;height:24px;background:${C.green};color:#fff;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;">2</div>
                </td>
                <td style="padding:4px 0 12px 8px;font-size:13px;color:${C.gray700};line-height:1.5;">Sie erhalten eine E-Mail mit Ihrem persönlichen Festpreis</td>
              </tr>
              <tr>
                <td style="width:32px;vertical-align:top;padding:4px 0;">
                  <div style="width:24px;height:24px;background:${C.green};color:#fff;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;">3</div>
                </td>
                <td style="padding:4px 0 0 8px;font-size:13px;color:${C.gray700};line-height:1.5;">Mit einem Klick buchen Sie Ihren Transfer verbindlich</td>
              </tr>
            </table>
          </div>

          ${contactBlock()}
          ${signOff()}

        </td></tr>
      `),
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /quote/:token — Admin quote page data ────────
router.get('/quote/:token', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM tf_inquiries WHERE token = ?', [req.params.token]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const row: any = { ...rows[0] };
    delete row.confirm_token;
    res.json(row);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /quote/:token — Admin sends price offer ─────
router.post('/quote/:token', async (req, res) => {
  try {
    const { price, admin_note } = req.body;
    const rows = await query('SELECT * FROM tf_inquiries WHERE token = ?', [req.params.token]) as any[];
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const inq = rows[0];
    if (inq.status === 'confirmed') return res.status(409).json({ error: 'Already confirmed' });

    await run(
      `UPDATE tf_inquiries SET status='quoted', quoted_price=?, admin_note=?, quoted_at=NOW() WHERE token=?`,
      [price, admin_note || null, req.params.token]
    );

    const resend = getResend();

    await resend.emails.send({
      from: 'Taxi Freising <info@taxifreising.de>',
      to: inq.email,
      subject: `Ihr Angebot: ${price} € – Taxi Freising`,
      html: emailShell(`
        ${brandBar()}
        ${headerBlock('🚖', 'Ihr persönliches Angebot', 'Wir haben einen Festpreis für Ihren Transfer berechnet', C.brand)}
        <tr><td style="padding:32px;">

          <p style="font-size:15px;color:${C.gray700};line-height:1.7;margin:0 0 8px;">
            Sehr geehrte${inq.anrede === 'Frau' ? '' : 'r'} ${inq.anrede} ${inq.nachname},
          </p>
          <p style="font-size:14px;color:${C.gray600};line-height:1.7;margin:0 0 28px;">
            vielen Dank für Ihre Anfrage. Wir freuen uns, Ihnen folgendes Angebot zu unterbreiten:
          </p>

          <div style="background:linear-gradient(135deg,${C.brand} 0%,${C.brandLight} 100%);border-radius:16px;padding:32px;text-align:center;margin-bottom:28px;">
            <div style="font-size:13px;color:rgba(255,255,255,0.65);font-weight:600;text-transform:uppercase;letter-spacing:1.5px;">Ihr Festpreis</div>
            <div style="font-size:56px;font-weight:800;color:#ffffff;line-height:1.1;margin:12px 0 8px;letter-spacing:-1px;">${price} <span style="font-size:28px;font-weight:600;">€</span></div>
            <div style="font-size:12px;color:rgba(255,255,255,0.55);">Festpreis inkl. MwSt. &bull; Keine versteckten Kosten</div>
          </div>

          <div style="background:${C.gray50};border-radius:12px;padding:24px;margin-bottom:24px;">
            ${sectionTitle('Fahrtdetails')}
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
              ${dataRow('Abholung', inq.abholort)}
              ${dataRow('Ziel', inq.zielort)}
              ${dataRow('Datum', `${inq.abholdatum} um ${inq.abholzeit} Uhr`)}
              ${dataRow('Fahrgäste', `${inq.fahrgaeste} Person(en)`)}
              ${inq.gepaeck ? dataRow('Gepäck', `${inq.gepaeck} Stück`) : ''}
              ${inq.kindersitz_baby || inq.kindersitz_kinder || inq.kindersitz_sitz ? dataRow('Kindersitz', `👶 ${inq.kindersitz_baby || 0} | 🧒 ${inq.kindersitz_kinder || 0} | 📦 ${inq.kindersitz_sitz || 0}`) : ''}
            </table>
          </div>

          ${admin_note ? `
          <div style="background:${C.goldBg};border:1px solid ${C.goldBorder};border-radius:12px;padding:16px 20px;margin-bottom:24px;">
            <div style="font-size:13px;font-weight:700;color:${C.gold};margin-bottom:4px;">Hinweis:</div>
            <div style="font-size:14px;color:#92400e;line-height:1.6;">${admin_note}</div>
          </div>` : ''}

          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
            <tr>
              ${featurePill('Festpreis')}
              ${featurePill('60 Min. Wartezeit gratis')}
            </tr>
            <tr>
              ${featurePill('Kindersitz kostenlos')}
              ${featurePill('Kostenlose Stornierung')}
            </tr>
          </table>

          <p style="text-align:center;font-size:13px;color:${C.gray500};margin-bottom:24px;">⏰ Dieses Angebot ist <strong>48 Stunden</strong> gültig.</p>

          ${primaryButton('Jetzt buchen – Angebot annehmen ✓', `${SITE_URL}/bestaetigen.html?token=${inq.confirm_token}`, C.green)}
          <p style="text-align:center;font-size:12px;color:${C.gray400};margin-top:12px;">Mit einem Klick bestätigen Sie Ihre Buchung verbindlich.</p>

          ${contactBlock()}
          ${signOff()}

        </td></tr>
      `),
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /confirm/:confirm_token — Customer confirms ─
router.post('/confirm/:confirm_token', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM tf_inquiries WHERE confirm_token = ?', [req.params.confirm_token]) as any[];
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const inq = rows[0];
    if (inq.status === 'confirmed') return res.status(409).json({ error: 'Already confirmed' });

    await run(
      `UPDATE tf_inquiries SET status='confirmed', confirmed_at=NOW() WHERE confirm_token=?`,
      [req.params.confirm_token]
    );

    const resend = getResend();

    await resend.emails.send({
      from: 'Taxi Freising <info@taxifreising.de>',
      to: ADMIN_EMAIL,
      subject: `Buchung bestätigt: ${inq.vorname} ${inq.nachname} – ${inq.quoted_price} €`,
      html: emailShell(`
        ${brandBar()}
        ${headerBlock('✅', 'Buchung bestätigt!', `${inq.vorname} ${inq.nachname} hat das Angebot angenommen`, '#047857')}
        <tr><td style="padding:32px;">

          <div style="background:${C.greenBg};border:2px solid ${C.greenBorder};border-radius:14px;padding:24px;text-align:center;margin-bottom:28px;">
            <div style="font-size:14px;color:${C.green};font-weight:600;margin-bottom:4px;">Bestätigter Preis</div>
            <div style="font-size:42px;font-weight:800;color:#047857;letter-spacing:-1px;">${inq.quoted_price} €</div>
          </div>

          <div style="background:${C.gray50};border-radius:12px;padding:24px;margin-bottom:24px;">
            ${sectionTitle('Fahrt- & Kundendaten')}
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
              ${dataRow('Kunde', `${inq.anrede} ${inq.vorname} ${inq.nachname}`)}
              ${dataRow('E-Mail', `<a href="mailto:${inq.email}" style="color:${C.accent};text-decoration:none;">${inq.email}</a>`)}
              ${dataRow('Telefon', `<a href="tel:${inq.phone}" style="color:${C.accent};text-decoration:none;">${inq.phone}</a>`)}
              ${dataRow('Von', inq.abholort)}
              ${dataRow('Nach', inq.zielort)}
              ${dataRow('Datum', `${inq.abholdatum} um ${inq.abholzeit} Uhr`)}
              ${dataRow('Fahrgäste', `${inq.fahrgaeste} Person(en)`)}
              ${inq.gepaeck ? dataRow('Gepäck', `${inq.gepaeck} Stück`) : ''}
              ${inq.kindersitz_baby || inq.kindersitz_kinder || inq.kindersitz_sitz ? dataRow('Kindersitz', `👶 ${inq.kindersitz_baby || 0} | 🧒 ${inq.kindersitz_kinder || 0} | 📦 ${inq.kindersitz_sitz || 0}`) : ''}
              ${inq.fahrzeug ? dataRow('Fahrzeug', inq.fahrzeug) : ''}
              ${inq.flugnummer ? dataRow('Flugnummer', inq.flugnummer, true) : dataRow('Anmerkungen', inq.anmerkungen || '–', true)}
            </table>
          </div>

          <p style="text-align:center;font-size:13px;color:${C.gray500};">
            Der Kunde wurde automatisch per E-Mail über die Bestätigung informiert.
          </p>

        </td></tr>
      `),
    });

    await resend.emails.send({
      from: 'Taxi Freising <info@taxifreising.de>',
      to: inq.email,
      subject: `Buchungsbestätigung – Ihre Fahrt am ${inq.abholdatum}`,
      html: emailShell(`
        ${brandBar()}
        ${headerBlock('🎉', 'Buchung bestätigt!', 'Vielen Dank – Ihre Fahrt ist verbindlich reserviert', '#047857')}
        <tr><td style="padding:32px;">

          <p style="font-size:15px;color:${C.gray700};line-height:1.7;margin:0 0 8px;">
            Sehr geehrte${inq.anrede === 'Frau' ? '' : 'r'} ${inq.anrede} ${inq.nachname},
          </p>
          <p style="font-size:14px;color:${C.gray600};line-height:1.7;margin:0 0 28px;">
            Ihre Buchung wurde erfolgreich bestätigt. Wir freuen uns darauf, Sie zu Ihrem Termin zu fahren!
          </p>

          <div style="background:linear-gradient(135deg,#047857,${C.greenLight});border-radius:16px;padding:28px;text-align:center;margin-bottom:28px;">
            <div style="font-size:13px;color:rgba(255,255,255,0.7);font-weight:600;text-transform:uppercase;letter-spacing:1.5px;">Bestätigter Festpreis</div>
            <div style="font-size:48px;font-weight:800;color:#fff;margin:10px 0 6px;letter-spacing:-1px;">${inq.quoted_price} <span style="font-size:24px;">€</span></div>
            <div style="font-size:12px;color:rgba(255,255,255,0.55);">inkl. MwSt. &bull; Keine zusätzlichen Kosten</div>
          </div>

          <div style="background:${C.gray50};border-radius:12px;padding:24px;margin-bottom:28px;">
            ${sectionTitle('Ihre Fahrtdetails')}
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
              ${dataRow('Von', inq.abholort)}
              ${dataRow('Nach', inq.zielort)}
              ${dataRow('Datum', `${inq.abholdatum} um ${inq.abholzeit} Uhr`)}
              ${dataRow('Fahrgäste', `${inq.fahrgaeste} Person(en)`)}
              ${inq.gepaeck ? dataRow('Gepäck', `${inq.gepaeck} Stück`, true) : dataRow('Gepäck/Kindersitz', '–', true)}
            </table>
          </div>

          <div style="background:${C.blueBg};border:1px solid ${C.blueBorder};border-radius:12px;padding:20px;margin-bottom:28px;">
            <div style="font-size:14px;font-weight:700;color:${C.accentDark};margin-bottom:12px;">Wichtige Informationen</div>
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
              <tr>
                <td style="padding:6px 10px 6px 0;width:24px;vertical-align:top;font-size:16px;">🚗</td>
                <td style="padding:6px 0;font-size:13px;color:${C.gray700};line-height:1.5;">Unser Fahrer wartet pünktlich am vereinbarten Treffpunkt</td>
              </tr>
              <tr>
                <td style="padding:6px 10px 6px 0;width:24px;vertical-align:top;font-size:16px;">✈️</td>
                <td style="padding:6px 0;font-size:13px;color:${C.gray700};line-height:1.5;">Flughafen-Abholung: bis zu 60 Minuten kostenlose Wartezeit</td>
              </tr>
              <tr>
                <td style="padding:6px 10px 6px 0;width:24px;vertical-align:top;font-size:16px;">📋</td>
                <td style="padding:6px 0;font-size:13px;color:${C.gray700};line-height:1.5;">Abholung mit Namensschild am Ausgang der Gepäckausgabe</td>
              </tr>
              <tr>
                <td style="padding:6px 10px 6px 0;width:24px;vertical-align:top;font-size:16px;">❌</td>
                <td style="padding:6px 0;font-size:13px;color:${C.gray700};line-height:1.5;">Kostenlose Stornierung bis 3 Stunden vor Abfahrt</td>
              </tr>
            </table>
          </div>

          ${contactBlock()}
          ${signOff('Wir wünschen Ihnen eine angenehme Fahrt')}

        </td></tr>
      `),
    });

    res.json({ success: true, name: `${inq.vorname} ${inq.nachname}`, abholort: inq.abholort, zielort: inq.zielort, price: inq.quoted_price });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /quote-data/:confirm_token ────────────────────
router.get('/quote-data/:confirm_token', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM tf_inquiries WHERE confirm_token = ?', [req.params.confirm_token]) as any[];
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const row = rows[0];
    if (row.status !== 'quoted' && row.status !== 'confirmed') return res.status(400).json({ error: 'No offer yet' });
    res.json({
      abholort: row.abholort, zielort: row.zielort,
      abholdatum: row.abholdatum, abholzeit: row.abholzeit,
      fahrgaeste: row.fahrgaeste, quoted_price: row.quoted_price,
      status: row.status,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

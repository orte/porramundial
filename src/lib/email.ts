import nodemailer from 'nodemailer';
import { BUDGET } from '@/lib/constants';

/**
 * Envío de emails de confirmación de porra vía Gmail SMTP (Nodemailer).
 *
 * El email es un "extra": informa al participante y le da el enlace mágico de
 * edición. Nunca debe bloquear ni romper la creación de la porra — quien llama
 * a `sendEntryEmail` debe envolverla en try/catch y seguir adelante si falla.
 *
 * Textos en euskera, coherentes con el resto de la UI. La plantilla usa tablas
 * + estilos inline (sin clases, sin fuentes web, sin flex/grid) por la pobre
 * compatibilidad CSS de los clientes de correo.
 */

// Reutilizamos un único transporter entre invocaciones (Fluid Compute reaprovecha
// instancias, así que no tiene sentido recrearlo en cada envío).
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  return transporter;
}

type TeamLine = {
  name: string;
  flag: string;
  price: number;
  groupCode: string;
};

type GoldenBootLine = {
  name: string;
  isCustom: boolean;
  teamFlag: string | null;
  teamName: string | null;
  price: number;
};

export type SendEntryEmailInput = {
  to: string;
  participantName: string;
  teamName: string;
  teams: TeamLine[];
  goldenBoot: GoldenBootLine;
  totalSpent: number;
  magicLink: string;
  lockDate: Date;
  isUpdate: boolean;
};

// ─── PALETA (inline, sin Tailwind) ───────────────────────────────────────
const COLOR = {
  pageBg: '#0a140a',
  cardBg: '#11210f',
  cardBorder: '#3a5a32',
  gold: '#d8932f',
  goldLight: '#e8c27a',
  textLight: '#e8efe6',
  textMuted: '#a9c0a0',
  textFaint: '#7d9a74',
} as const;

function formatLockDate(d: Date): string {
  return new Intl.DateTimeFormat('eu', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Madrid',
  }).format(d);
}

function buildHtml(input: SendEntryEmailInput): string {
  const {
    participantName,
    teamName,
    teams,
    goldenBoot,
    totalSpent,
    magicLink,
    lockDate,
    isUpdate,
  } = input;

  const heading = isUpdate ? 'Zure porra eguneratu da' : 'Zure porra berretsi da';
  const intro = isUpdate
    ? `${participantName}, zure porra ondo eguneratu da. Hauek dira aldaketak:`
    : `${participantName}, eskerrik asko parte hartzeagatik. Hauek dira zure apustuak:`;

  const teamRows = teams
    .map(
      (t) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid ${COLOR.cardBorder};font-size:15px;color:${COLOR.textLight};">
          <span style="font-size:18px;">${t.flag}</span>&nbsp;${escapeHtml(t.name)}
          <span style="color:${COLOR.textFaint};font-size:12px;"> · ${escapeHtml(t.groupCode)} multzoa</span>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid ${COLOR.cardBorder};font-size:14px;color:${COLOR.goldLight};text-align:right;white-space:nowrap;">
          ${t.price}M&euro;
        </td>
      </tr>`,
    )
    .join('');

  const gbFlag = goldenBoot.teamFlag ?? '⚽';
  const gbSub = goldenBoot.isCustom
    ? 'Aukera librea · 1M€'
    : `${goldenBoot.teamName ?? ''} · ${goldenBoot.price}M€`;

  const remaining = BUDGET - totalSpent;

  return `<!DOCTYPE html>
<html lang="eu">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:${COLOR.pageBg};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLOR.pageBg};padding:24px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:${COLOR.cardBg};border:1px solid ${COLOR.cardBorder};border-radius:4px;font-family:Arial,Helvetica,sans-serif;">

        <!-- Cabecera -->
        <tr>
          <td style="padding:28px 28px 18px 28px;border-bottom:2px solid ${COLOR.gold};">
            <p style="margin:0 0 6px 0;font-size:11px;letter-spacing:3px;color:${COLOR.gold};text-transform:uppercase;">
              Mundiala 2026 · Porra
            </p>
            <h1 style="margin:0;font-size:28px;line-height:1.1;color:${COLOR.goldLight};">
              ${escapeHtml(teamName)}
            </h1>
            <p style="margin:8px 0 0 0;font-size:14px;color:${COLOR.textMuted};">
              ${escapeHtml(heading)}
            </p>
          </td>
        </tr>

        <!-- Intro -->
        <tr>
          <td style="padding:22px 28px 8px 28px;">
            <p style="margin:0;font-size:15px;line-height:1.5;color:${COLOR.textLight};">
              ${escapeHtml(intro)}
            </p>
          </td>
        </tr>

        <!-- Selecciones -->
        <tr>
          <td style="padding:14px 16px 0 16px;">
            <p style="margin:0 0 6px 12px;font-size:11px;letter-spacing:2px;color:${COLOR.gold};text-transform:uppercase;">
              5 selekzioak
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${teamRows}
            </table>
          </td>
        </tr>

        <!-- Bota de oro -->
        <tr>
          <td style="padding:20px 28px 0 28px;">
            <p style="margin:0 0 6px 0;font-size:11px;letter-spacing:2px;color:${COLOR.gold};text-transform:uppercase;">
              Urrezko Bota hautagaia
            </p>
            <p style="margin:0;font-size:18px;color:${COLOR.textLight};">
              <span style="font-size:20px;">${gbFlag}</span>&nbsp;${escapeHtml(goldenBoot.name)}
            </p>
            <p style="margin:2px 0 0 0;font-size:13px;color:${COLOR.textFaint};">
              ${escapeHtml(gbSub)}
            </p>
          </td>
        </tr>

        <!-- Presupuesto -->
        <tr>
          <td style="padding:18px 28px 0 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${COLOR.cardBorder};">
              <tr>
                <td style="padding:14px 0 0 0;font-size:14px;color:${COLOR.textMuted};">
                  Gastatua: <strong style="color:${COLOR.textLight};">${totalSpent}M&euro;</strong>
                  &nbsp;·&nbsp; Erabilgarri: <strong style="color:${COLOR.textLight};">${remaining}M&euro;</strong>
                  &nbsp;/&nbsp; ${BUDGET}M&euro;
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Botón editar -->
        <tr>
          <td style="padding:26px 28px 8px 28px;" align="center">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:4px;background-color:${COLOR.gold};">
                  <a href="${magicLink}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:bold;letter-spacing:1px;color:${COLOR.pageBg};text-decoration:none;">
                    EDITATU NIRE PORRA
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:14px 0 0 0;font-size:12px;color:${COLOR.textFaint};">
              Esteka pertsonal hau gorde ezazu: edozein gailutatik editatu dezakezu zure porra harekin.
            </p>
          </td>
        </tr>

        <!-- Aviso de bloqueo -->
        <tr>
          <td style="padding:18px 28px 28px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${COLOR.cardBorder};">
              <tr>
                <td style="padding:16px 0 0 0;font-size:13px;line-height:1.5;color:${COLOR.textMuted};">
                  Porra <strong style="color:${COLOR.goldLight};">${escapeHtml(formatLockDate(lockDate))}</strong> arte
                  editatu dezakezu. Ordu horretatik aurrera blokeatuko da eta ezingo da aldatu.
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>

      <p style="margin:16px 0 0 0;font-size:11px;color:${COLOR.textFaint};font-family:Arial,Helvetica,sans-serif;">
        Mundiala 2026 · Salabardoak S.L.
      </p>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function buildText(input: SendEntryEmailInput): string {
  const { participantName, teamName, teams, goldenBoot, totalSpent, magicLink, lockDate, isUpdate } =
    input;

  const heading = isUpdate ? 'Zure porra eguneratu da' : 'Zure porra berretsi da';
  const remaining = BUDGET - totalSpent;
  const teamLines = teams
    .map((t) => `  - ${t.name} (${t.groupCode} multzoa) · ${t.price}M€`)
    .join('\n');
  const gbSub = goldenBoot.isCustom
    ? 'Aukera librea · 1M€'
    : `${goldenBoot.teamName ?? ''} · ${goldenBoot.price}M€`;

  return [
    `${heading.toUpperCase()} — ${teamName}`,
    '',
    `${participantName}, hauek dira zure apustuak:`,
    '',
    '5 selekzioak:',
    teamLines,
    '',
    `Urrezko Bota hautagaia: ${goldenBoot.name} (${gbSub})`,
    '',
    `Gastatua: ${totalSpent}M€ · Erabilgarri: ${remaining}M€ / ${BUDGET}M€`,
    '',
    'Editatu zure porra hemen:',
    magicLink,
    '',
    `Porra ${formatLockDate(lockDate)} arte editatu dezakezu. Ordu horretatik aurrera blokeatuko da.`,
    '',
    'Mundiala 2026 · Salabardoak S.L.',
  ].join('\n');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Envía el email de confirmación (creación) o de actualización (edición) de una
 * porra. Lanza si Nodemailer falla — el llamador decide qué hacer (en la server
 * action lo envolvemos en try/catch para no romper la creación de la porra).
 */
export async function sendEntryEmail(input: SendEntryEmailInput): Promise<void> {
  const subject = input.isUpdate
    ? `Zure "${input.teamName}" porra eguneratu da`
    : `Zure "${input.teamName}" porra berretsi da`;

  await getTransporter().sendMail({
    from: `"Mundiala 2026 · Porra" <${process.env.SMTP_USER}>`,
    to: input.to,
    subject,
    text: buildText(input),
    html: buildHtml(input),
  });
}

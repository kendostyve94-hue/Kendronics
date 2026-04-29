import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { connect as netConnect, Socket } from 'node:net';
import { connect as tlsConnect, TLSSocket } from 'node:tls';
import { officialContactEmail } from '../../config/official-contact';
import { SupportTicket } from './entities/support-ticket.entity';

type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
};

type SmtpSocket = Socket | TLSSocket;

@Injectable()
export class EmailNotificationService {
  async sendSupportTicketNotification(ticket: SupportTicket): Promise<void> {
    const config = getSmtpConfig();
    const subject = `[Kendronics] ${ticket.ticketNumber} - ${ticket.subject}`;
    const body = [
      'New Kendronics support request',
      '',
      `Ticket: ${ticket.ticketNumber}`,
      `Category: ${ticket.category ?? 'support'}`,
      `Status: ${ticket.status}`,
      `Requester: ${ticket.requesterName ?? ticket.userId}`,
      `Requester email: ${ticket.requesterEmail ?? 'authenticated customer'}`,
      `Order ID: ${ticket.orderId ?? 'not provided'}`,
      `Attachment: ${ticket.attachmentName ?? 'none'}`,
      `Created at: ${ticket.createdAt.toISOString()}`,
      '',
      'Message:',
      ticket.message ?? '',
    ].join('\n');

    await sendSmtpMail(config, {
      to: officialContactEmail,
      replyTo: ticket.requesterEmail,
      subject,
      text: body,
    });
  }

  async sendProfileVerificationCode(input: { to: string; code: string; action: string }): Promise<void> {
    const config = getSmtpConfig();
    const subject = '[Kendronics] Code de verification du compte';
    const body = [
      'Code de verification Kendronics',
      '',
      `Action: ${labelForAction(input.action)}`,
      `Code: ${input.code}`,
      '',
      'Ce code expire dans 10 minutes.',
      "Si vous n'avez pas demande cette action, ignorez cet e-mail.",
    ].join('\n');

    await sendSmtpMail(config, {
      to: input.to,
      subject,
      text: body,
    });
  }
}

function labelForAction(action: string) {
  if (action === 'account') return 'Modification du compte';
  if (action === 'contacts') return 'Changement des contacts';
  if (action === 'delete') return 'Suppression du compte';
  return 'Verification du compte';
}

function getSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new ServiceUnavailableException(
      'SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS to deliver support emails.',
    );
  }

  return {
    host,
    port: Number(process.env.SMTP_PORT ?? 465),
    user,
    pass,
    from: process.env.SMTP_FROM ?? user,
  };
}

async function sendSmtpMail(
  config: SmtpConfig,
  message: { to: string; replyTo?: string; subject: string; text: string },
): Promise<void> {
  const connection = await openSmtpConnection(config);
  const socket = connection.socket;
  const reader = connection.reader;

  try {
    await command(socket, reader, 'AUTH LOGIN', [334]);
    await command(socket, reader, Buffer.from(config.user).toString('base64'), [334]);
    await command(socket, reader, Buffer.from(config.pass).toString('base64'), [235]);
    await command(socket, reader, `MAIL FROM:<${config.from}>`, [250]);
    await command(socket, reader, `RCPT TO:<${message.to}>`, [250, 251]);
    await command(socket, reader, 'DATA', [354]);
    socket.write(formatEmail(config.from, message));
    await reader.expect([250]);
    await command(socket, reader, 'QUIT', [221]);
  } finally {
    socket.end();
  }
}

async function openSmtpConnection(config: SmtpConfig): Promise<{ socket: SmtpSocket; reader: ReturnType<typeof createSmtpReader> }> {
  if (config.port === 587) {
    const plainSocket = await openPlainSocket(config.host, config.port);
    const plainReader = createSmtpReader(plainSocket);
    await plainReader.expect([220]);
    await command(plainSocket, plainReader, `EHLO ${process.env.SMTP_HELO_DOMAIN ?? 'kendronics.local'}`, [250]);
    await command(plainSocket, plainReader, 'STARTTLS', [220]);

    const tlsSocket = await upgradeSocket(plainSocket, config.host);
    const tlsReader = createSmtpReader(tlsSocket);
    await command(tlsSocket, tlsReader, `EHLO ${process.env.SMTP_HELO_DOMAIN ?? 'kendronics.local'}`, [250]);
    return { socket: tlsSocket, reader: tlsReader };
  }

  const socket = await openTlsSocket(config.host, config.port);
  const reader = createSmtpReader(socket);
  await reader.expect([220]);
  await command(socket, reader, `EHLO ${process.env.SMTP_HELO_DOMAIN ?? 'kendronics.local'}`, [250]);
  return { socket, reader };
}

function openPlainSocket(host: string, port: number): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = netConnect({ host, port }, () => resolve(socket));
    socket.once('error', reject);
  });
}

function openTlsSocket(host: string, port: number): Promise<TLSSocket> {
  return new Promise((resolve, reject) => {
    const socket = tlsConnect({ host, port, servername: host }, () => resolve(socket));
    socket.once('error', reject);
  });
}

function upgradeSocket(socket: Socket, host: string): Promise<TLSSocket> {
  return new Promise((resolve, reject) => {
    socket.removeAllListeners('data');
    const tlsSocket = tlsConnect({ socket, servername: host }, () => resolve(tlsSocket));
    tlsSocket.once('error', reject);
  });
}

function createSmtpReader(socket: SmtpSocket) {
  let buffer = '';
  const waiters: Array<{
    codes: number[];
    resolve: () => void;
    reject: (error: Error) => void;
  }> = [];

  socket.on('data', (chunk: Buffer) => {
    buffer += chunk.toString('utf8');
    flush();
  });

  socket.on('error', (error) => {
    while (waiters.length) {
      waiters.shift()?.reject(error);
    }
  });

  function flush() {
    while (waiters.length) {
      const response = readCompleteResponse();
      if (!response) return;
      const waiter = waiters.shift();
      const code = Number(response.slice(0, 3));
      if (waiter?.codes.includes(code)) {
        waiter.resolve();
      } else {
        waiter?.reject(new Error(`SMTP command failed: ${response.trim()}`));
      }
    }
  }

  function readCompleteResponse(): string | null {
    const lines = buffer.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return null;
    const lastLine = lines[lines.length - 1];
    if (!/^\d{3} /.test(lastLine)) return null;
    const response = lines.join('\n');
    buffer = '';
    return response;
  }

  return {
    expect(codes: number[]) {
      return new Promise<void>((resolve, reject) => {
        waiters.push({ codes, resolve, reject });
        flush();
      });
    },
  };
}

async function command(
  socket: SmtpSocket,
  reader: ReturnType<typeof createSmtpReader>,
  line: string,
  expectedCodes: number[],
) {
  socket.write(`${line}\r\n`);
  await reader.expect(expectedCodes);
}

function formatEmail(
  from: string,
  message: { to: string; replyTo?: string; subject: string; text: string },
): string {
  const headers = [
    `From: Kendronics <${from}>`,
    `To: ${message.to}`,
    message.replyTo ? `Reply-To: ${message.replyTo}` : '',
    `Subject: ${sanitizeHeader(message.subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
  ].filter(Boolean);

  const safeBody = message.text.replace(/^\./gm, '..');
  return `${headers.join('\r\n')}\r\n\r\n${safeBody}\r\n.\r\n`;
}

function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n]/g, ' ').trim();
}

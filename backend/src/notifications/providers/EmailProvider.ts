import { INotificationProvider } from '../channels/NotificationProvider';
import { ProviderResponse } from '../types';
import { config } from '../../config/config';
import { LoggerService } from '../../mastra/services/loggerService';
import net from 'net';
import tls from 'tls';

export class EmailProvider implements INotificationProvider {
  private log = new LoggerService('EmailProvider');

  async send(recipients: string[], message: string, subject?: string): Promise<ProviderResponse> {
    const smtpHost = config.notifications.smtp.host;
    const smtpPort = config.notifications.smtp.port;
    const smtpUser = config.notifications.smtp.user;
    const smtpPass = config.notifications.smtp.pass;
    const smtpFrom = config.notifications.smtp.from || 'noreply@sentinelflow.ai';

    const targetEmails = recipients.filter(r => r.includes('@'));
    if (targetEmails.length === 0) {
      return { success: false, error: 'No valid recipient email addresses found' };
    }

    if (!smtpHost) {
      // Mock SMTP send in development / when not configured
      const details = `[SMTP Email Mock] From: ${smtpFrom} | To: ${targetEmails.join(', ')} | Subject: ${subject || 'None'} | Message: ${message}`;
      this.log.info(details);
      return {
        success: true,
        providerResponse: { mocked: true, sentAt: new Date().toISOString() }
      };
    }

    // Direct SMTP protocol implementation using Net/TLS sockets
    return new Promise((resolve) => {
      let socket: net.Socket;
      const secure = smtpPort === 465;

      const steps: string[] = [];
      let stepIndex = 0;

      const finish = (success: boolean, responseOrError: any) => {
        try {
          socket.write('QUIT\r\n');
          socket.end();
        } catch {}
        if (success) {
          resolve({ success: true, providerResponse: responseOrError });
        } else {
          resolve({ success: false, error: responseOrError });
        }
      };

      const handleData = (data: string) => {
        const lines = data.split('\r\n');
        for (const line of lines) {
          if (!line) continue;
          const code = line.substr(0, 3);
          
          if (stepIndex === 0 && code === '220') {
            socket.write(`EHLO ${smtpHost}\r\n`);
            stepIndex = 1;
          } else if (stepIndex === 1 && (code === '250' || code === '220')) {
            if (smtpUser && smtpPass) {
              const authPlain = Buffer.from(`\0${smtpUser}\0${smtpPass}`).toString('base64');
              socket.write(`AUTH PLAIN ${authPlain}\r\n`);
              stepIndex = 2;
            } else {
              socket.write(`MAIL FROM:<${smtpFrom}>\r\n`);
              stepIndex = 3;
            }
          } else if (stepIndex === 2 && code === '235') {
            socket.write(`MAIL FROM:<${smtpFrom}>\r\n`);
            stepIndex = 3;
          } else if (stepIndex === 3 && code === '250') {
            // Send RCPT TO for each recipient
            for (const email of targetEmails) {
              socket.write(`RCPT TO:<${email}>\r\n`);
            }
            stepIndex = 4;
          } else if (stepIndex === 4 && code === '250') {
            socket.write('DATA\r\n');
            stepIndex = 5;
          } else if (stepIndex === 5 && code === '354') {
            const emailBody = [
              `From: ${smtpFrom}`,
              `To: ${targetEmails.join(', ')}`,
              `Subject: ${subject || 'SentinelFlow Notification'}`,
              'Content-Type: text/plain; charset=utf-8',
              '',
              message,
              '.',
              ''
            ].join('\r\n');
            socket.write(emailBody);
            stepIndex = 6;
          } else if (stepIndex === 6 && code === '250') {
            finish(true, { messageId: line });
          } else if (parseInt(code) >= 400) {
            finish(false, `SMTP error code ${code}: ${line}`);
            break;
          }
        }
      };

      try {
        if (secure) {
          socket = tls.connect(smtpPort, smtpHost, { rejectUnauthorized: false }, () => {
            socket.setEncoding('utf8');
          });
        } else {
          socket = net.connect(smtpPort, smtpHost, () => {
            socket.setEncoding('utf8');
          });
        }

        socket.on('data', (chunk) => {
          handleData(chunk.toString());
        });

        socket.on('error', (err) => {
          resolve({ success: false, error: `Socket error: ${err.message}` });
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Connection error';
        resolve({ success: false, error: msg });
      }
    });
  }
}

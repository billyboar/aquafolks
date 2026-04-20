package service

import (
	"bytes"
	"fmt"
	"html/template"
	"net/smtp"
)

type EmailService struct {
	smtpHost     string
	smtpPort     string
	smtpUsername string
	smtpPassword string
	fromEmail    string
	fromName     string
}

func NewEmailService(smtpHost, smtpPort, smtpUsername, smtpPassword, fromEmail, fromName string) *EmailService {
	return &EmailService{
		smtpHost:     smtpHost,
		smtpPort:     smtpPort,
		smtpUsername: smtpUsername,
		smtpPassword: smtpPassword,
		fromEmail:    fromEmail,
		fromName:     fromName,
	}
}

// SendPasswordResetEmail sends a password reset email with the reset token
func (s *EmailService) SendPasswordResetEmail(toEmail, resetToken, baseURL string) error {
	resetURL := fmt.Sprintf("%s/reset-password?token=%s", baseURL, resetToken)

	subject := "Password Reset Request - AquaFolks"
	htmlBody := s.generatePasswordResetHTML(resetURL)
	textBody := fmt.Sprintf("You requested a password reset. Click the link below to reset your password:\n\n%s\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.", resetURL)

	return s.sendEmail(toEmail, subject, htmlBody, textBody)
}

// generatePasswordResetHTML generates the HTML email template
func (s *EmailService) generatePasswordResetHTML(resetURL string) string {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="padding: 40px;">
                            <h1 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Password Reset Request</h1>
                            <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
                                You recently requested to reset your password for your AquaFolks account. Click the button below to reset it.
                            </p>
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{.ResetURL}}" style="background-color: #3b82f6; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Reset Password</a>
                                    </td>
                                </tr>
                            </table>
                            <p style="color: #666; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
                                This password reset link will expire in <strong>1 hour</strong>.
                            </p>
                            <p style="color: #666; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
                                If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                            </p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                            <p style="color: #999; font-size: 12px; margin: 0;">
                                If the button doesn't work, copy and paste this link into your browser:<br>
                                <a href="{{.ResetURL}}" style="color: #3b82f6; word-break: break-all;">{{.ResetURL}}</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`

	t, err := template.New("passwordReset").Parse(tmpl)
	if err != nil {
		return textBody(resetURL)
	}

	var buf bytes.Buffer
	data := struct {
		ResetURL string
	}{
		ResetURL: resetURL,
	}

	err = t.Execute(&buf, data)
	if err != nil {
		return textBody(resetURL)
	}

	return buf.String()
}

func textBody(resetURL string) string {
	return fmt.Sprintf("You requested a password reset. Click the link below to reset your password:\n\n%s\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.", resetURL)
}

// sendEmail sends an email using SMTP
func (s *EmailService) sendEmail(to, subject, htmlBody, textBody string) error {
	// If SMTP is not configured, log the email instead (for development)
	if s.smtpHost == "" || s.smtpUsername == "" {
		fmt.Printf("\n=== EMAIL (Development Mode) ===\n")
		fmt.Printf("To: %s\n", to)
		fmt.Printf("Subject: %s\n", subject)
		fmt.Printf("Body:\n%s\n", textBody)
		fmt.Printf("================================\n\n")
		return nil
	}

	// Create email message
	from := fmt.Sprintf("%s <%s>", s.fromName, s.fromEmail)
	msg := []byte(fmt.Sprintf(
		"From: %s\r\n"+
			"To: %s\r\n"+
			"Subject: %s\r\n"+
			"MIME-Version: 1.0\r\n"+
			"Content-Type: multipart/alternative; boundary=\"boundary\"\r\n"+
			"\r\n"+
			"--boundary\r\n"+
			"Content-Type: text/plain; charset=\"UTF-8\"\r\n"+
			"\r\n"+
			"%s\r\n"+
			"--boundary\r\n"+
			"Content-Type: text/html; charset=\"UTF-8\"\r\n"+
			"\r\n"+
			"%s\r\n"+
			"--boundary--",
		from, to, subject, textBody, htmlBody,
	))

	// Set up authentication
	auth := smtp.PlainAuth("", s.smtpUsername, s.smtpPassword, s.smtpHost)

	// Send email
	addr := fmt.Sprintf("%s:%s", s.smtpHost, s.smtpPort)
	err := smtp.SendMail(addr, auth, s.fromEmail, []string{to}, msg)
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}

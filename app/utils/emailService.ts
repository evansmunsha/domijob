import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

// Update the email template in your sendEmail function

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: "MiJob <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: html,
    })

    if (error) {
      console.error("Error sending email:", error)
      throw error
    }

    console.log("Email sent successfully:", data)
    return data
  } catch (error) {
    console.error("Error sending email:", error)
    throw error
  }
}


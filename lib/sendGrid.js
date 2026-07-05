import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);


const msg = {
    to: '', // Change to your recipient
    from: 'test@example.com', // Change to your verified sender
    subject: 'Sending with SendGrid is Fun',
    text: 'and easy to do anywhere, even with Node.js',
    html: '<strong>and easy to do anywhere, even with Node.js</strong>',
}

export const sendPayoutEmail = async ({ to, subject, text, html }) => {
    const msg = {
        to,
        from: process.env.SENDGRID_SENDER_EMAIL,
        subject,
        text,
        html,
    };

    let response;
    try {
        response = await sgMail.send(msg);
    } catch (error) {
        console.error("Error sending email: ", error);
    }

    console.log("Response: ", response);

    return response;
};


// sgMail
//     .send(msg)
//     .then((response) => {
//         console.log(response[0].statusCode)
//         console.log(response[0].headers)
//     })
//     .catch((error) => {
//         console.error(error)
//     })
const Mpesa = require('mpesa-node');

console.log('MPESA_CONSUMER_KEY:', process.env.MPESA_CONSUMER_KEY);

const mpesa = new Mpesa({
    consumerKey: process.env.MPESA_CONSUMER_KEY,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET,
    initiatorPassword: process.env.MPESA_INITIATOR_PASSWORD,
    certificatePath: null, // Not needed for sandbox
    environment: 'sandbox', // Change to 'production' for live
    shortCode: process.env.MPESA_SHORTCODE,
    lipaNaMpesaShortCode: process.env.MPESA_LIPA_SHORTCODE,
    lipaNaMpesaPassKey: process.env.MPESA_PASSKEY,
    callbackUrl: process.env.MPESA_CALLBACK_URL
});

async function stkPush({ amount, phone, accountReference, transactionDesc }) {
    return mpesa.lipaNaMpesaOnline(
        phone,
        amount,
        process.env.MPESA_CALLBACK_URL,
        accountReference,
        transactionDesc,
        'CustomerPayBillOnline',
        process.env.MPESA_LIPA_SHORTCODE,
        process.env.MPESA_PASSKEY
    );
}

module.exports = {
    stkPush
}; 
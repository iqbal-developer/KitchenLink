const paypal = require('@paypal/checkout-server-sdk');

// Configure PayPal environment
const environment = new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);

// Create PayPal order
async function createOrder(total, currency = 'USD') {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
            amount: {
                currency_code: currency,
                value: total.toFixed(2)
            }
        }]
    });
    return await client.execute(request);
}

// Capture PayPal order
async function captureOrder(orderId) {
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});
    return await client.execute(request);
}

module.exports = {
    createOrder,
    captureOrder
}; 